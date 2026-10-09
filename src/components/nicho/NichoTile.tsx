"use client";

import Link from "next/link";
import type { NichoEstadoVisual } from "@/types/domain";
import type { NichoMapa } from "@/types/domain";
import { cn } from "@/lib/utils/cn";
import { HelpCircle } from "lucide-react";
import { nichoEstadoLabel, nichoTileClasses } from "./nichoStyles";

type Props = {
  nicho: NichoMapa;
  compact?: boolean;
  mode?: "link" | "select" | "interactive";
  selected?: boolean;
  dimmed?: boolean;
  onSelect?: (nicho: NichoMapa) => void;
};

export function NichoTile({
  nicho,
  compact,
  mode = "link",
  selected,
  dimmed,
  onSelect,
}: Props) {
  const num = String(nicho.numero).padStart(2, "0");
  const selectable =
    mode === "interactive" ? true : nicho.estadoVisual === "DISPONIBLE";
  const title = [
    `Nicho ${nicho.numero}`,
    `Estado: ${nichoEstadoLabel(nicho.estadoVisual)}`,
    nicho.fallecidoNombre ? `Fallecido: ${nicho.fallecidoNombre}` : null,
    nicho.fechaSepultura ? `Sepultura: ${nicho.fechaSepultura}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const className = cn(
    nichoTileClasses(nicho.estadoVisual, { selected, dimmed }),
    "flex items-center justify-center rounded-[var(--radius-card)] shadow-sm",
    compact ? "h-9 min-w-[2.25rem] text-xs" : "h-11 min-w-[2.75rem] text-sm",
    mode === "select" && !selectable && "cursor-not-allowed opacity-45",
    (mode === "select" || mode === "interactive") &&
      selectable &&
      "cursor-pointer hover:brightness-[0.98] hover:shadow-md active:scale-[0.98]",
    mode === "link" && "hover:brightness-[0.98] hover:shadow-md",
  );

  const isPickMode = mode === "select" || mode === "interactive";

  if (isPickMode) {
    return (
      <button
        type="button"
        title={title}
        aria-label={`Nicho ${nicho.numero}, ${nichoEstadoLabel(nicho.estadoVisual)}`}
        aria-pressed={selected}
        disabled={mode === "select" && !selectable}
        onClick={() => selectable && onSelect?.(nicho)}
        className={className}
      >
        <span className="relative">
          {num}
          {nicho.estadoVisual === "OCUPADO_SIN_DATOS" ? (
            <HelpCircle
              className="absolute -right-2 -top-2 h-3 w-3 text-ash"
              aria-hidden
            />
          ) : null}
        </span>
      </button>
    );
  }

  return (
    <Link href={`/cementerio/nicho/${nicho.idNicho}`} title={title} className={className}>
      <span className="relative">
        {num}
        {nicho.estadoVisual === "OCUPADO_SIN_DATOS" ? (
          <HelpCircle
            className="absolute -right-2 -top-2 h-3 w-3 text-ash"
            aria-hidden
          />
        ) : null}
      </span>
    </Link>
  );
}
