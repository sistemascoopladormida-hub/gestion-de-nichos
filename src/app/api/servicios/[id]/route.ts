import { NextResponse } from "next/server";
import {
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";
import { updateServicio } from "@/lib/repositories/servicios";
import { logAudit } from "@/lib/audit/logAudit";
import { mapErrorMessage } from "@/lib/utils/format";
import { cleanEmptyFields } from "@/lib/validations/sanitize";
import { servicioPatchBodySchema } from "@/lib/validations/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requirePermissionApi("servicios:edit");
  if (!isSessionUser(session)) return session;
  const id = Number((await ctx.params).id);
  try {
    const raw = cleanEmptyFields(await request.json());
    const input = servicioPatchBodySchema.parse(raw);
    const prev = await updateServicio(id, {
      tipoServicio: input.tipoServicio,
      fechaServicio: input.fechaServicio ?? undefined,
      atendidoPor: input.atendidoPor,
      observaciones: input.observaciones ?? undefined,
    });
    await logAudit({
      idUsuario: session.idUsuario,
      accion: "MODIFICAR",
      entidad: "SERVICIOS_CEMENTERIO",
      idRegistro: id,
      valorAnterior: prev,
      valorNuevo: input,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: mapErrorMessage(err) }, { status: 400 });
  }
}
