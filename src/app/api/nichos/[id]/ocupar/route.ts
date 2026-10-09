import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit/logAudit";
import {
  handleApiError,
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";
import { asignarFallecidoANicho } from "@/lib/services/asignarOcupacionNicho";
import { cleanEmptyFields } from "@/lib/validations/sanitize";
import { asignarOcupacionBodySchema } from "@/lib/validations/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const session = await requirePermissionApi("ocupaciones:assign");
  if (!isSessionUser(session)) return session;

  try {
    const idNicho = Number((await ctx.params).id);
    const raw = cleanEmptyFields(await request.json());
    const body = asignarOcupacionBodySchema.parse(raw);
    const result = await asignarFallecidoANicho({
      idNicho,
      idFallecido: body.idFallecido,
      fechaInicio: body.fechaInicio,
      idUsuario: session.idUsuario,
    });

    await logAudit({
      idUsuario: session.idUsuario,
      accion: "ASIGNAR_NICHO",
      entidad: "OCUPACIONES_NICHO",
      idRegistro: result.idOcupacion,
      valorNuevo: { idNicho, ...body, ...result },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return handleApiError(err);
  }
}
