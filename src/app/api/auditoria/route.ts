import { NextResponse } from "next/server";
import {
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";
import { listAuditoria } from "@/lib/repositories/auditoria";

export async function GET(request: Request) {
  const session = await requirePermissionApi("auditoria:view");
  if (!isSessionUser(session)) return session;

  const sp = new URL(request.url).searchParams;
  const rows = await listAuditoria({
    desde: sp.get("desde") ?? undefined,
    hasta: sp.get("hasta") ?? undefined,
    idUsuario: sp.get("usuario") ? Number(sp.get("usuario")) : undefined,
    accion: sp.get("accion") ?? undefined,
    entidad: sp.get("entidad") ?? undefined,
    limite: sp.get("limite") ? Number(sp.get("limite")) : 200,
  });

  return NextResponse.json({ rows });
}
