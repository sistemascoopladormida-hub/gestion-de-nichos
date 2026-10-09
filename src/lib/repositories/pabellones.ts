import { getCementerioPool } from "@/lib/db/cementerio";
import type { NichoMapa, PabellonResumen } from "@/types/domain";
import type { NichoEstadoVisual } from "@/types/domain";
import {
  SQL_ESTADO_VISUAL,
  SQL_JOIN_OCUPACION_ACTIVA,
} from "./nichoEstadoVisual";

export async function listPabellonesResumen(): Promise<PabellonResumen[]> {
  const pool = await getCementerioPool();
  const result = await pool.request().query(`
    SELECT
      p.ID_PABELLON AS idPabellon,
      p.CODIGO AS codigo,
      p.NOMBRE AS nombre,
      p.UBICACION AS ubicacion,
      p.TOTAL_NICHOS AS totalNichos,
      p.COLUMNAS_MAPA AS columnasMapa,
      p.FILAS_MAPA AS filasMapa,
      SUM(CASE WHEN v.ESTADO_VISUAL IN ('OCUPADO', 'PRESTAMO') THEN 1 ELSE 0 END) AS ocupados,
      SUM(CASE WHEN v.ESTADO_VISUAL = 'DISPONIBLE' THEN 1 ELSE 0 END) AS disponibles,
      SUM(CASE WHEN v.ESTADO_VISUAL = 'PRESTAMO' THEN 1 ELSE 0 END) AS prestados
    FROM dbo.PABELLONES p
    INNER JOIN dbo.NICHOS n ON n.ID_PABELLON = p.ID_PABELLON AND n.ACTIVO = 1
    ${SQL_JOIN_OCUPACION_ACTIVA}
    CROSS APPLY (SELECT ${SQL_ESTADO_VISUAL} AS ESTADO_VISUAL) v
    WHERE p.ACTIVO = 1
    GROUP BY
      p.ID_PABELLON, p.CODIGO, p.NOMBRE, p.UBICACION, p.TOTAL_NICHOS,
      p.COLUMNAS_MAPA, p.FILAS_MAPA, p.ORDEN_VISUAL
    ORDER BY p.ORDEN_VISUAL
  `);

  return result.recordset as PabellonResumen[];
}

export async function getPabellonByCodigo(codigo: string) {
  const pool = await getCementerioPool();
  const result = await pool
    .request()
    .input("codigo", codigo.toUpperCase())
    .query(`
      SELECT ID_PABELLON, CODIGO, NOMBRE, UBICACION, TOTAL_NICHOS, COLUMNAS_MAPA, FILAS_MAPA
      FROM dbo.PABELLONES
      WHERE CODIGO = @codigo AND ACTIVO = 1
    `);
  return (result.recordset[0] as Record<string, unknown>) ?? null;
}

export async function listNichosMapaByPabellonCodigo(
  codigo: string,
): Promise<NichoMapa[]> {
  const pool = await getCementerioPool();
  const result = await pool
    .request()
    .input("codigo", codigo.toUpperCase())
    .query(`
      SELECT
        n.ID_NICHO AS idNicho,
        n.NUMERO AS numero,
        n.FILA AS fila,
        n.COLUMNA AS columna,
        v.ESTADO_VISUAL AS estadoVisual,
        f.ID_FALLECIDO AS idFallecido,
        o.ID_OCUPACION AS idOcupacion,
        CASE WHEN f.ID_FALLECIDO IS NOT NULL
          THEN CONCAT(f.APELLIDO, ', ', ISNULL(f.NOMBRE, ''))
          ELSE NULL END AS fallecidoNombre,
        CONVERT(VARCHAR(10), o.FECHA_INICIO, 23) AS fechaSepultura,
        n.OBSERVACIONES AS observaciones,
        pr.ID_PRESTAMO AS idPrestamo,
        CONVERT(VARCHAR(10), pr.FECHA_VENCIMIENTO, 23) AS fechaVencimientoPrestamo,
        g.NOMBRE AS garanteNombre
      FROM dbo.NICHOS n
      INNER JOIN dbo.PABELLONES p ON p.ID_PABELLON = n.ID_PABELLON
      ${SQL_JOIN_OCUPACION_ACTIVA}
      LEFT JOIN dbo.PRESTAMOS_NICHO pr
        ON pr.ID_OCUPACION = o.ID_OCUPACION
        AND pr.ESTADO NOT IN ('RESUELTO', 'TRASLADADO', 'CONVERTIDO_EN_ARANCEL')
      LEFT JOIN dbo.GARANTES g ON g.ID_GARANTE = pr.ID_GARANTE
      CROSS APPLY (SELECT ${SQL_ESTADO_VISUAL} AS ESTADO_VISUAL) v
      WHERE p.CODIGO = @codigo AND n.ACTIVO = 1
      ORDER BY n.FILA, n.COLUMNA
    `);

  return (result.recordset as Record<string, unknown>[]).map((row) => ({
    idNicho: Number(row.idNicho),
    numero: Number(row.numero),
    fila: Number(row.fila),
    columna: Number(row.columna),
    estadoVisual: row.estadoVisual as NichoEstadoVisual,
    fallecidoNombre: row.fallecidoNombre as string | null,
    idFallecido: row.idFallecido != null ? Number(row.idFallecido) : null,
    idOcupacion: row.idOcupacion != null ? Number(row.idOcupacion) : null,
    fechaSepultura: row.fechaSepultura as string | null,
    observaciones: (row.observaciones as string | null) ?? null,
    idPrestamo: row.idPrestamo != null ? Number(row.idPrestamo) : null,
    fechaVencimientoPrestamo:
      (row.fechaVencimientoPrestamo as string | null) ?? null,
    garanteNombre: (row.garanteNombre as string | null) ?? null,
  }));
}
