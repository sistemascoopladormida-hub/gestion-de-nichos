import { toSqlDate } from "@/lib/db/sqlParams";

/**
 * Convierte valores de SQL/JSON/formulario a "YYYY-MM-DD" sin desfase por zona horaria.
 * mssql devuelve columnas DATE como Date en UTC medianoche; String(date).slice(0,10) es incorrecto.
 */
export function toDateOnlyString(
  value: string | Date | null | undefined,
): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const y = value.getUTCFullYear();
    const m = value.getUTCMonth() + 1;
    const d = value.getUTCDate();
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  const s = String(value).trim();
  if (s === "") return null;
  const iso = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const parsed = toSqlDate(s);
  if (parsed) return toDateOnlyString(parsed);
  return null;
}

/** Comparación segura de calendario (YYYY-MM-DD). */
export function compareDateOnly(a: string, b: string): number {
  return a.localeCompare(b);
}

function todayLocalDateOnly(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export function addMonthsFromDateStr(dateStr: string, months: number): Date {
  const base = toSqlDate(dateStr);
  if (!base) throw new Error("Fecha inválida");
  const d = new Date(base.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

export function validateFechasFallecido(input: {
  fechaNacimiento?: string | null;
  fechaFallecimiento?: string | null;
  fechaSepultura?: string | null;
}): string | null {
  const nac = toDateOnlyString(input.fechaNacimiento);
  const fall = toDateOnlyString(input.fechaFallecimiento);
  const sep = toDateOnlyString(input.fechaSepultura);
  const hoy = todayLocalDateOnly();

  if (fall && compareDateOnly(fall, hoy) > 0) {
    return "La fecha de fallecimiento no puede ser futura.";
  }
  if (nac && fall && compareDateOnly(nac, fall) > 0) {
    return "La fecha de nacimiento no puede ser posterior al fallecimiento.";
  }
  if (fall && sep && compareDateOnly(sep, fall) < 0) {
    return "La fecha de sepultura no puede ser anterior a la fecha de fallecimiento.";
  }
  return null;
}
