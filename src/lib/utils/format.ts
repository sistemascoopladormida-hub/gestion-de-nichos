import { toDateOnlyString } from "./dates";

export function formatDate(value: unknown): string {
  if (!value) return "—";
  const only = toDateOnlyString(
    value instanceof Date ? value : (String(value) as string),
  );
  if (only) {
    const [y, m, d] = only.split("-");
    return `${d}/${m}/${y}`;
  }
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR");
}

export function nombreCompleto(apellido: string, nombre?: string | null): string {
  return [apellido, nombre].filter(Boolean).join(", ");
}

function messageFromUnknown(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err != null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

export function mapErrorMessage(err: unknown): string {
  const msg = messageFromUnknown(err);
  if (msg.includes("UX_OCUP_NICHO_ACTIVA") || msg.includes("ocupado")) {
    return "No se pudo asignar el nicho porque ya se encuentra ocupado.";
  }
  if (msg.includes("UX_OCUP_FALLECIDO_ACTIVA")) {
    return "Esta persona ya tiene un nicho asignado.";
  }
  if (msg.includes("UQ_NICHOS")) {
    return "Conflicto de numeración de nicho.";
  }
  if (
    msg.includes("CK_OCUP_TIPO") ||
    (msg.includes("CHECK constraint") && msg.includes("TIPO_OCUPACION"))
  ) {
    return "Tipo de ocupación no válido. Los valores permitidos son OCUPACION_PFC u OCUPACION_PRESTAMO.";
  }
  if (msg.includes("conflicted with the CHECK constraint")) {
    const ck = msg.match(/constraint "([^"]+)"/i)?.[1];
    if (ck) {
      return `Los datos no cumplen una regla de la base de datos (${ck}). Revise los valores ingresados.`;
    }
    return "Los datos no cumplen una regla de validación de la base de datos.";
  }
  return msg || "Ocurrió un error inesperado.";
}
