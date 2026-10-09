import sql from "mssql";
import { getCementerioPool } from "@/lib/db/cementerio";
import { toOptionalString, toSqlDate } from "@/lib/db/sqlParams";

export type AuditoriaFilters = {
  desde?: string;
  hasta?: string;
  idUsuario?: number;
  accion?: string;
  entidad?: string;
  limite?: number;
};

export async function listAuditoria(filters: AuditoriaFilters = {}) {
  const pool = await getCementerioPool();
  const request = pool.request();
  const where: string[] = ["1=1"];
  const limite = Math.min(filters.limite ?? 200, 500);

  const desde = toSqlDate(toOptionalString(filters.desde) ?? undefined);
  if (desde) {
    request.input("desde", sql.Date, desde);
    where.push("CAST(a.FECHA AS DATE) >= @desde");
  }
  const hasta = toSqlDate(toOptionalString(filters.hasta) ?? undefined);
  if (hasta) {
    request.input("hasta", sql.Date, hasta);
    where.push("CAST(a.FECHA AS DATE) <= @hasta");
  }
  if (filters.idUsuario) {
    request.input("idUsuario", sql.Int, filters.idUsuario);
    where.push("a.ID_USUARIO = @idUsuario");
  }
  if (filters.accion?.trim()) {
    request.input("accion", sql.VarChar(50), filters.accion.trim());
    where.push("a.ACCION = @accion");
  }
  if (filters.entidad?.trim()) {
    request.input("entidad", sql.VarChar(80), filters.entidad.trim());
    where.push("a.ENTIDAD = @entidad");
  }

  const result = await request.query(`
    SELECT TOP (${limite})
      a.ID_AUDITORIA,
      a.FECHA,
      a.ACCION,
      a.ENTIDAD,
      a.ID_REGISTRO,
      a.VALOR_ANTERIOR,
      a.VALOR_NUEVO,
      a.IP,
      u.NOMBRE AS USUARIO_NOMBRE,
      u.APELLIDO AS USUARIO_APELLIDO,
      u.USUARIO AS USUARIO_LOGIN
    FROM dbo.AUDITORIA_CEMENTERIO a
    LEFT JOIN dbo.USUARIOS u ON u.ID_USUARIO = a.ID_USUARIO
    WHERE ${where.join(" AND ")}
    ORDER BY a.FECHA DESC
  `);

  return result.recordset as Record<string, unknown>[];
}

export async function getAuditoriaById(id: bigint | number) {
  const pool = await getCementerioPool();
  const result = await pool
    .request()
    .input("id", sql.BigInt, id)
    .query(`
      SELECT a.*, u.NOMBRE, u.APELLIDO, u.USUARIO
      FROM dbo.AUDITORIA_CEMENTERIO a
      LEFT JOIN dbo.USUARIOS u ON u.ID_USUARIO = a.ID_USUARIO
      WHERE a.ID_AUDITORIA = @id
    `);
  return (result.recordset[0] as Record<string, unknown>) ?? null;
}
