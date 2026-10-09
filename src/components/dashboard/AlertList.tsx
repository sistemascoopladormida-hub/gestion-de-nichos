import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileWarning,
  HelpCircle,
  Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AlertaItem } from "@/types/domain";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils/cn";

const meta: Record<
  AlertaItem["tipo"],
  { icon: LucideIcon; urgency: "high" | "medium" | "low" }
> = {
  PRESTAMO_VENCIDO: { icon: AlertTriangle, urgency: "high" },
  PRESTAMO_PROXIMO: { icon: Timer, urgency: "medium" },
  DIEZ_ANIOS: { icon: Clock, urgency: "medium" },
  DOCUMENTACION: { icon: FileWarning, urgency: "low" },
  NICHO_SIN_DATOS: { icon: HelpCircle, urgency: "medium" },
};

function ctaLabel(tipo: AlertaItem["tipo"]): string {
  if (tipo === "DIEZ_ANIOS") return "Ver ficha";
  if (tipo === "DOCUMENTACION") return "Ver documentación";
  if (tipo === "NICHO_SIN_DATOS") return "Completar datos";
  return "Ver detalle";
}

export function AlertList({ alertas }: { alertas: AlertaItem[] }) {
  if (alertas.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No hay alertas pendientes"
        description="Actualmente no hay registros que requieran atención inmediata."
        className="border-dashed bg-bone/80"
      />
    );
  }

  return (
    <ul className="divide-y divide-stone/50 overflow-hidden rounded-lg border border-stone/70 bg-bone">
      {alertas.map((a, i) => {
        const m = meta[a.tipo];
        const Icon = m.icon;
        return (
          <li key={`${a.tipo}-${i}`}>
            <Link
              href={a.href}
              className="flex gap-4 px-4 py-3.5 transition-colors duration-150 hover:bg-linen/50 focus-visible:bg-linen/50 focus-visible:outline-none"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                  m.urgency === "high" &&
                    "border-crimson/30 bg-[color-mix(in_oklab,#cf2d56_10%,#f2f1ed)] text-crimson",
                  m.urgency === "medium" &&
                    "border-amber/30 bg-[color-mix(in_oklab,#c08532_12%,#f2f1ed)] text-amber",
                  m.urgency === "low" && "border-stone bg-linen text-ash",
                )}
                aria-hidden
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{a.titulo}</p>
                <p className="mt-0.5 text-sm text-driftwood">{a.detalle}</p>
              </div>
              <span className="hidden shrink-0 self-center text-sm font-medium text-forest sm:inline">
                {ctaLabel(a.tipo)} →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
