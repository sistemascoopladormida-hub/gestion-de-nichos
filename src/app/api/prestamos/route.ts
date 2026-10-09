import { NextResponse } from "next/server";
import {
  handleApiError,
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";
import { listPrestamos } from "@/lib/repositories/prestamos";
import { resolverPrestamoConOcupacion } from "@/lib/services/resolverPrestamoConOcupacion";
import { logAudit } from "@/lib/audit/logAudit";
import { cleanEmptyFields } from "@/lib/validations/sanitize";
import { prestamoPatchBodySchema } from "@/lib/validations/schemas";

export async function GET(request: Request) {
  const session = await requirePermissionApi("prestamos:view");
  if (!isSessionUser(session)) return session;
  const estado = new URL(request.url).searchParams.get("estado") ?? undefined;
  const rows = await listPrestamos(estado ?? undefined);
  return NextResponse.json({ rows });
}

export async function PATCH(request: Request) {
  const session = await requirePermissionApi("prestamos:resolve");
  if (!isSessionUser(session)) return session;

  try {
    const raw = cleanEmptyFields(await request.json());
    const body = prestamoPatchBodySchema.parse(raw);
    const result = await resolverPrestamoConOcupacion({
      idPrestamo: body.idPrestamo,
      resolucion: body.resolucion,
      estado: body.estado,
      fechaResolucion: body.fechaResolucion ?? undefined,
      idUsuario: session.idUsuario,
    });

    await logAudit({
      idUsuario: session.idUsuario,
      accion: "REGISTRAR_PRESTAMO",
      entidad: "PRESTAMOS_NICHO",
      idRegistro: body.idPrestamo,
      valorNuevo: { ...body, ...result },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return handleApiError(err);
  }
}
