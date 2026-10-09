import sql from "mssql";
import { getCementerioPool } from "@/lib/db/cementerio";
import {
  SQL_ESTADO_VISUAL,
  SQL_JOIN_OCUPACION_ACTIVA,
} from "./nichoEstadoVisual";

export async function getNichoDetalle(idNicho: number) {
  const pool = await getCementerioPool();
  const result = await pool.request().input("id", sql.Int, idNicho).query(`
    SELECT
      n.ID_NICHO,
      n.NUMERO,
      n.FILA,
      n.COLUMNA,
      n.ESTADO,
      n.OBSERVACIONES,
      p.CODIGO AS PABELLON_CODIGO,
      p.NOMBRE AS PABELLON_NOMBRE,
      p.UBICACION,
      v.ESTADO_VISUAL,
      o.ID_OCUPACION,
      o.TIPO_OCUPACION,
      o.FECHA_INICIO,
      o.FECHA_CUMPLIMIENTO_10_ANIOS,
      o.FECHA_VENCIMIENTO,
      f.ID_FALLECIDO,
      f.APELLIDO,
      f.NOMBRE,
      f.DNI,
      f.FECHA_FALLECIMIENTO,
      f.LUGAR_FALLECIMIENTO,
      (SELECT TOP 1 s.ES_PFC FROM dbo.SERVICIOS_CEMENTERIO s
        WHERE s.ID_FALLECIDO = f.ID_FALLECIDO ORDER BY s.FECHA_REGISTRO DESC) AS ES_PFC,
      (SELECT TOP 1 s.TIPO_SERVICIO FROM dbo.SERVICIOS_CEMENTERIO s
        WHERE s.ID_FALLECIDO = f.ID_FALLECIDO ORDER BY s.FECHA_REGISTRO DESC) AS TIPO_SERVICIO,
      o.OBSERVACIONES AS OCUP_OBSERVACIONES,
      pr.ID_PRESTAMO,
      pr.FECHA_VENCIMIENTO AS PRESTAMO_VENCIMIENTO,
      pr.ESTADO AS PRESTAMO_ESTADO,
      g.NOMBRE AS GARANTE_NOMBRE,
      g.DNI AS GARANTE_DNI
    FROM dbo.NICHOS n
    INNER JOIN dbo.PABELLONES p ON p.ID_PABELLON = n.ID_PABELLON
    ${SQL_JOIN_OCUPACION_ACTIVA}
    LEFT JOIN dbo.PRESTAMOS_NICHO pr ON pr.ID_OCUPACION = o.ID_OCUPACION AND pr.ESTADO NOT IN ('RESUELTO', 'TRASLADADO')
    LEFT JOIN dbo.GARANTES g ON g.ID_GARANTE = pr.ID_GARANTE
    CROSS APPLY (SELECT ${SQL_ESTADO_VISUAL} AS ESTADO_VISUAL) v
    WHERE n.ID_NICHO = @id
  `);

  return (result.recordset[0] as Record<string, unknown>) ?? null;
}

export async function getHistorialNicho(idNicho: number) {
  const pool = await getCementerioPool();
  const result = await pool.request().input("id", sql.Int, idNicho).query(`
    SELECT
      o.ID_OCUPACION,
      o.FECHA_INICIO,
      o.FECHA_FIN,
      o.TIPO_OCUPACION,
      o.ESTADO,
      o.MOTIVO_FINALIZACION,
      CONCAT(f.APELLIDO, ', ', ISNULL(f.NOMBRE, '')) AS FALLECIDO
    FROM dbo.OCUPACIONES_NICHO o
    INNER JOIN dbo.FALLECIDOS f ON f.ID_FALLECIDO = o.ID_FALLECIDO
    WHERE o.ID_NICHO = @id
    ORDER BY o.FECHA_INICIO DESC
  `);
  return result.recordset as Record<string, unknown>[];
}

export async function assertNichoDisponible(
  tx: sql.Transaction,
  idNicho: number,
): Promise<void> {
  const req = new sql.Request(tx);
  const result = await req.input("id", sql.Int, idNicho).query(`
    SELECT n.ESTADO, o.ID_OCUPACION
    FROM dbo.NICHOS n WITH (UPDLOCK, ROWLOCK)
    LEFT JOIN dbo.OCUPACIONES_NICHO o ON o.ID_NICHO = n.ID_NICHO AND o.ESTADO = 'ACTIVO'
    WHERE n.ID_NICHO = @id
  `);
  const row = result.recordset[0] as { ESTADO: string; ID_OCUPACION: number | null };
  if (!row) throw new Error("Nicho no encontrado");
  if (row.ID_OCUPACION) {
    throw new Error("El nicho ya se encuentra ocupado");
  }
  if (row.ESTADO !== "DISPONIBLE") {
    throw new Error(`El nicho no está disponible (estado: ${row.ESTADO})`);
  }
}

export async function marcarNichoOcupado(
  tx: sql.Transaction,
  idNicho: number,
): Promise<void> {
  await new sql.Request(tx)
    .input("id", sql.Int, idNicho)
    .query(`UPDATE dbo.NICHOS SET ESTADO = 'OCUPADO' WHERE ID_NICHO = @id`);
}
