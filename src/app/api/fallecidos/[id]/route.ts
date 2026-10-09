import { NextResponse } from "next/server";
import {
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";
import { getFallecidoById, updateFallecido } from "@/lib/repositories/fallecidos";
import { logAudit } from "@/lib/audit/logAudit";
import { mapErrorMessage } from "@/lib/utils/format";
import { cleanEmptyFields } from "@/lib/validations/sanitize";
import { fallecidoBodySchema } from "@/lib/validations/schemas";
import { validateFechasFallecido } from "@/lib/utils/dates";
import {
  archivarFallecido,
  contarRelacionesFallecido,
  eliminarFallecidoFisico,
  requiereArchivado,
} from "@/lib/services/fallecidoLifecycle";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await requirePermissionApi("fallecidos:view");
  if (!isSessionUser(session)) return session;
  const id = Number((await ctx.params).id);
  const incluirArchivados =
    new URL(_req.url).searchParams.get("archivados") === "1";
  const row = await getFallecidoById(id, {
    incluirArchivados: incluirArchivados && session.rol === "ADMINISTRADOR",
  });
  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ row });
}

export async function PUT(request: Request, ctx: Ctx) {
  const session = await requirePermissionApi("fallecidos:edit");
  if (!isSessionUser(session)) return session;
  const id = Number((await ctx.params).id);
  try {
    const prev = await getFallecidoById(id, { incluirArchivados: true });
    if (!prev || Number(prev.ACTIVO) === 0) {
      return NextResponse.json(
        { error: "No se puede editar un fallecido archivado. Restáurelo primero." },
        { status: 400 },
      );
    }
    const raw = cleanEmptyFields(await request.json());
    const input = fallecidoBodySchema.parse(raw);
    const dateErr = validateFechasFallecido(input);
    if (dateErr) {
      return NextResponse.json({ error: dateErr }, { status: 400 });
    }
    await updateFallecido(id, input, session.idUsuario);
    await logAudit({
      idUsuario: session.idUsuario,
      accion: "MODIFICAR",
      entidad: "FALLECIDOS",
      idRegistro: id,
      valorAnterior: prev,
      valorNuevo: input,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: mapErrorMessage(err) }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await requirePermissionApi("fallecidos:archive");
  if (!isSessionUser(session)) return session;
  const id = Number((await ctx.params).id);
  try {
    const prev = await getFallecidoById(id, { incluirArchivados: true });
    if (!prev) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    if (Number(prev.ACTIVO) === 0) {
      return NextResponse.json({ error: "El fallecido ya está archivado" }, { status: 400 });
    }

    const rel = await contarRelacionesFallecido(id);
    if (requiereArchivado(rel)) {
      await archivarFallecido(id, session.idUsuario);
      await logAudit({
        idUsuario: session.idUsuario,
        accion: "ARCHIVAR",
        entidad: "FALLECIDOS",
        idRegistro: id,
        valorAnterior: prev,
        valorNuevo: { activo: false, relaciones: rel },
      });
      return NextResponse.json({ ok: true, modo: "archivado" as const });
    }

    await eliminarFallecidoFisico(id);
    await logAudit({
      idUsuario: session.idUsuario,
      accion: "ELIMINAR",
      entidad: "FALLECIDOS",
      idRegistro: id,
      valorAnterior: prev,
    });
    return NextResponse.json({ ok: true, modo: "eliminado" as const });
  } catch (err) {
    return NextResponse.json({ error: mapErrorMessage(err) }, { status: 400 });
  }
}
