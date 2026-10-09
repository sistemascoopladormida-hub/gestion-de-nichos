/**
 * Convierte cadenas vacías / solo espacios en null (recursivo en objetos y arrays).
 */
export function emptyToNull(value: unknown): unknown {
  if (value === undefined || value === "") return null;
  if (typeof value === "string") {
    const t = value.trim();
    return t === "" ? null : t;
  }
  return value;
}

export function cleanEmptyFields<T>(value: T): T {
  const normalized = emptyToNull(value);
  if (normalized === null) return null as T;
  if (Array.isArray(value)) {
    return value.map((item) => cleanEmptyFields(item)) as T;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = cleanEmptyFields(val);
    }
    return out as T;
  }
  return value;
}
