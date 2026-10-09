import { getCementerioPool } from "@/lib/db/cementerio";
import type { DashboardResumen } from "@/types/domain";
import {
  SQL_ESTADO_VISUAL,
  SQL_JOIN_OCUPACION_ACTIVA,
} from "./nichoEstadoVisual";

export async function getDashboardResumen(): Promise<DashboardResumen> {
  const pool = await getCementerioPool();
  const result = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM dbo.PABELLONES WHERE ACTIVO = 1) AS totalPabellones,
      COUNT(*) AS totalNichos,
      SUM(CASE WHEN v.ESTADO_VISUAL IN ('OCUPADO', 'OCUPADO_SIN_DATOS') THEN 1 ELSE 0 END) AS ocupados,
      SUM(CASE WHEN v.ESTADO_VISUAL = 'DISPONIBLE' THEN 1 ELSE 0 END) AS disponibles,
      SUM(CASE WHEN v.ESTADO_VISUAL = 'PRESTAMO' THEN 1 ELSE 0 END) AS prestados,
      SUM(CASE WHEN v.ESTADO_VISUAL = 'MANTENIMIENTO' THEN 1 ELSE 0 END) AS mantenimiento,
      SUM(CASE WHEN v.ESTADO_VISUAL = 'INHABILITADO' THEN 1 ELSE 0 END) AS inhabilitados,
      SUM(CASE WHEN v.ESTADO_VISUAL = 'RESERVADO' THEN 1 ELSE 0 END) AS reservados
    FROM dbo.NICHOS n
    ${SQL_JOIN_OCUPACION_ACTIVA}
    CROSS APPLY (SELECT ${SQL_ESTADO_VISUAL} AS ESTADO_VISUAL) v
    WHERE n.ACTIVO = 1
  `);

  const row = result.recordset[0] as DashboardResumen;
  return {
    totalPabellones: Number(row.totalPabellones),
    totalNichos: Number(row.totalNichos),
    ocupados: Number(row.ocupados),
    disponibles: Number(row.disponibles),
    prestados: Number(row.prestados),
    mantenimiento: Number(row.mantenimiento),
    inhabilitados: Number(row.inhabilitados),
    reservados: Number(row.reservados),
  };
}
