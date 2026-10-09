import sql from "mssql";
import { getCementerioPool } from "@/lib/db/cementerio";
import { toOptionalString, toSqlDate } from "@/lib/db/sqlParams";
import { TIPO_OCUPACION_PRESTAMO } from "@/lib/ocupaciones/tipos";
import {
  assertNichoDisponible,
  marcarNichoOcupado,
} from "@/lib/repositories/nichos";
import {
  addMonthsFromDateStr,
  toDateOnlyString,
  validateFechasFallecido,
} from "@/lib/utils/dates";

const GARANTE_COD_MANUAL = "MANUAL-MAPA";

export async function registrarPrestamoDesdeMapa(input: {
  idNicho: number;
  idFallecido: number;
  fechaInicio: string;
  fechaVencimiento?: string | null;
  garanteNombre: string;
  garanteDni?: string | null;
  observaciones?: string | null;
  idUsuario: number | null;
}) {
  const fechaInicio = toSqlDate(input.fechaInicio);
  if (!fechaInicio) throw new Error("La fecha de sepultura no es válida");

  const vencStr =
    input.fechaVencimiento?.trim() ||
    toDateOnlyString(addMonthsFromDateStr(input.fechaInicio, 6))!;
  const fechaVenc = toSqlDate(vencStr);
  if (!fechaVenc) throw new Error("La fecha de vencimiento no es válida");

  const pool = await getCementerioPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    await assertNichoDisponible(tx, input.idNicho);

    const fRes = await new sql.Request(tx)
      .input("idF", sql.Int, input.idFallecido)
      .query(`
        SELECT ID_FALLECIDO, APELLIDO, NOMBRE, ACTIVO, FECHA_FALLECIMIENTO
        FROM dbo.FALLECIDOS WITH (UPDLOCK, ROWLOCK)
        WHERE ID_FALLECIDO = @idF
      `);
    const f = fRes.recordset[0] as {
      APELLIDO: string;
      NOMBRE: string | null;
      ACTIVO: boolean;
      FECHA_FALLECIMIENTO: Date | null;
    };
    if (!f?.ACTIVO) throw new Error("El fallecido no existe o está inactivo");

    const dateErr = validateFechasFallecido({
      fechaFallecimiento: toDateOnlyString(f.FECHA_FALLECIMIENTO),
      fechaSepultura: input.fechaInicio,
    });
    if (dateErr) throw new Error(dateErr);

    const ocupInsert = await new sql.Request(tx)
      .input("idNicho", sql.Int, input.idNicho)
      .input("idFallecido", sql.Int, input.idFallecido)
      .input("fechaInicio", sql.Date, fechaInicio)
      .input("fechaVenc", sql.Date, fechaVenc)
      .input("tipo", sql.VarChar(30), TIPO_OCUPACION_PRESTAMO)
      .input("usuario", sql.Int, input.idUsuario)
      .input("obs", sql.NVarChar(sql.MAX), toOptionalString(input.observaciones ?? null))
      .query(`
        INSERT INTO dbo.OCUPACIONES_NICHO (
          ID_NICHO, ID_FALLECIDO, FECHA_INICIO, TIPO_OCUPACION,
          FECHA_VENCIMIENTO, ESTADO, OBSERVACIONES, USUARIO_ALTA
        )
        OUTPUT INSERTED.ID_OCUPACION
        VALUES (@idNicho, @idFallecido, @fechaInicio, @tipo, @fechaVenc, 'ACTIVO', @obs, @usuario)
      `);
    const idOcupacion = Number(ocupInsert.recordset[0].ID_OCUPACION);

    const garInsert = await new sql.Request(tx)
      .input("codSoc", sql.VarChar(20), GARANTE_COD_MANUAL)
      .input("nombre", sql.NVarChar(200), input.garanteNombre.trim())
      .input("dni", sql.VarChar(20), toOptionalString(input.garanteDni ?? null))
      .input("fechaConsulta", sql.DateTime2, new Date())
      .query(`
        INSERT INTO dbo.GARANTES (
          COD_SOC_SNAPSHOT, NOMBRE, DNI, ESTADO_PFC_SNAPSHOT, FECHA_CONSULTA_PFC
        )
        OUTPUT INSERTED.ID_GARANTE
        VALUES (@codSoc, @nombre, @dni, N'Registro manual desde mapa', @fechaConsulta)
      `);
    const idGarante = Number(garInsert.recordset[0].ID_GARANTE);

    const prestInsert = await new sql.Request(tx)
      .input("idOcup", sql.Int, idOcupacion)
      .input("idGar", sql.Int, idGarante)
      .input("inicio", sql.Date, fechaInicio)
      .input("venc", sql.Date, fechaVenc)
      .input("usuario", sql.Int, input.idUsuario)
      .input("obs", sql.NVarChar(sql.MAX), toOptionalString(input.observaciones ?? null))
      .query(`
        INSERT INTO dbo.PRESTAMOS_NICHO (
          ID_OCUPACION, ID_GARANTE, FECHA_INICIO, FECHA_VENCIMIENTO, ESTADO, OBSERVACIONES, USUARIO_ALTA
        )
        OUTPUT INSERTED.ID_PRESTAMO
        VALUES (@idOcup, @idGar, @inicio, @venc, 'ACTIVO', @obs, @usuario)
      `);
    const idPrestamo = Number(prestInsert.recordset[0].ID_PRESTAMO);

    await marcarNichoOcupado(tx, input.idNicho);
    await tx.commit();

    const nombre = [f.APELLIDO, f.NOMBRE].filter(Boolean).join(", ");
    return {
      idOcupacion,
      idPrestamo,
      idFallecido: input.idFallecido,
      fallecidoNombre: nombre,
      fechaSepultura: input.fechaInicio,
      fechaVencimiento: vencStr,
      garanteNombre: input.garanteNombre.trim(),
      estadoVisual: "PRESTAMO" as const,
    };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}
