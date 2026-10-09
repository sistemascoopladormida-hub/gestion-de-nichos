import { NextResponse } from "next/server";
import {
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";
import { createFallecido, listFallecidos } from "@/lib/repositories/fallecidos";
import { getCementerioPool } from "@/lib/db/cementerio";
import sql from "mssql";
import { logAudit } from "@/lib/audit/logAudit";
import { mapErrorMessage } from "@/lib/utils/format";
import { cleanEmptyFields } from "@/lib/validations/sanitize";
import { fallecidoBodySchema } from "@/lib/validations/schemas";
import { validateFechasFallecido } from "@/lib/utils/dates";

export async function GET(request: Request) {
  const session = await requirePermissionApi("fallecidos:view");
  if (!isSessionUser(session)) return session;
  const params = new URL(request.url).searchParams;
  const q = params.get("q") ?? undefined;
  const incluirArchivados = params.get("archivados") === "1";
  const rows = await listFallecidos(q, { incluirArchivados });
  return NextResponse.json({ rows });
}

export async function POST(request: Request) {
  const session = await requirePermissionApi("fallecidos:create");
  if (!isSessionUser(session)) return session;
  try {
    const raw = cleanEmptyFields(await request.json());
    const input = fallecidoBodySchema.parse(raw);
    const dateErr = validateFechasFallecido(input);
    if (dateErr) {
      return NextResponse.json({ error: dateErr }, { status: 400 });
    }
    const pool = await getCementerioPool();
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const id = await createFallecido(tx, input, session.idUsuario);
      await tx.commit();
      await logAudit({
        idUsuario: session.idUsuario,
        accion: "CREAR",
        entidad: "FALLECIDOS",
        idRegistro: id,
        valorNuevo: input,
      });
      return NextResponse.json({ idFallecido: id });
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  } catch (err) {
    return NextResponse.json({ error: mapErrorMessage(err) }, { status: 400 });
  }
}
