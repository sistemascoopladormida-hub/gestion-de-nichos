import { NextResponse } from "next/server";
import { buscarSocioPFC } from "@/lib/pfc/buscarSocioPFC";
import {
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";
import { logAudit } from "@/lib/audit/logAudit";

export async function GET(request: Request) {
  const session = await requirePermissionApi("pfc:consult");
  if (!isSessionUser(session)) return session;

  const { searchParams } = new URL(request.url);
  try {
    const results = await buscarSocioPFC({
      dni: searchParams.get("dni") ?? undefined,
      codSoc: searchParams.get("codSoc") ?? undefined,
      numeroCuenta: searchParams.get("numeroCuenta") ?? undefined,
      apellido: searchParams.get("apellido") ?? undefined,
    });
    await logAudit({
      idUsuario: session.idUsuario,
      accion: "CONSULTAR_PFC",
      entidad: "PFC_VIEW",
      valorNuevo: { criterio: Object.fromEntries(searchParams) },
    });
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[pfc/buscar]", err);
    return NextResponse.json(
      { error: "No se pudo consultar socios PFC" },
      { status: 503 },
    );
  }
}
