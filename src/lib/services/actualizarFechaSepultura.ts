import sql from "mssql";
import { getCementerioPool } from "@/lib/db/cementerio";
import { toSqlDate } from "@/lib/db/sqlParams";
import {
  addMonthsFromDateStr,
  toDateOnlyString,
  validateFechasFallecido,
} from "@/lib/utils/dates";

export async function actualizarFechaSepulturaOcupacion(
  idOcupacion: number,
  nuevaFechaStr: string,
): Promise<{
  fechaAnterior: string;
  fechaNueva: string;
  idFallecido: number;
  idPrestamo: number | null;
}> {
  const pool = await getCementerioPool();
  const prev = await pool.request().input("id", sql.Int, idOcupacion).query(`
    SELECT
      o.ID_OCUPACION,
      o.ID_FALLECIDO,
      o.ESTADO,
      o.TIPO_OCUPACION,
      o.FECHA_INICIO,
      f.FECHA_FALLECIMIENTO,
      pr.ID_PRESTAMO
    FROM dbo.OCUPACIONES_NICHO o
    INNER JOIN dbo.FALLECIDOS f ON f.ID_FALLECIDO = o.ID_FALLECIDO
    LEFT JOIN dbo.PRESTAMOS_NICHO pr ON pr.ID_OCUPACION = o.ID_OCUPACION
      AND pr.ESTADO NOT IN ('RESUELTO', 'TRASLADADO')
    WHERE o.ID_OCUPACION = @id
  `);

  const row = prev.recordset[0] as Record<string, unknown> | undefined;
  if (!row) throw new Error("Ocupación no encontrada");
  if (String(row.ESTADO) !== "ACTIVO") {
    throw new Error("Solo se puede modificar la fecha de una ocupación activa");
  }

  const fechaNueva = toSqlDate(nuevaFechaStr);
  if (!fechaNueva) throw new Error("La fecha de sepultura no es válida");

  const fechaFall = toDateOnlyString(row.FECHA_FALLECIMIENTO as Date | string);
  const err = validateFechasFallecido({
    fechaFallecimiento: fechaFall,
    fechaSepultura: nuevaFechaStr,
  });
  if (err) throw new Error(err);

  const fechaAnterior = toDateOnlyString(row.FECHA_INICIO as Date | string) ?? "";
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const req = new sql.Request(tx);
    req.input("id", sql.Int, idOcupacion);
    req.input("fecha", sql.Date, fechaNueva);

    const fechaVenc =
      String(row.TIPO_OCUPACION) === "OCUPACION_PRESTAMO"
        ? addMonthsFromDateStr(nuevaFechaStr, 6)
        : null;

    await req
      .input("fechaVenc", sql.Date, fechaVenc)
      .query(`
        UPDATE dbo.OCUPACIONES_NICHO
        SET FECHA_INICIO = @fecha,
            FECHA_VENCIMIENTO = @fechaVenc
        WHERE ID_OCUPACION = @id
      `);

    const idPrestamo = row.ID_PRESTAMO != null ? Number(row.ID_PRESTAMO) : null;
    if (idPrestamo) {
      const vencPrest = addMonthsFromDateStr(nuevaFechaStr, 6);
      await new sql.Request(tx)
        .input("idPrest", sql.Int, idPrestamo)
        .input("inicio", sql.Date, fechaNueva)
        .input("venc", sql.Date, vencPrest)
        .query(`
          UPDATE dbo.PRESTAMOS_NICHO
          SET FECHA_INICIO = @inicio, FECHA_VENCIMIENTO = @venc
          WHERE ID_PRESTAMO = @idPrest
        `);
    }

    await tx.commit();
    return {
      fechaAnterior,
      fechaNueva: nuevaFechaStr,
      idFallecido: Number(row.ID_FALLECIDO),
      idPrestamo,
    };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

export async function actualizarFechaSepulturaExterna(
  idUbicacionExterna: number,
  nuevaFechaStr: string,
): Promise<{ fechaAnterior: string | null; fechaNueva: string; idFallecido: number }> {
  const pool = await getCementerioPool();
  const prev = await pool
    .request()
    .input("id", sql.Int, idUbicacionExterna)
    .query(`
      SELECT ue.ID_UBICACION_EXTERNA, ue.ID_FALLECIDO, ue.FECHA_SEPULTURA, f.FECHA_FALLECIMIENTO
      FROM dbo.UBICACIONES_EXTERNAS ue
      INNER JOIN dbo.FALLECIDOS f ON f.ID_FALLECIDO = ue.ID_FALLECIDO
      WHERE ue.ID_UBICACION_EXTERNA = @id AND ue.ACTIVO = 1
    `);
  const row = prev.recordset[0] as Record<string, unknown> | undefined;
  if (!row) throw new Error("Ubicación externa no encontrada");

  const fechaNueva = toSqlDate(nuevaFechaStr);
  if (!fechaNueva) throw new Error("La fecha de sepultura no es válida");

  const err = validateFechasFallecido({
    fechaFallecimiento: toDateOnlyString(row.FECHA_FALLECIMIENTO as Date | string),
    fechaSepultura: nuevaFechaStr,
  });
  if (err) throw new Error(err);

  await pool
    .request()
    .input("id", sql.Int, idUbicacionExterna)
    .input("fecha", sql.Date, fechaNueva)
    .query(`
      UPDATE dbo.UBICACIONES_EXTERNAS SET FECHA_SEPULTURA = @fecha
      WHERE ID_UBICACION_EXTERNA = @id
    `);

  return {
    fechaAnterior: toDateOnlyString(row.FECHA_SEPULTURA as Date | string),
    fechaNueva: nuevaFechaStr,
    idFallecido: Number(row.ID_FALLECIDO),
  };
}
