"use client";

import { CalendarDays } from "lucide-react";
import { compareDateOnly, toDateOnlyString } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: string;
  onChange: (value: string) => void;
  fechaFallecimiento?: string | null;
  className?: string;
};

function todayInputValue(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export function todayDateOnly(): string {
  return todayInputValue();
}

export function FechaSepulturaField({
  value,
  onChange,
  fechaFallecimiento,
  className,
}: Props) {
  const hoy = todayInputValue();
  const vacia = !value.trim();
  const fall = fechaFallecimiento ? toDateOnlyString(fechaFallecimiento) : null;
  const sep = value ? toDateOnlyString(value) : null;
  const antesDeFall =
    fall && sep && compareDateOnly(sep, fall) < 0;

  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-mist/80 bg-[var(--color-paper)] p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-card)] border border-stone/70 bg-bone text-forest"
          aria-hidden
        >
          <CalendarDays className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <label className="block font-serif text-base text-ink">
            Fecha de sepultura <span className="text-crimson">*</span>
          </label>
          <p className="mt-0.5 text-xs text-driftwood">
            Día en que se realizó la sepultura. Define el plazo de 10 años y, si
            corresponde, el vencimiento del préstamo.
          </p>
          <input
            type="date"
            required
            className="ui-input mt-3 max-w-xs"
            value={value}
            max={hoy}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
      {vacia ? (
        <p className="mt-3 text-sm text-crimson" role="alert">
          Indique la fecha de sepultura para continuar.
        </p>
      ) : null}
      {antesDeFall ? (
        <p className="mt-3 rounded-md border border-amber/40 bg-[color-mix(in_oklab,#c08532_10%,#f9faf7)] px-3 py-2 text-sm text-ink" role="alert">
          La fecha de sepultura es anterior a la fecha de fallecimiento registrada.
          Revise ambas fechas antes de confirmar.
        </p>
      ) : null}
    </div>
  );
}
