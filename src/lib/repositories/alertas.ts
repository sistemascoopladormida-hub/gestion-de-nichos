import { getCementerioPool } from "@/lib/db/cementerio";
import type { AlertaItem } from "@/types/domain";

export type AlertasConteos = {
  prestamosVencidos: number;
  prestamosProximos: number;
  documentacionPendiente: number;
  diezAnios: number;
  nichosSinDatos: number;
};

export async function getAlertasConteos(): Promise<AlertasConteos> {
  const pool = await getCementerioPool();
  const result = await pool.request().query(`
    SELECT
      (SELECT COUNT(*)
       FROM dbo.PRESTAMOS_NICHO pr
       WHERE pr.ESTADO IN ('ACTIVO', 'VENCIDO', 'PROXIMO_VENCIMIENTO')
         AND pr.FECHA_VENCIMIENTO < CAST(GETDATE() AS DATE)) AS prestamosVencidos,
      (SELECT COUNT(*)
       FROM dbo.PRESTAMOS_NICHO pr
       WHERE pr.ESTADO IN ('ACTIVO', 'PROXIMO_VENCIMIENTO')
         AND pr.FECHA_VENCIMIENTO >= CAST(GETDATE() AS DATE)
         AND pr.FECHA_VENCIMIENTO <= DATEADD(DAY, 30, CAST(GETDATE() AS DATE))) AS prestamosProximos,
      (SELECT COUNT(*)
       FROM dbo.OCUPACIONES_NICHO o
       WHERE o.ESTADO = 'ACTIVO'
         AND o.FECHA_CUMPLIMIENTO_10_ANIOS <= CAST(GETDATE() AS DATE)) AS diezAnios,
      (SELECT COUNT(*)
       FROM dbo.SERVICIOS_CEMENTERIO s
       WHERE NOT EXISTS (
         SELECT 1 FROM dbo.DOCUMENTOS_CEMENTERIO d
         WHERE d.ID_FALLECIDO = s.ID_FALLECIDO
       )) AS documentacionPendiente,
      (SELECT COUNT(*)
       FROM dbo.OCUPACIONES_NICHO o
       INNER JOIN dbo.FALLECIDOS f ON f.ID_FALLECIDO = o.ID_FALLECIDO
       WHERE o.ESTADO = 'ACTIVO'
         AND f.ACTIVO = 1
         AND ISNULL(f.DATOS_INCOMPLETOS, 0) = 1) AS nichosSinDatos
  `);
  const row = result.recordset[0] as Record<string, number>;
  return {
    prestamosVencidos: Number(row.prestamosVencidos),
    prestamosProximos: Number(row.prestamosProximos),
    diezAnios: Number(row.diezAnios),
    documentacionPendiente: Number(row.documentacionPendiente),
    nichosSinDatos: Number(row.nichosSinDatos ?? 0),
  };
}

export async function getAlertas(limit = 20): Promise<AlertaItem[]> {
  const pool = await getCementerioPool();
  const alertas: AlertaItem[] = [];

  const vencidos = await pool.request().query(`
    SELECT TOP (${limit})
      pr.ID_PRESTAMO,
      CONCAT(f.APELLIDO, ', ', ISNULL(f.NOMBRE, '')) AS fallecido,
      pb.NOMBRE AS pabellon,
      n.NUMERO AS nicho,
      pr.FECHA_VENCIMIENTO
    FROM dbo.PRESTAMOS_NICHO pr
    INNER JOIN dbo.OCUPACIONES_NICHO o ON o.ID_OCUPACION = pr.ID_OCUPACION
    INNER JOIN dbo.FALLECIDOS f ON f.ID_FALLECIDO = o.ID_FALLECIDO
    INNER JOIN dbo.NICHOS n ON n.ID_NICHO = o.ID_NICHO
    INNER JOIN dbo.PABELLONES pb ON pb.ID_PABELLON = n.ID_PABELLON
    WHERE pr.ESTADO IN ('ACTIVO', 'VENCIDO', 'PROXIMO_VENCIMIENTO')
      AND pr.FECHA_VENCIMIENTO < CAST(GETDATE() AS DATE)
    ORDER BY pr.FECHA_VENCIMIENTO
  `);

  for (const row of vencidos.recordset as Record<string, unknown>[]) {
    alertas.push({
      tipo: "PRESTAMO_VENCIDO",
      titulo: "Préstamo vencido",
      detalle: `${row.fallecido} — ${row.pabellon} nicho ${row.nicho}`,
      href: `/prestamos?id=${row.ID_PRESTAMO}`,
    });
  }

  const proximos = await pool.request().query(`
    SELECT TOP (${limit})
      pr.ID_PRESTAMO,
      CONCAT(f.APELLIDO, ', ', ISNULL(f.NOMBRE, '')) AS fallecido,
      pb.NOMBRE AS pabellon,
      n.NUMERO AS nicho,
      pr.FECHA_VENCIMIENTO
    FROM dbo.PRESTAMOS_NICHO pr
    INNER JOIN dbo.OCUPACIONES_NICHO o ON o.ID_OCUPACION = pr.ID_OCUPACION
    INNER JOIN dbo.FALLECIDOS f ON f.ID_FALLECIDO = o.ID_FALLECIDO
    INNER JOIN dbo.NICHOS n ON n.ID_NICHO = o.ID_NICHO
    INNER JOIN dbo.PABELLONES pb ON pb.ID_PABELLON = n.ID_PABELLON
    WHERE pr.ESTADO IN ('ACTIVO', 'PROXIMO_VENCIMIENTO')
      AND pr.FECHA_VENCIMIENTO >= CAST(GETDATE() AS DATE)
      AND pr.FECHA_VENCIMIENTO <= DATEADD(DAY, 30, CAST(GETDATE() AS DATE))
    ORDER BY pr.FECHA_VENCIMIENTO
  `);

  for (const row of proximos.recordset as Record<string, unknown>[]) {
    alertas.push({
      tipo: "PRESTAMO_PROXIMO",
      titulo: "Préstamo por vencer",
      detalle: `${row.fallecido} — vence ${formatDate(row.FECHA_VENCIMIENTO)}`,
      href: `/prestamos?id=${row.ID_PRESTAMO}`,
    });
  }

  const diez = await pool.request().query(`
    SELECT TOP (${limit})
      f.ID_FALLECIDO,
      n.ID_NICHO,
      CONCAT(f.APELLIDO, ', ', ISNULL(f.NOMBRE, '')) AS fallecido,
      pb.NOMBRE AS pabellon,
      n.NUMERO AS nicho,
      o.FECHA_CUMPLIMIENTO_10_ANIOS
    FROM dbo.OCUPACIONES_NICHO o
    INNER JOIN dbo.FALLECIDOS f ON f.ID_FALLECIDO = o.ID_FALLECIDO
    INNER JOIN dbo.NICHOS n ON n.ID_NICHO = o.ID_NICHO
    INNER JOIN dbo.PABELLONES pb ON pb.ID_PABELLON = n.ID_PABELLON
    WHERE o.ESTADO = 'ACTIVO'
      AND o.FECHA_CUMPLIMIENTO_10_ANIOS <= CAST(GETDATE() AS DATE)
    ORDER BY o.FECHA_CUMPLIMIENTO_10_ANIOS
  `);

  for (const row of diez.recordset as Record<string, unknown>[]) {
    alertas.push({
      tipo: "DIEZ_ANIOS",
      titulo: "10 años cumplidos",
      detalle: `${row.fallecido} — ${row.pabellon} · Nicho ${row.nicho}`,
      href: `/fallecidos/${row.ID_FALLECIDO}`,
    });
  }

  const sinDocs = await pool.request().query(`
    SELECT TOP (${Math.max(5, limit)})
      f.ID_FALLECIDO,
      s.ID_SERVICIO,
      CONCAT(f.APELLIDO, ', ', ISNULL(f.NOMBRE, '')) AS fallecido,
      s.FECHA_SERVICIO,
      s.TIPO_SERVICIO
    FROM dbo.SERVICIOS_CEMENTERIO s
    INNER JOIN dbo.FALLECIDOS f ON f.ID_FALLECIDO = s.ID_FALLECIDO
    WHERE NOT EXISTS (
      SELECT 1 FROM dbo.DOCUMENTOS_CEMENTERIO d
      WHERE d.ID_FALLECIDO = s.ID_FALLECIDO
    )
    ORDER BY s.FECHA_REGISTRO DESC
  `);

  for (const row of sinDocs.recordset as Record<string, unknown>[]) {
    alertas.push({
      tipo: "DOCUMENTACION",
      titulo: "Documentación pendiente",
      detalle: `${row.fallecido} — ${row.TIPO_SERVICIO} (${formatDate(row.FECHA_SERVICIO)}). No hay documentación cargada.`,
      href: `/fallecidos/${row.ID_FALLECIDO}?tab=documentos`,
    });
  }

  try {
    const sinDatos = await pool.request().query(`
      SELECT TOP (${Math.max(5, limit)})
        f.ID_FALLECIDO,
        n.ID_NICHO,
        pb.NOMBRE AS pabellon,
        pb.CODIGO AS pabellonCodigo,
        n.NUMERO AS nicho
      FROM dbo.OCUPACIONES_NICHO o
      INNER JOIN dbo.FALLECIDOS f ON f.ID_FALLECIDO = o.ID_FALLECIDO
      INNER JOIN dbo.NICHOS n ON n.ID_NICHO = o.ID_NICHO
      INNER JOIN dbo.PABELLONES pb ON pb.ID_PABELLON = n.ID_PABELLON
      WHERE o.ESTADO = 'ACTIVO'
        AND f.ACTIVO = 1
        AND ISNULL(f.DATOS_INCOMPLETOS, 0) = 1
      ORDER BY o.FECHA_INICIO DESC
    `);

    for (const row of sinDatos.recordset as Record<string, unknown>[]) {
      alertas.push({
        tipo: "NICHO_SIN_DATOS",
        titulo: "Nicho sin datos del fallecido",
        detalle: `${row.pabellon} · Nicho ${row.nicho} — completar identificación`,
        href: `/fallecidos/${row.ID_FALLECIDO}/editar`,
      });
    }
  } catch {
    /* columna DATOS_INCOMPLETOS: ejecutar migración 005 */
  }

  return alertas.slice(0, limit);
}

function formatDate(value: unknown): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(String(value));
  return d.toLocaleDateString("es-AR");
}
