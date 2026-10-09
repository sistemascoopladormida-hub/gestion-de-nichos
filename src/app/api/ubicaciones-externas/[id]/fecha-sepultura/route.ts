import { NextResponse } from "next/server";
import {
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";
import { logAudit } from "@/lib/audit/logAudit";
import { mapErrorMessage } from "@/lib/utils/format";
import { cleanEmptyFields } from "@/lib/validations/sanitize";
import { fechaSepulturaBodySchema } from "@/lib/validations/schemas";
import { actualizarFechaSepulturaExterna } from "@/lib/services/actualizarFechaSepultura";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requirePermissionApi("ocupaciones:edit_fecha");
  if (!isSessionUser(session)) return session;
  const id = Number((await ctx.params).id);
  try {
    const raw = cleanEmptyFields(await request.json());
    const { fechaSepultura } = fechaSepulturaBodySchema.parse(raw);
    const result = await actualizarFechaSepulturaExterna(id, fechaSepultura);
    await logAudit({
      idUsuario: session.idUsuario,
      accion: "MODIFICAR_FECHA_SEPULTURA",
      entidad: "UBICACIONES_EXTERNAS",
      idRegistro: id,
      valorAnterior: { fechaSepultura: result.fechaAnterior },
      valorNuevo: {
        fechaSepultura: result.fechaNueva,
        idFallecido: result.idFallecido,
      },
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: mapErrorMessage(err) }, { status: 400 });
  }
}
