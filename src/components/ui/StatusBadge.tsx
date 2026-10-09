import type { NichoEstadoVisual } from "@/types/domain";
import { nichoEstadoLabel } from "@/components/nicho/nichoStyles";
import { cn } from "@/lib/utils/cn";

type Props = {
  estado: NichoEstadoVisual;
  className?: string;
};

const badgeStyles: Record<NichoEstadoVisual, string> = {
  DISPONIBLE:
    "border-[var(--color-nicho-disponible-border)]/40 bg-[var(--color-nicho-disponible)] text-ink",
  OCUPADO:
    "border-[var(--color-nicho-ocupado-border)]/40 bg-[var(--color-nicho-ocupado)] text-ink",
  OCUPADO_SIN_DATOS:
    "border-dashed border-[var(--color-nicho-sin-datos-border)]/50 bg-[var(--color-nicho-sin-datos)] text-ink",
  PRESTAMO:
    "border-[var(--color-nicho-prestamo-border)]/40 bg-[var(--color-nicho-prestamo)] text-ink",
  INHABILITADO:
    "border-[var(--color-nicho-inhabilitado-border)]/40 bg-[var(--color-nicho-inhabilitado)] text-ink",
  MANTENIMIENTO:
    "border-[var(--color-nicho-mantenimiento-border)]/40 bg-[var(--color-nicho-mantenimiento)] text-ink",
  RESERVADO:
    "border-[var(--color-nicho-reservado-border)]/40 bg-[var(--color-nicho-reservado)] text-ink",
};

export function StatusBadge({ estado, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium",
        badgeStyles[estado],
        className,
      )}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full bg-current opacity-70"
        aria-hidden
      />
      {nichoEstadoLabel(estado)}
    </span>
  );
}
