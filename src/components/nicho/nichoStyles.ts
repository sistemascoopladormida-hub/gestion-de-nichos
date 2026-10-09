import type { NichoEstadoVisual } from "@/types/domain";
import { cn } from "@/lib/utils/cn";

export function nichoEstadoLabel(estado: NichoEstadoVisual): string {
  const labels: Record<NichoEstadoVisual, string> = {
    DISPONIBLE: "Disponible",
    OCUPADO: "Ocupado",
    OCUPADO_SIN_DATOS: "Ocupado sin datos",
    PRESTAMO: "En préstamo",
    INHABILITADO: "Inhabilitado",
    RESERVADO: "Reservado",
    MANTENIMIENTO: "Mantenimiento",
  };
  return labels[estado];
}

/** @deprecated use nichoTileClasses */
export function nichoColor(estado: NichoEstadoVisual): string {
  return nichoTileClasses(estado).split(" ")[0] ?? "";
}

export function nichoTileClasses(
  estado: NichoEstadoVisual,
  opts?: { selected?: boolean; dimmed?: boolean },
): string {
  const base =
    "border-2 font-mono font-medium text-ink transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

  const byEstado: Record<NichoEstadoVisual, string> = {
    DISPONIBLE:
      "bg-[var(--color-nicho-disponible)] border-[var(--color-nicho-disponible-border)]",
    OCUPADO:
      "bg-[var(--color-nicho-ocupado)] border-[var(--color-nicho-ocupado-border)]",
    OCUPADO_SIN_DATOS:
      "bg-[var(--color-nicho-sin-datos)] border-dashed border-[var(--color-nicho-sin-datos-border)]",
    PRESTAMO:
      "bg-[var(--color-nicho-prestamo)] border-[var(--color-nicho-prestamo-border)]",
    INHABILITADO:
      "bg-[var(--color-nicho-inhabilitado)] border-[var(--color-nicho-inhabilitado-border)]",
    RESERVADO:
      "bg-[var(--color-nicho-reservado)] border-[var(--color-nicho-reservado-border)]",
    MANTENIMIENTO:
      "bg-[var(--color-nicho-mantenimiento)] border-[var(--color-nicho-mantenimiento-border)]",
  };

  return cn(
    base,
    byEstado[estado],
    opts?.selected &&
      "ring-2 ring-ink ring-offset-2 ring-offset-parchment scale-[1.02] shadow-[var(--shadow-subtle)] z-[1]",
    opts?.dimmed && "opacity-35 saturate-50",
  );
}

export function nichoLegendDotClass(estado: NichoEstadoVisual): string {
  const map: Record<NichoEstadoVisual, string> = {
    DISPONIBLE: "bg-[var(--color-nicho-disponible-border)]",
    OCUPADO: "bg-[var(--color-nicho-ocupado-border)]",
    OCUPADO_SIN_DATOS: "bg-[var(--color-nicho-sin-datos-border)]",
    PRESTAMO: "bg-[var(--color-nicho-prestamo-border)]",
    INHABILITADO: "bg-[var(--color-nicho-inhabilitado-border)]",
    RESERVADO: "bg-[var(--color-nicho-reservado-border)]",
    MANTENIMIENTO: "bg-[var(--color-nicho-mantenimiento-border)]",
  };
  return cn("inline-block h-2.5 w-2.5 rounded-[2px]", map[estado]);
}
