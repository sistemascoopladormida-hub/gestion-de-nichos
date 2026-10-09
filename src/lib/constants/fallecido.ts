/** Apellido reservado para ocupaciones sin identificación (ver DATOS_INCOMPLETOS). */
export const FALLECIDO_SIN_DATOS_APELLIDO = "Sin datos";
export const FALLECIDO_SIN_DATOS_NOMBRE = "A completar";

export function esFallecidoPlaceholder(apellido: string, nombre?: string | null): boolean {
  return (
    apellido.trim().toLowerCase() === FALLECIDO_SIN_DATOS_APELLIDO.toLowerCase() &&
    (nombre ?? "").trim().toLowerCase() === FALLECIDO_SIN_DATOS_NOMBRE.toLowerCase()
  );
}
