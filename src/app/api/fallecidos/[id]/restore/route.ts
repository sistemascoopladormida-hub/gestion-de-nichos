import { NextResponse } from "next/server";
import {
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";
import { getFallecidoById } from "@/lib/repositories/fallecidos";
import { logAudit } from "@/lib/audit/logAudit";
import { mapErrorMessage } from "@/lib/utils/format";
import { restaurarFallecido } from "@/lib/services/fallecidoLifecycle";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const session = await requirePermissionApi("fallecidos:restore");
  if (!isSessionUser(session)) return session;
  const id = Number((await ctx.params).id);
  try {
    const prev = await getFallecidoById(id, { incluirArchivados: true });
    if (!prev) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    await restaurarFallecido(id, session.idUsuario);
    await logAudit({
      idUsuario: session.idUsuario,
      accion: "RESTAURAR",
      entidad: "FALLECIDOS",
      idRegistro: id,
      valorAnterior: prev,
      valorNuevo: { activo: true },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: mapErrorMessage(err) }, { status: 400 });
  }
}
