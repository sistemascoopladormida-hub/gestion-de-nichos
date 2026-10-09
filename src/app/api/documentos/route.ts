import { mkdir, writeFile } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";
import sql from "mssql";
import { NextResponse } from "next/server";
import { getCementerioPool } from "@/lib/db/cementerio";
import {
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";
import { logAudit } from "@/lib/audit/logAudit";
import { toOptionalString } from "@/lib/db/sqlParams";

function storageRoot() {
  const p = process.env.DOCUMENTOS_STORAGE_PATH;
  if (!p) throw new Error("DOCUMENTOS_STORAGE_PATH no configurado");
  return p;
}

export async function GET(request: Request) {
  const session = await requirePermissionApi("fallecidos:view");
  if (!isSessionUser(session)) return session;
  const idFallecido = Number(new URL(request.url).searchParams.get("idFallecido"));
  if (!idFallecido) {
    return NextResponse.json({ rows: [] });
  }
  const pool = await getCementerioPool();
  const result = await pool
    .request()
    .input("id", sql.Int, idFallecido)
    .query(`
      SELECT
        d.ID_DOCUMENTO,
        d.NOMBRE_ARCHIVO,
        d.TIPO_DOCUMENTO,
        d.FECHA_CARGA,
        d.TAMANO,
        d.MIME_TYPE,
        d.OBSERVACIONES,
        CONCAT(u.NOMBRE, ' ', u.APELLIDO) AS USUARIO_CARGA
      FROM dbo.DOCUMENTOS_CEMENTERIO d
      LEFT JOIN dbo.USUARIOS u ON u.ID_USUARIO = d.USUARIO_CARGA
      WHERE d.ID_FALLECIDO = @id AND (d.ELIMINADO = 0 OR d.ELIMINADO IS NULL)
      ORDER BY d.FECHA_CARGA DESC
    `);
  return NextResponse.json({ rows: result.recordset });
}

export async function POST(request: Request) {
  const session = await requirePermissionApi("documentos:upload");
  if (!isSessionUser(session)) return session;

  try {
    const form = await request.formData();
    const idFallecido = Number(form.get("idFallecido"));
    const tipo = String(form.get("tipoDocumento") ?? "OTRO");
    const file = form.get("archivo");
    const obs = toOptionalString(String(form.get("observaciones") ?? ""));

    if (!idFallecido || !(file instanceof File)) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const root = storageRoot();
    await mkdir(root, { recursive: true });
    const safeExt = extname(file.name).slice(0, 10);
    const stored = `${randomUUID()}${safeExt}`;
    const fullPath = join(root, stored);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(fullPath, buffer);

    const pool = await getCementerioPool();
    await pool
      .request()
      .input("idF", sql.Int, idFallecido)
      .input("tipo", sql.VarChar(40), tipo)
      .input("nombre", sql.NVarChar(260), file.name)
      .input("ruta", sql.NVarChar(500), fullPath)
      .input("mime", sql.VarChar(100), file.type || null)
      .input("tam", sql.BigInt, file.size)
      .input("obs", sql.NVarChar(500), obs)
      .input("usuario", sql.Int, session.idUsuario)
      .query(`
        INSERT INTO dbo.DOCUMENTOS_CEMENTERIO (
          ID_FALLECIDO, TIPO_DOCUMENTO, NOMBRE_ARCHIVO, RUTA_ARCHIVO,
          MIME_TYPE, TAMANO, OBSERVACIONES, USUARIO_CARGA
        )
        VALUES (@idF, @tipo, @nombre, @ruta, @mime, @tam, @obs, @usuario)
      `);

    await logAudit({
      idUsuario: session.idUsuario,
      accion: "CARGAR_DOCUMENTO",
      entidad: "DOCUMENTOS_CEMENTERIO",
      idRegistro: idFallecido,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[documentos]", err);
    return NextResponse.json(
      { error: "No se pudo guardar el documento" },
      { status: 400 },
    );
  }
}
