import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit/logAudit";
import {
  handleApiError,
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";
import { registrarPrestamoDesdeMapa } from "@/lib/services/registrarPrestamoMapa";
import { cleanEmptyFields } from "@/lib/validations/sanitize";
import { prestamoMapaBodySchema } from "@/lib/validations/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const session = await requirePermissionApi("ocupaciones:assign");
  if (!isSessionUser(session)) return session;

  try {
    const idNicho = Number((await ctx.params).id);
    const raw = cleanEmptyFields(await request.json());
    const body = prestamoMapaBodySchema.parse(raw);
    const result = await registrarPrestamoDesdeMapa({
      idNicho,
      idFallecido: body.idFallecido,
      fechaInicio: body.fechaInicio,
      fechaVencimiento: body.fechaVencimiento ?? null,
      garanteNombre: body.garanteNombre,
      garanteDni: body.garanteDni ?? null,
      observaciones: body.observaciones ?? null,
      idUsuario: session.idUsuario,
    });

    await logAudit({
      idUsuario: session.idUsuario,
      accion: "REGISTRAR_PRESTAMO",
      entidad: "PRESTAMOS_NICHO",
      idRegistro: result.idPrestamo,
      valorNuevo: { idNicho, ...body, ...result },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return handleApiError(err);
  }
}
