import sql from "mssql";
import { getCementerioPool } from "@/lib/db/cementerio";
import { buscarSocioPFC } from "@/lib/pfc/buscarSocioPFC";
import {
  SQL_ESTADO_VISUAL,
  SQL_JOIN_OCUPACION_ACTIVA,
} from "./nichoEstadoVisual";

export async function buscarGlobal(q: string) {
  const term = q.trim();
  if (!term) {
    return { fallecidos: [], nichos: [], sociosPfc: [] };
  }

  const pool = await getCementerioPool();
  const request = pool.request();
  request.input("q", sql.NVarChar(100), `%${term}%`);
  request.input("qExact", sql.VarChar(30), term);

  const fallecidos = await request.query(`
    SELECT TOP 15
      f.ID_FALLECIDO,
      f.APELLIDO,
      f.NOMBRE,
      f.DNI,
      f.FECHA_FALLECIMIENTO,
      p.NOMBRE AS PABELLON,
      n.NUMERO AS NICHO,
      o.ESTADO AS ESTADO_OCUPACION
    FROM dbo.FALLECIDOS f
    LEFT JOIN dbo.OCUPACIONES_NICHO o ON o.ID_FALLECIDO = f.ID_FALLECIDO AND o.ESTADO = 'ACTIVO'
    LEFT JOIN dbo.NICHOS n ON n.ID_NICHO = o.ID_NICHO
    LEFT JOIN dbo.PABELLONES p ON p.ID_PABELLON = n.ID_PABELLON
    WHERE f.ACTIVO = 1 AND (
      f.APELLIDO LIKE @q OR f.NOMBRE LIKE @q OR f.DNI = @qExact
    )
    ORDER BY f.APELLIDO
  `);

  const nichos = await pool.request()
    .input("q", sql.NVarChar(100), `%${term}%`)
    .input("num", sql.Int, Number.isFinite(Number(term)) ? Number(term) : -1)
    .query(`
      SELECT TOP 15
        n.ID_NICHO,
        n.NUMERO,
        p.CODIGO,
        p.NOMBRE AS PABELLON,
        v.ESTADO_VISUAL,
        CASE WHEN f.ID_FALLECIDO IS NOT NULL
          THEN CONCAT(f.APELLIDO, ', ', ISNULL(f.NOMBRE, ''))
          ELSE NULL END AS OCUPANTE
      FROM dbo.NICHOS n
      INNER JOIN dbo.PABELLONES p ON p.ID_PABELLON = n.ID_PABELLON
      ${SQL_JOIN_OCUPACION_ACTIVA}
      CROSS APPLY (SELECT ${SQL_ESTADO_VISUAL} AS ESTADO_VISUAL) v
      WHERE n.NUMERO = @num OR p.NOMBRE LIKE @q OR p.CODIGO LIKE @q
      ORDER BY p.ORDEN_VISUAL, n.NUMERO
    `);

  let sociosPfc: Awaited<ReturnType<typeof buscarSocioPFC>> = [];
  try {
    if (/^\d+$/.test(term)) {
      sociosPfc = await buscarSocioPFC({ dni: term, limite: 10 });
      if (sociosPfc.length === 0) {
        sociosPfc = await buscarSocioPFC({ codSoc: term, limite: 10 });
      }
      if (sociosPfc.length === 0) {
        sociosPfc = await buscarSocioPFC({ numeroCuenta: term, limite: 10 });
      }
    } else {
      sociosPfc = await buscarSocioPFC({ apellido: term, limite: 10 });
    }
  } catch (err) {
    console.error("[buscarGlobal] PFC", err);
    sociosPfc = [];
  }

  return {
    fallecidos: fallecidos.recordset,
    nichos: nichos.recordset,
    sociosPfc,
  };
}
