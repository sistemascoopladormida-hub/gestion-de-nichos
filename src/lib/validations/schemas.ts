import { z } from "zod";
import { TIPOS_OCUPACION } from "@/lib/ocupaciones/tipos";
import { emptyToNull } from "./sanitize";

export const zTipoOcupacion = z.enum(TIPOS_OCUPACION);

export const zOptionalString = z.preprocess(
  emptyToNull,
  z.string().nullable().optional(),
);

export const zOptionalDate = z.preprocess(
  emptyToNull,
  z
    .union([
      z.null(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use formato AAAA-MM-DD"),
    ])
    .optional(),
);

export const zRequiredDate = z.preprocess(
  (v) => emptyToNull(v) ?? v,
  z
    .string({ required_error: "La fecha es obligatoria" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use formato AAAA-MM-DD"),
);

export const fallecidoBodySchema = z.object({
  apellido: z.string().trim().min(1, "El apellido es obligatorio"),
  nombre: zOptionalString,
  dni: zOptionalString,
  fechaNacimiento: zOptionalDate,
  fechaFallecimiento: zOptionalDate,
  lugarFallecimiento: zOptionalString,
  personaReferencia: zOptionalString,
  parentesco: zOptionalString,
  telefonoReferencia: zOptionalString,
  emailReferencia: zOptionalString,
  observaciones: zOptionalString,
});

export type FallecidoBody = z.infer<typeof fallecidoBodySchema>;

export const fechaSepulturaBodySchema = z.object({
  fechaSepultura: zRequiredDate,
});

export const servicioPatchBodySchema = z.object({
  tipoServicio: z.string().trim().min(1).optional(),
  fechaServicio: zOptionalDate,
  atendidoPor: z.string().trim().min(1).optional(),
  observaciones: zOptionalString,
});

export const pfcSnapshotSchema = z.object({
  apellidos: z.string(),
  codSoc: z.string(),
  numeroCuenta: zOptionalString,
  numDni: zOptionalString,
  telefono: zOptionalString,
  movil: zOptionalString,
  email: zOptionalString,
  fechaAlta: zOptionalDate,
  estadoServicio: z.string(),
  servicioActivo: z.boolean(),
});

export const servicioBodySchema = z.object({
  fallecido: fallecidoBodySchema,
  esPfc: z.boolean(),
  pfcSnapshot: pfcSnapshotSchema.optional().nullable(),
  tipoServicio: z.string().trim().min(1),
  fechaServicio: zRequiredDate,
  fechaSepultura: zOptionalDate,
  atendidoPor: z.string().trim().min(1),
  observaciones: zOptionalString,
  ubicacion: z.discriminatedUnion("tipo", [
    z.object({
      tipo: z.literal("PABELLON"),
      idNicho: z.number(),
    }),
    z.object({
      tipo: z.literal("EXTERNA"),
      externa: z.object({
        descripcion: z.string().trim().min(1),
        sector: zOptionalString,
        referencia: zOptionalString,
        fechaSepultura: zOptionalDate,
        observaciones: zOptionalString,
      }),
    }),
  ]),
  prestamo: z
    .object({
      garante: pfcSnapshotSchema,
    })
    .optional(),
});

export const finalizarOcupacionBodySchema = z.object({
  fechaFin: zRequiredDate,
  codigoMotivo: z.enum([
    "TRASLADO",
    "EXHUMACION",
    "FINALIZACION_ADMINISTRATIVA",
    "ERROR_DE_REGISTRO",
    "OTRO",
  ]),
  observaciones: zOptionalString,
});

export const asignarOcupacionBodySchema = z.object({
  idFallecido: z.number(),
  fechaInicio: zRequiredDate,
});

export const ocuparSinDatosBodySchema = z.object({
  fechaInicio: zRequiredDate,
});

export const nichoEstadoPatchSchema = z.object({
  estado: z.enum(["DISPONIBLE", "RESERVADO", "INHABILITADO", "MANTENIMIENTO"]),
  motivo: z.string().trim().optional(),
  titularReserva: z.string().trim().optional(),
});

export const prestamoMapaBodySchema = z.object({
  idFallecido: z.number(),
  fechaInicio: zRequiredDate,
  fechaVencimiento: zOptionalDate,
  garanteNombre: z.string().trim().min(1, "Indique el nombre del garante"),
  garanteDni: z.string().trim().optional(),
  observaciones: z.string().trim().optional(),
});

export const prestamoPatchBodySchema = z.object({
  idPrestamo: z.number(),
  resolucion: z.string().trim().min(1),
  estado: z.enum(["RESUELTO", "TRASLADADO", "CONVERTIDO_EN_ARANCEL"]),
  fechaResolucion: zOptionalDate,
});
