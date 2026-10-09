import sql from "mssql";
import { getCementerioPool } from "@/lib/db/cementerio";
import { toOptionalString, toSqlDate } from "@/lib/db/sqlParams";

export async function getServicioPrincipal(idFallecido: number) {
  const pool = await getCementerioPool();
  const result = await pool.request().input("id", sql.Int, idFallecido).query(`
    SELECT TOP 1
      ID_SERVICIO,
      TIPO_SERVICIO,
      FECHA_SERVICIO,
      ATENDIDO_POR,
      OBSERVACIONES,
      ES_PFC
    FROM dbo.SERVICIOS_CEMENTERIO
    WHERE ID_FALLECIDO = @id
    ORDER BY FECHA_REGISTRO DESC
  `);
  return (result.recordset[0] as Record<string, unknown>) ?? null;
}

export async function updateServicio(
  idServicio: number,
  input: {
    tipoServicio?: string;
    fechaServicio?: string;
    atendidoPor?: string;
    observaciones?: string | null;
  },
) {
  const pool = await getCementerioPool();
  const current = await pool
    .request()
    .input("id", sql.Int, idServicio)
    .query(`SELECT * FROM dbo.SERVICIOS_CEMENTERIO WHERE ID_SERVICIO = @id`);
  const row = current.recordset[0] as Record<string, unknown> | undefined;
  if (!row) throw new Error("Servicio no encontrado");

  const prev = { ...row };
  const fechaServ = input.fechaServicio
    ? toSqlDate(input.fechaServicio)
    : (row.FECHA_SERVICIO as Date);

  await pool
    .request()
    .input("id", sql.Int, idServicio)
    .input("tipo", sql.NVarChar(100), input.tipoServicio ?? String(row.TIPO_SERVICIO))
    .input("fecha", sql.Date, fechaServ)
    .input(
      "atendido",
      sql.NVarChar(150),
      input.atendidoPor ?? String(row.ATENDIDO_POR),
    )
    .input(
      "obs",
      sql.NVarChar(sql.MAX),
      toOptionalString(
        input.observaciones !== undefined
          ? input.observaciones
          : (row.OBSERVACIONES as string | null),
      ),
    )
    .query(`
      UPDATE dbo.SERVICIOS_CEMENTERIO SET
        TIPO_SERVICIO = @tipo,
        FECHA_SERVICIO = @fecha,
        ATENDIDO_POR = @atendido,
        OBSERVACIONES = @obs
      WHERE ID_SERVICIO = @id
    `);

  return prev;
}
