/**
 * Valores seguros para parámetros mssql (evita pasar "" a sql.Date).
 */
export function toOptionalString(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const t = String(value).trim();
  return t === "" ? null : t;
}

export function toSqlDate(
  value: string | Date | null | undefined,
): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const y = value.getUTCFullYear();
    const m = value.getUTCMonth();
    const d = value.getUTCDate();
    return new Date(Date.UTC(y, m, d, 12, 0, 0, 0));
  }
  const s = String(value).trim();
  if (s === "") return null;
  const dateOnly = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateOnly) {
    const [y, mo, day] = dateOnly[1].split("-").map(Number);
    return new Date(Date.UTC(y, mo - 1, day, 12, 0, 0, 0));
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0, 0),
  );
}

export function toSqlDateTime(
  value: string | Date | null | undefined,
): Date | null {
  return toSqlDate(value);
}
