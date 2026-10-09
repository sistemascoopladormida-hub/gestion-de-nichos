import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit/logAudit";
import {
  handleApiError,
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";
import { cambiarEstadoAdministrativoNicho } from "@/lib/services/cambiarEstadoNicho";
import { cleanEmptyFields } from "@/lib/validations/sanitize";
import { nichoEstadoPatchSchema } from "@/lib/validations/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requirePermissionApi("nichos:estado");
  if (!isSessionUser(session)) return session;

  try {
    const idNicho = Number((await ctx.params).id);
    const raw = cleanEmptyFields(await request.json());
    const body = nichoEstadoPatchSchema.parse(raw);

    if (body.estado === "RESERVADO" && !body.titularReserva?.trim()) {
      return NextResponse.json(
        { error: "Indique el titular o socio que reserva el nicho" },
        { status: 400 },
      );
    }
    if (
      (body.estado === "INHABILITADO" || body.estado === "MANTENIMIENTO") &&
      !body.motivo?.trim()
    ) {
      return NextResponse.json(
        { error: "Indique el motivo del bloqueo o mantenimiento" },
        { status: 400 },
      );
    }

    const result = await cambiarEstadoAdministrativoNicho({
      idNicho,
      estado: body.estado,
      motivo: body.motivo ?? null,
      titularReserva: body.titularReserva ?? null,
    });

    await logAudit({
      idUsuario: session.idUsuario,
      accion: "CAMBIAR_ESTADO_NICHO",
      entidad: "NICHOS",
      idRegistro: idNicho,
      valorNuevo: { ...body, estadoVisual: result.estadoVisual },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return handleApiError(err);
  }
}
