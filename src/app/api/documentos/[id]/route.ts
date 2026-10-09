import sql from "mssql";
import { NextResponse } from "next/server";
import { getCementerioPool } from "@/lib/db/cementerio";
import {
  handleApiError,
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";
import { logAudit } from "@/lib/audit/logAudit";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await requirePermissionApi("documentos:delete");
  if (!isSessionUser(session)) return session;

  try {
    const id = Number((await ctx.params).id);
    const pool = await getCementerioPool();
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("usuario", sql.Int, session.idUsuario)
      .query(`
        UPDATE dbo.DOCUMENTOS_CEMENTERIO SET
          ELIMINADO = 1,
          FECHA_ELIMINACION = SYSUTCDATETIME(),
          USUARIO_ELIMINACION = @usuario
        WHERE ID_DOCUMENTO = @id AND (ELIMINADO = 0 OR ELIMINADO IS NULL)
      `);

    await logAudit({
      idUsuario: session.idUsuario,
      accion: "ELIMINAR_LOGICO",
      entidad: "DOCUMENTOS_CEMENTERIO",
      idRegistro: id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
