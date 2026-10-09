import { NextResponse } from "next/server";
import {
  handleApiError,
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";
import { finalizarOcupacion } from "@/lib/services/finalizarOcupacion";
import { logAudit } from "@/lib/audit/logAudit";
import { cleanEmptyFields } from "@/lib/validations/sanitize";
import { finalizarOcupacionBodySchema } from "@/lib/validations/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const session = await requirePermissionApi("ocupaciones:finalize");
  if (!isSessionUser(session)) return session;

  try {
    const idOcupacion = Number((await ctx.params).id);
    const raw = cleanEmptyFields(await request.json());
    const body = finalizarOcupacionBodySchema.parse(raw);
    const result = await finalizarOcupacion({
      idOcupacion,
      fechaFin: body.fechaFin,
      codigoMotivo: body.codigoMotivo,
      observaciones: body.observaciones ?? undefined,
      idUsuario: session.idUsuario,
    });

    await logAudit({
      idUsuario: session.idUsuario,
      accion: "LIBERAR_NICHO",
      entidad: "OCUPACIONES_NICHO",
      idRegistro: idOcupacion,
      valorNuevo: { ...body, idNicho: result.idNicho },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return handleApiError(err);
  }
}
