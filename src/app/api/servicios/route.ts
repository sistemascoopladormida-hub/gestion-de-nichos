import { NextResponse } from "next/server";
import type { z } from "zod";
import {
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";
import { registrarServicio } from "@/lib/services/registrarServicio";
import { logAudit } from "@/lib/audit/logAudit";
import { mapErrorMessage } from "@/lib/utils/format";
import { toOptionalString, toSqlDate } from "@/lib/db/sqlParams";
import type { SocioPfc } from "@/lib/pfc/types";
import { cleanEmptyFields } from "@/lib/validations/sanitize";
import { validateFechasFallecido } from "@/lib/utils/dates";
import {
  pfcSnapshotSchema,
  servicioBodySchema,
} from "@/lib/validations/schemas";

export async function POST(request: Request) {
  const session = await requirePermissionApi("servicios:create");
  if (!isSessionUser(session)) return session;

  try {
    const raw = cleanEmptyFields(await request.json());
    const parsed = servicioBodySchema.parse(raw);

    if (parsed.esPfc && !parsed.pfcSnapshot) {
      return NextResponse.json(
        { error: "Debe seleccionar un socio PFC" },
        { status: 400 },
      );
    }
    if (
      parsed.ubicacion.tipo === "PABELLON" &&
      !parsed.esPfc &&
      !parsed.prestamo
    ) {
      return NextResponse.json(
        { error: "Nicho de la Cooperativa sin PFC requiere garante y préstamo" },
        { status: 400 },
      );
    }
    if (parsed.prestamo && !parsed.prestamo.garante.servicioActivo) {
      return NextResponse.json(
        { error: "El garante debe tener PFC activo" },
        { status: 400 },
      );
    }

    const fechaSepulturaStr =
      parsed.fechaSepultura?.trim() ||
      (parsed.ubicacion.tipo === "EXTERNA"
        ? parsed.ubicacion.externa?.fechaSepultura ?? parsed.fechaServicio
        : parsed.fechaServicio);
    const dateErr = validateFechasFallecido({
      ...parsed.fallecido,
      fechaSepultura: fechaSepulturaStr,
    });
    if (dateErr) {
      return NextResponse.json({ error: dateErr }, { status: 400 });
    }

    const mapPfc = (p: z.infer<typeof pfcSnapshotSchema>): SocioPfc => ({
      apellidos: p.apellidos,
      codSoc: p.codSoc,
      numeroCuenta: toOptionalString(p.numeroCuenta ?? null),
      numDni: toOptionalString(p.numDni ?? null),
      telefono: toOptionalString(p.telefono ?? null),
      movil: toOptionalString(p.movil ?? null),
      email: toOptionalString(p.email ?? null),
      fechaAlta: toSqlDate(p.fechaAlta),
      estadoServicio: p.estadoServicio,
      servicioActivo: p.servicioActivo,
      cdi: null,
      obsPostal: null,
      fechaNacimiento: null,
      adherenteCodigo: null,
      adherenteNombre: null,
      vinculo: null,
      dniAdherente: null,
      desCat: null,
      fechaBaja: null,
      esMigrado: false,
    });

    const result = await registrarServicio(
      {
        ...parsed,
        fechaSepultura: fechaSepulturaStr,
        observaciones: parsed.observaciones ?? null,
        pfcSnapshot: parsed.pfcSnapshot ? mapPfc(parsed.pfcSnapshot) : null,
        prestamo: parsed.prestamo
          ? { garante: mapPfc(parsed.prestamo.garante) }
          : undefined,
      },
      session.idUsuario,
    );

    await logAudit({
      idUsuario: session.idUsuario,
      accion: "REGISTRAR_SERVICIO",
      entidad: "SERVICIOS_CEMENTERIO",
      idRegistro: result.idServicio,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[servicios]", err);
    return NextResponse.json({ error: mapErrorMessage(err) }, { status: 400 });
  }
}
