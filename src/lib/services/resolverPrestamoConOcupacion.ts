import sql from "mssql";
import { getCementerioPool } from "@/lib/db/cementerio";
import { toSqlDate } from "@/lib/db/sqlParams";
import { finalizarOcupacion } from "./finalizarOcupacion";

export type ResolverPrestamoInput = {
  idPrestamo: number;
  resolucion: string;
  estado: "RESUELTO" | "TRASLADADO" | "CONVERTIDO_EN_ARANCEL";
  fechaResolucion?: string;
  idUsuario: number;
};

/**
 * Resuelve un préstamo. Solo TRASLADADO finaliza la ocupación y libera el nicho.
 * Vencimiento no implica liberación automática.
 */
export async function resolverPrestamoConOcupacion(
  input: ResolverPrestamoInput,
): Promise<{
  ocupacionFinalizada: boolean;
  idNicho?: number;
  convertidoDefinitivo?: boolean;
}> {
  const pool = await getCementerioPool();
  const info = await pool
    .request()
    .input("id", sql.Int, input.idPrestamo)
    .query(`
      SELECT pr.ID_PRESTAMO, pr.ID_OCUPACION, pr.ESTADO, o.ESTADO AS ESTADO_OCUP
      FROM dbo.PRESTAMOS_NICHO pr
      INNER JOIN dbo.OCUPACIONES_NICHO o ON o.ID_OCUPACION = pr.ID_OCUPACION
      WHERE pr.ID_PRESTAMO = @id
    `);

  const row = info.recordset[0] as {
    ID_PRESTAMO: number;
    ID_OCUPACION: number;
    ESTADO: string;
    ESTADO_OCUP: string;
  };
  if (!row) throw new Error("Préstamo no encontrado");

  const fechaRes =
    toSqlDate(input.fechaResolucion) ?? toSqlDate(new Date().toISOString().slice(0, 10));
  if (!fechaRes) throw new Error("Fecha de resolución inválida");

  await pool
    .request()
    .input("id", sql.Int, input.idPrestamo)
    .input("res", sql.NVarChar(500), input.resolucion)
    .input("estado", sql.VarChar(30), input.estado)
    .input("fecha", sql.Date, fechaRes)
    .query(`
      UPDATE dbo.PRESTAMOS_NICHO SET
        RESOLUCION = @res,
        ESTADO = @estado,
        FECHA_RESOLUCION = @fecha
      WHERE ID_PRESTAMO = @id
    `);

  if (input.estado === "CONVERTIDO_EN_ARANCEL" && row.ESTADO_OCUP === "ACTIVO") {
    await pool
      .request()
      .input("idOcup", sql.Int, row.ID_OCUPACION)
      .query(`
        UPDATE dbo.OCUPACIONES_NICHO SET
          TIPO_OCUPACION = 'OCUPACION_PFC',
          FECHA_VENCIMIENTO = NULL
        WHERE ID_OCUPACION = @idOcup
      `);
    const nichoRow = await pool
      .request()
      .input("idOcup", sql.Int, row.ID_OCUPACION)
      .query(`SELECT ID_NICHO FROM dbo.OCUPACIONES_NICHO WHERE ID_OCUPACION = @idOcup`);
    const idNicho = Number(
      (nichoRow.recordset[0] as { ID_NICHO: number }).ID_NICHO,
    );
    await pool
      .request()
      .input("id", sql.Int, idNicho)
      .query(`UPDATE dbo.NICHOS SET ESTADO = 'OCUPADO' WHERE ID_NICHO = @id`);
    return { ocupacionFinalizada: false, idNicho, convertidoDefinitivo: true };
  }

  if (input.estado === "TRASLADADO" && row.ESTADO_OCUP === "ACTIVO") {
    const result = await finalizarOcupacion({
      idOcupacion: row.ID_OCUPACION,
      fechaFin: input.fechaResolucion ?? fechaRes.toISOString().slice(0, 10),
      codigoMotivo: "TRASLADO",
      observaciones: `Traslado — ${input.resolucion}`,
      idUsuario: input.idUsuario,
    });
    return { ocupacionFinalizada: true, idNicho: result.idNicho };
  }

  return { ocupacionFinalizada: false };
}
