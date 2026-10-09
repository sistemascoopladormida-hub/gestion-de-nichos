import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Props = {
  href: string;
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "neutral" | "warning" | "danger";
  /** Texto secundario bajo el número (p. ej. plazo o unidad). */
  caption?: string;
};

const toneMap = {
  neutral: "border-stone/80 hover:border-stone",
  warning: "border-amber/35 bg-[color-mix(in_oklab,#c08532_6%,#f7f7f4)] hover:border-amber/50",
  danger:
    "border-crimson/35 bg-[color-mix(in_oklab,#cf2d56_6%,#f7f7f4)] hover:border-crimson/50",
};

export function AlertCard({
  href,
  label,
  value,
  icon: Icon,
  tone = "neutral",
  caption,
}: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "ui-surface ui-surface-interactive group flex min-h-[9.25rem] flex-col justify-between gap-3 p-4 sm:min-h-[8.75rem] sm:p-5",
        toneMap[tone],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-pretty text-sm font-medium leading-snug text-ink">
          {label}
        </p>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone/60 bg-bone text-ash",
            tone === "warning" && "border-amber/30 text-amber",
            tone === "danger" && "border-crimson/30 text-crimson",
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-end">
        <p className="text-3xl font-semibold tabular-nums tracking-tight text-ink">
          {value}
        </p>
        {caption ? (
          <p className="mt-0.5 text-xs font-normal text-driftwood">{caption}</p>
        ) : null}
      </div>

      <span className="text-sm font-medium text-forest transition-colors group-hover:text-forest/80 group-hover:underline">
        Consultar →
      </span>
    </Link>
  );
}
