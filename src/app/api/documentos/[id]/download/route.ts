import { readFile } from "fs/promises";
import sql from "mssql";
import { NextResponse } from "next/server";
import { getCementerioPool } from "@/lib/db/cementerio";
import {
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await requirePermissionApi("fallecidos:view");
  if (!isSessionUser(session)) return session;

  const id = Number((await ctx.params).id);
  const pool = await getCementerioPool();
  const result = await pool.request().input("id", sql.Int, id).query(`
    SELECT NOMBRE_ARCHIVO, RUTA_ARCHIVO, MIME_TYPE
    FROM dbo.DOCUMENTOS_CEMENTERIO
    WHERE ID_DOCUMENTO = @id AND (ELIMINADO = 0 OR ELIMINADO IS NULL)
  `);

  const row = result.recordset[0] as {
    NOMBRE_ARCHIVO: string;
    RUTA_ARCHIVO: string;
    MIME_TYPE: string | null;
  };
  if (!row) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  try {
    const buffer = await readFile(row.RUTA_ARCHIVO);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": row.MIME_TYPE ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(row.NOMBRE_ARCHIVO)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Archivo no disponible en el servidor" }, { status: 404 });
  }
}
