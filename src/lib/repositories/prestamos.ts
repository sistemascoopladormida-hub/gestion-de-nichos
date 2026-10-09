import { getCementerioPool } from "@/lib/db/cementerio";

export async function listPrestamos(estado?: string) {
  const pool = await getCementerioPool();
  let where = "WHERE 1=1";
  if (estado === "vencidos") {
    where += ` AND pr.FECHA_VENCIMIENTO < CAST(GETDATE() AS DATE) AND pr.ESTADO NOT IN ('RESUELTO', 'TRASLADADO')`;
  } else if (estado === "proximos") {
    where += ` AND pr.FECHA_VENCIMIENTO >= CAST(GETDATE() AS DATE)
      AND pr.FECHA_VENCIMIENTO <= DATEADD(DAY, 30, CAST(GETDATE() AS DATE))
      AND pr.ESTADO IN ('ACTIVO', 'PROXIMO_VENCIMIENTO')`;
  }

  const result = await pool.request().query(`
    SELECT
      pr.ID_PRESTAMO,
      o.ID_OCUPACION,
      pr.FECHA_INICIO,
      pr.FECHA_VENCIMIENTO,
      pr.ESTADO,
      pr.RESOLUCION,
      CONCAT(f.APELLIDO, ', ', ISNULL(f.NOMBRE, '')) AS FALLECIDO,
      p.NOMBRE AS PABELLON,
      n.NUMERO AS NICHO,
      g.NOMBRE AS GARANTE,
      g.DNI AS GARANTE_DNI,
      CASE
        WHEN pr.FECHA_VENCIMIENTO < CAST(GETDATE() AS DATE) THEN 'VENCIDO'
        WHEN pr.FECHA_VENCIMIENTO <= DATEADD(DAY, 30, CAST(GETDATE() AS DATE)) THEN 'PROXIMO'
        ELSE 'ACTIVO'
      END AS ALERTA
    FROM dbo.PRESTAMOS_NICHO pr
    INNER JOIN dbo.OCUPACIONES_NICHO o ON o.ID_OCUPACION = pr.ID_OCUPACION
    INNER JOIN dbo.FALLECIDOS f ON f.ID_FALLECIDO = o.ID_FALLECIDO
    INNER JOIN dbo.NICHOS n ON n.ID_NICHO = o.ID_NICHO
    INNER JOIN dbo.PABELLONES p ON p.ID_PABELLON = n.ID_PABELLON
    INNER JOIN dbo.GARANTES g ON g.ID_GARANTE = pr.ID_GARANTE
    ${where}
    ORDER BY pr.FECHA_VENCIMIENTO
  `);
  return result.recordset as Record<string, unknown>[];
}
