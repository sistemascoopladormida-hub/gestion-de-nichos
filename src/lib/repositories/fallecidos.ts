import sql from "mssql";
import { getCementerioPool } from "@/lib/db/cementerio";
import { toOptionalString, toSqlDate } from "@/lib/db/sqlParams";
import type { FallecidoBody } from "@/lib/validations/schemas";
import { esFallecidoPlaceholder } from "@/lib/constants/fallecido";

export type FallecidoInput = FallecidoBody;

export async function listFallecidos(
  search?: string,
  opts?: { incluirArchivados?: boolean },
) {
  const pool = await getCementerioPool();
  const request = pool.request();
  let where = opts?.incluirArchivados ? "WHERE 1=1" : "WHERE f.ACTIVO = 1";
  if (search?.trim()) {
    request.input("q", sql.NVarChar(100), `%${search.trim()}%`);
    where += ` AND (
      f.APELLIDO LIKE @q OR f.NOMBRE LIKE @q OR f.DNI LIKE @q
    )`;
  }
  const result = await request.query(`
    SELECT TOP 200
      f.ID_FALLECIDO,
      f.APELLIDO,
      f.NOMBRE,
      f.DNI,
      f.FECHA_FALLECIMIENTO,
      f.DATOS_INCOMPLETOS,
      f.ACTIVO,
      o.FECHA_INICIO AS FECHA_SEPULTURA,
      p.NOMBRE AS PABELLON,
      n.NUMERO AS NICHO
    FROM dbo.FALLECIDOS f
    LEFT JOIN dbo.OCUPACIONES_NICHO o ON o.ID_FALLECIDO = f.ID_FALLECIDO AND o.ESTADO = 'ACTIVO'
    LEFT JOIN dbo.NICHOS n ON n.ID_NICHO = o.ID_NICHO
    LEFT JOIN dbo.PABELLONES p ON p.ID_PABELLON = n.ID_PABELLON
    ${where}
    ORDER BY f.APELLIDO, f.NOMBRE
  `);
  return result.recordset as Record<string, unknown>[];
}

export async function getFallecidoById(id: number, opts?: { incluirArchivados?: boolean }) {
  const pool = await getCementerioPool();
  const activoFilter = opts?.incluirArchivados ? "" : " AND ACTIVO = 1";
  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query(`SELECT * FROM dbo.FALLECIDOS WHERE ID_FALLECIDO = @id${activoFilter}`);
  return (result.recordset[0] as Record<string, unknown>) ?? null;
}

export async function getFallecidoContexto(
  id: number,
  opts?: { incluirArchivados?: boolean },
) {
  const pool = await getCementerioPool();
  const activoFilter = opts?.incluirArchivados ? "" : " AND f.ACTIVO = 1";
  const result = await pool.request().input("id", sql.Int, id).query(`
    SELECT
      f.*,
      o.ID_OCUPACION,
      o.ESTADO AS OCUPACION_ESTADO,
      o.TIPO_OCUPACION,
      o.FECHA_INICIO AS FECHA_SEPULTURA,
      o.FECHA_CUMPLIMIENTO_10_ANIOS,
      n.ID_NICHO,
      n.NUMERO AS NICHO,
      p.NOMBRE AS PABELLON,
      pr.ID_PRESTAMO,
      pr.FECHA_VENCIMIENTO,
      pr.ESTADO AS PRESTAMO_ESTADO,
      g.NOMBRE AS GARANTE_NOMBRE,
      ue.ID_UBICACION_EXTERNA,
      ue.DESCRIPCION AS UBICACION_EXTERNA,
      ue.FECHA_SEPULTURA AS FECHA_SEPULTURA_EXTERNA,
      s.ID_SERVICIO,
      s.TIPO_SERVICIO,
      s.FECHA_SERVICIO,
      s.ATENDIDO_POR,
      s.ES_PFC,
      s.OBSERVACIONES AS SERVICIO_OBSERVACIONES
    FROM dbo.FALLECIDOS f
    LEFT JOIN dbo.OCUPACIONES_NICHO o ON o.ID_FALLECIDO = f.ID_FALLECIDO AND o.ESTADO = 'ACTIVO'
    LEFT JOIN dbo.NICHOS n ON n.ID_NICHO = o.ID_NICHO
    LEFT JOIN dbo.PABELLONES p ON p.ID_PABELLON = n.ID_PABELLON
    LEFT JOIN dbo.PRESTAMOS_NICHO pr ON pr.ID_OCUPACION = o.ID_OCUPACION
      AND pr.ESTADO NOT IN ('RESUELTO', 'TRASLADADO')
    LEFT JOIN dbo.GARANTES g ON g.ID_GARANTE = pr.ID_GARANTE
    LEFT JOIN dbo.UBICACIONES_EXTERNAS ue ON ue.ID_FALLECIDO = f.ID_FALLECIDO AND ue.ACTIVO = 1
    OUTER APPLY (
      SELECT TOP 1 *
      FROM dbo.SERVICIOS_CEMENTERIO sv
      WHERE sv.ID_FALLECIDO = f.ID_FALLECIDO
      ORDER BY sv.FECHA_REGISTRO DESC
    ) s
    WHERE f.ID_FALLECIDO = @id${activoFilter}
  `);
  return (result.recordset[0] as Record<string, unknown>) ?? null;
}

export async function getHistorialOcupacionesFallecido(idFallecido: number) {
  const pool = await getCementerioPool();
  const result = await pool.request().input("id", sql.Int, idFallecido).query(`
    SELECT
      o.ID_OCUPACION,
      o.FECHA_INICIO,
      o.FECHA_FIN,
      o.ESTADO,
      o.TIPO_OCUPACION,
      o.MOTIVO_FINALIZACION,
      n.NUMERO AS NICHO,
      p.NOMBRE AS PABELLON
    FROM dbo.OCUPACIONES_NICHO o
    INNER JOIN dbo.NICHOS n ON n.ID_NICHO = o.ID_NICHO
    INNER JOIN dbo.PABELLONES p ON p.ID_PABELLON = n.ID_PABELLON
    WHERE o.ID_FALLECIDO = @id
    ORDER BY o.FECHA_INICIO DESC
  `);
  return result.recordset as Record<string, unknown>[];
}

function bindFallecidoInputs(
  request: sql.Request,
  input: FallecidoInput,
  idUsuario: number | null,
  id?: number,
) {
  if (id != null) request.input("id", sql.Int, id);
  request
    .input("apellido", sql.NVarChar(150), input.apellido.trim())
    .input("nombre", sql.NVarChar(150), toOptionalString(input.nombre ?? null))
    .input("dni", sql.VarChar(20), toOptionalString(input.dni ?? null))
    .input("fechaNac", sql.Date, toSqlDate(input.fechaNacimiento))
    .input("fechaFall", sql.Date, toSqlDate(input.fechaFallecimiento))
    .input(
      "lugar",
      sql.NVarChar(200),
      toOptionalString(input.lugarFallecimiento ?? null),
    )
    .input(
      "ref",
      sql.NVarChar(200),
      toOptionalString(input.personaReferencia ?? null),
    )
    .input(
      "parentesco",
      sql.NVarChar(100),
      toOptionalString(input.parentesco ?? null),
    )
    .input(
      "tel",
      sql.VarChar(50),
      toOptionalString(input.telefonoReferencia ?? null),
    )
    .input(
      "email",
      sql.VarChar(150),
      toOptionalString(input.emailReferencia ?? null),
    )
    .input(
      "obs",
      sql.NVarChar(sql.MAX),
      toOptionalString(input.observaciones ?? null),
    )
    .input("usuario", sql.Int, idUsuario);
}

export async function createFallecido(
  tx: sql.Transaction,
  input: FallecidoInput,
  idUsuario: number | null,
): Promise<number> {
  const request = new sql.Request(tx);
  bindFallecidoInputs(request, input, idUsuario);
  const result = await request.query(`
      INSERT INTO dbo.FALLECIDOS (
        APELLIDO, NOMBRE, DNI, FECHA_NACIMIENTO, FECHA_FALLECIMIENTO,
        LUGAR_FALLECIMIENTO, PERSONA_REFERENCIA, PARENTESCO,
        TELEFONO_REFERENCIA, EMAIL_REFERENCIA, OBSERVACIONES, USUARIO_ALTA
      )
      OUTPUT INSERTED.ID_FALLECIDO
      VALUES (
        @apellido, @nombre, @dni, @fechaNac, @fechaFall,
        @lugar, @ref, @parentesco, @tel, @email, @obs, @usuario
      )
    `);
  return Number(result.recordset[0].ID_FALLECIDO);
}

export async function updateFallecido(
  id: number,
  input: FallecidoInput,
  idUsuario: number | null,
) {
  const pool = await getCementerioPool();
  const request = pool.request();
  bindFallecidoInputs(request, input, idUsuario, id);
  const datosIncompletos = esFallecidoPlaceholder(
    input.apellido.trim(),
    input.nombre ?? null,
  )
    ? 1
    : 0;

  await request
    .input("datosInc", sql.Bit, datosIncompletos)
    .query(`
      UPDATE dbo.FALLECIDOS SET
        APELLIDO = @apellido,
        NOMBRE = @nombre,
        DNI = @dni,
        FECHA_NACIMIENTO = @fechaNac,
        FECHA_FALLECIMIENTO = @fechaFall,
        LUGAR_FALLECIMIENTO = @lugar,
        PERSONA_REFERENCIA = @ref,
        PARENTESCO = @parentesco,
        TELEFONO_REFERENCIA = @tel,
        EMAIL_REFERENCIA = @email,
        OBSERVACIONES = @obs,
        DATOS_INCOMPLETOS = @datosInc,
        FECHA_MODIFICACION = SYSUTCDATETIME(),
        USUARIO_MODIFICACION = @usuario
      WHERE ID_FALLECIDO = @id
    `);
}

export async function listNichosOcupadosSinDatos(limit = 15) {
  const pool = await getCementerioPool();
  const result = await pool.request().query(`
    SELECT TOP (${limit})
      n.ID_NICHO,
      n.NUMERO AS nicho,
      p.NOMBRE AS pabellon,
      p.CODIGO AS pabellonCodigo,
      f.ID_FALLECIDO,
      o.FECHA_INICIO AS fechaSepultura
    FROM dbo.OCUPACIONES_NICHO o
    INNER JOIN dbo.NICHOS n ON n.ID_NICHO = o.ID_NICHO
    INNER JOIN dbo.PABELLONES p ON p.ID_PABELLON = n.ID_PABELLON
    INNER JOIN dbo.FALLECIDOS f ON f.ID_FALLECIDO = o.ID_FALLECIDO
    WHERE o.ESTADO = 'ACTIVO'
      AND f.ACTIVO = 1
      AND ISNULL(f.DATOS_INCOMPLETOS, 0) = 1
    ORDER BY o.FECHA_INICIO DESC
  `);
  return result.recordset as Record<string, unknown>[];
}

export async function countNichosOcupadosSinDatos(): Promise<number> {
  const pool = await getCementerioPool();
  const result = await pool.request().query(`
    SELECT COUNT(*) AS total
    FROM dbo.OCUPACIONES_NICHO o
    INNER JOIN dbo.FALLECIDOS f ON f.ID_FALLECIDO = o.ID_FALLECIDO
    WHERE o.ESTADO = 'ACTIVO'
      AND f.ACTIVO = 1
      AND ISNULL(f.DATOS_INCOMPLETOS, 0) = 1
  `);
  return Number((result.recordset[0] as { total: number }).total);
}
