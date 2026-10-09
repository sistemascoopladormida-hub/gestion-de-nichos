import sql from "mssql";
import { getCementerioPool } from "@/lib/db/cementerio";
import {
  SQL_ESTADO_VISUAL,
  SQL_JOIN_OCUPACION_ACTIVA,
} from "./nichoEstadoVisual";

export async function reporteOcupacionPorPabellon() {
  const pool = await getCementerioPool();
  const result = await pool.request().query(`
    SELECT
      p.CODIGO,
      p.NOMBRE,
      p.TOTAL_NICHOS AS total,
      SUM(CASE WHEN v.ESTADO_VISUAL IN ('OCUPADO', 'OCUPADO_SIN_DATOS') THEN 1 ELSE 0 END) AS ocupados,
      SUM(CASE WHEN v.ESTADO_VISUAL = 'DISPONIBLE' THEN 1 ELSE 0 END) AS disponibles,
      SUM(CASE WHEN v.ESTADO_VISUAL = 'PRESTAMO' THEN 1 ELSE 0 END) AS prestados,
      SUM(CASE WHEN v.ESTADO_VISUAL = 'INHABILITADO' THEN 1 ELSE 0 END) AS inhabilitados,
      SUM(CASE WHEN v.ESTADO_VISUAL = 'MANTENIMIENTO' THEN 1 ELSE 0 END) AS mantenimiento,
      SUM(CASE WHEN v.ESTADO_VISUAL = 'RESERVADO' THEN 1 ELSE 0 END) AS reservados
    FROM dbo.PABELLONES p
    INNER JOIN dbo.NICHOS n ON n.ID_PABELLON = p.ID_PABELLON AND n.ACTIVO = 1
    ${SQL_JOIN_OCUPACION_ACTIVA}
    CROSS APPLY (SELECT ${SQL_ESTADO_VISUAL} AS ESTADO_VISUAL) v
    GROUP BY p.CODIGO, p.NOMBRE, p.TOTAL_NICHOS, p.ORDEN_VISUAL
    ORDER BY p.ORDEN_VISUAL
  `);
  return result.recordset;
}

export async function reporteFallecidos(filtros: {
  q?: string;
  pabellon?: string;
  soloPfc?: boolean;
  conPrestamo?: boolean;
}) {
  const pool = await getCementerioPool();
  const request = pool.request();
  const where = ["f.ACTIVO = 1"];

  if (filtros.q?.trim()) {
    request.input("q", sql.NVarChar(100), `%${filtros.q.trim()}%`);
    where.push("(f.APELLIDO LIKE @q OR f.NOMBRE LIKE @q OR f.DNI LIKE @q)");
  }
  if (filtros.pabellon?.trim()) {
    request.input("pab", sql.VarChar(10), filtros.pabellon.trim());
    where.push("p.CODIGO = @pab");
  }
  if (filtros.soloPfc) {
    where.push(`EXISTS (
      SELECT 1 FROM dbo.SERVICIOS_CEMENTERIO s
      WHERE s.ID_FALLECIDO = f.ID_FALLECIDO AND s.ES_PFC = 1
    )`);
  }
  if (filtros.conPrestamo) {
    where.push(`EXISTS (
      SELECT 1 FROM dbo.OCUPACIONES_NICHO o2
      INNER JOIN dbo.PRESTAMOS_NICHO pr ON pr.ID_OCUPACION = o2.ID_OCUPACION
      WHERE o2.ID_FALLECIDO = f.ID_FALLECIDO
    )`);
  }

  const result = await request.query(`
    SELECT
      f.ID_FALLECIDO,
      f.APELLIDO,
      f.NOMBRE,
      f.DNI,
      f.FECHA_FALLECIMIENTO,
      p.CODIGO AS PABELLON,
      n.NUMERO AS NICHO,
      o.FECHA_INICIO AS FECHA_SEPULTURA,
      (SELECT TOP 1 s.ES_PFC FROM dbo.SERVICIOS_CEMENTERIO s
       WHERE s.ID_FALLECIDO = f.ID_FALLECIDO ORDER BY s.FECHA_REGISTRO DESC) AS ES_PFC
    FROM dbo.FALLECIDOS f
    LEFT JOIN dbo.OCUPACIONES_NICHO o ON o.ID_FALLECIDO = f.ID_FALLECIDO AND o.ESTADO = 'ACTIVO'
    LEFT JOIN dbo.NICHOS n ON n.ID_NICHO = o.ID_NICHO
    LEFT JOIN dbo.PABELLONES p ON p.ID_PABELLON = n.ID_PABELLON
    WHERE ${where.join(" AND ")}
    ORDER BY f.APELLIDO, f.NOMBRE
  `);
  return result.recordset;
}

export async function reportePrestamos(tipo?: string) {
  const pool = await getCementerioPool();
  let extra = "";
  if (tipo === "activos") {
    extra = ` AND pr.ESTADO IN ('ACTIVO','PROXIMO_VENCIMIENTO','VENCIDO')`;
  } else if (tipo === "vencidos") {
    extra = ` AND pr.FECHA_VENCIMIENTO < CAST(GETDATE() AS DATE)
      AND pr.ESTADO NOT IN ('RESUELTO','TRASLADADO')`;
  } else if (tipo === "proximos") {
    extra = ` AND pr.FECHA_VENCIMIENTO BETWEEN CAST(GETDATE() AS DATE)
      AND DATEADD(DAY,30,CAST(GETDATE() AS DATE))
      AND pr.ESTADO NOT IN ('RESUELTO','TRASLADADO')`;
  } else if (tipo === "resueltos") {
    extra = ` AND pr.ESTADO IN ('RESUELTO','TRASLADADO','CONVERTIDO_EN_ARANCEL')`;
  }

  const result = await pool.request().query(`
    SELECT
      pr.ID_PRESTAMO,
      pr.ESTADO,
      pr.FECHA_INICIO,
      pr.FECHA_VENCIMIENTO,
      pr.FECHA_RESOLUCION,
      CONCAT(f.APELLIDO, ', ', ISNULL(f.NOMBRE,'')) AS FALLECIDO,
      p.NOMBRE AS PABELLON,
      n.NUMERO AS NICHO,
      g.NOMBRE AS GARANTE
    FROM dbo.PRESTAMOS_NICHO pr
    INNER JOIN dbo.OCUPACIONES_NICHO o ON o.ID_OCUPACION = pr.ID_OCUPACION
    INNER JOIN dbo.FALLECIDOS f ON f.ID_FALLECIDO = o.ID_FALLECIDO
    INNER JOIN dbo.NICHOS n ON n.ID_NICHO = o.ID_NICHO
    INNER JOIN dbo.PABELLONES p ON p.ID_PABELLON = n.ID_PABELLON
    INNER JOIN dbo.GARANTES g ON g.ID_GARANTE = pr.ID_GARANTE
    WHERE 1=1 ${extra}
    ORDER BY pr.FECHA_VENCIMIENTO
  `);
  return result.recordset;
}

export async function reporteDiezAnios(modo: "cumplidos" | "proximos" | "todos" = "todos") {
  const pool = await getCementerioPool();
  let extra = "";
  if (modo === "cumplidos") {
    extra = " AND o.FECHA_CUMPLIMIENTO_10_ANIOS <= CAST(GETDATE() AS DATE)";
  } else if (modo === "proximos") {
    extra = ` AND o.FECHA_CUMPLIMIENTO_10_ANIOS > CAST(GETDATE() AS DATE)
      AND o.FECHA_CUMPLIMIENTO_10_ANIOS <= DATEADD(DAY, 365, CAST(GETDATE() AS DATE))`;
  }

  const result = await pool.request().query(`
    SELECT
      CONCAT(f.APELLIDO, ', ', ISNULL(f.NOMBRE,'')) AS FALLECIDO,
      p.NOMBRE AS PABELLON,
      n.NUMERO AS NICHO,
      o.FECHA_INICIO AS FECHA_SEPULTURA,
      o.FECHA_CUMPLIMIENTO_10_ANIOS,
      o.ESTADO_ARANCEL
    FROM dbo.OCUPACIONES_NICHO o
    INNER JOIN dbo.FALLECIDOS f ON f.ID_FALLECIDO = o.ID_FALLECIDO
    INNER JOIN dbo.NICHOS n ON n.ID_NICHO = o.ID_NICHO
    INNER JOIN dbo.PABELLONES p ON p.ID_PABELLON = n.ID_PABELLON
    WHERE o.ESTADO = 'ACTIVO' ${extra}
    ORDER BY o.FECHA_CUMPLIMIENTO_10_ANIOS
  `);
  return result.recordset;
}

export async function reporteDocumentacion(conDocs: boolean | null) {
  const pool = await getCementerioPool();
  const having =
    conDocs === true
      ? "HAVING COUNT(d.ID_DOCUMENTO) > 0"
      : conDocs === false
        ? "HAVING COUNT(d.ID_DOCUMENTO) = 0"
        : "";

  const result = await pool.request().query(`
    SELECT
      f.ID_FALLECIDO,
      CONCAT(f.APELLIDO, ', ', ISNULL(f.NOMBRE,'')) AS FALLECIDO,
      COUNT(d.ID_DOCUMENTO) AS CANT_DOCS,
      MAX(s.FECHA_SERVICIO) AS ULTIMO_SERVICIO
    FROM dbo.FALLECIDOS f
    LEFT JOIN dbo.DOCUMENTOS_CEMENTERIO d ON d.ID_FALLECIDO = f.ID_FALLECIDO
      AND (d.ELIMINADO = 0 OR d.ELIMINADO IS NULL)
    LEFT JOIN dbo.SERVICIOS_CEMENTERIO s ON s.ID_FALLECIDO = f.ID_FALLECIDO
    WHERE f.ACTIVO = 1
    GROUP BY f.ID_FALLECIDO, f.APELLIDO, f.NOMBRE
    ${having}
    ORDER BY f.APELLIDO
  `);
  return result.recordset;
}
