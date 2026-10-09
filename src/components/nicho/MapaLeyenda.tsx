"use client";

import type { NichoEstadoVisual } from "@/types/domain";
import { cn } from "@/lib/utils/cn";
import { nichoEstadoLabel, nichoLegendDotClass } from "./nichoStyles";

const items: NichoEstadoVisual[] = [
  "DISPONIBLE",
  "OCUPADO",
  "OCUPADO_SIN_DATOS",
  "PRESTAMO",
  "RESERVADO",
  "INHABILITADO",
  "MANTENIMIENTO",
];

type Props = {
  activeFilters?: Set<NichoEstadoVisual> | null;
  onToggleFilter?: (estado: NichoEstadoVisual) => void;
  onClearFilters?: () => void;
};

export function MapaLeyenda({
  activeFilters,
  onToggleFilter,
  onClearFilters,
}: Props) {
  const interactive = Boolean(onToggleFilter);

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-[var(--radius-card)] border border-stone/80 bg-bone px-4 py-3"
      role={interactive ? "group" : undefined}
      aria-label={interactive ? "Filtrar por estado de nicho" : "Leyenda de estados"}
    >
      <span className="ui-eyebrow mr-1">Estados</span>
      {items.map((e) => {
        const active = activeFilters?.has(e);
        const inactiveFilter =
          activeFilters && activeFilters.size > 0 && !active;
        if (interactive) {
          return (
            <button
              key={e}
              type="button"
              aria-pressed={activeFilters?.size ? active : undefined}
              onClick={() => onToggleFilter?.(e)}
              className={cn(
                "flex items-center gap-1.5 rounded-[var(--radius-card)] border px-2.5 py-1 text-xs transition-colors duration-150",
                active
                  ? "border-ink/30 bg-linen text-ink"
                  : inactiveFilter
                    ? "border-transparent text-mist opacity-60"
                    : "border-transparent text-ash hover:bg-linen/80 hover:text-ink",
              )}
            >
              <span className={nichoLegendDotClass(e)} aria-hidden />
              {nichoEstadoLabel(e)}
            </button>
          );
        }
        return (
          <span key={e} className="flex items-center gap-1.5 text-xs text-ash">
            <span className={nichoLegendDotClass(e)} aria-hidden />
            {nichoEstadoLabel(e)}
          </span>
        );
      })}
      {interactive && activeFilters && activeFilters.size > 0 ? (
        <button
          type="button"
          className="ui-btn-ghost ml-auto text-xs"
          onClick={() => onClearFilters?.()}
        >
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}
