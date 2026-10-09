import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Props = {
  href: string;
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "neutral" | "warning" | "danger";
};

const toneMap = {
  neutral: "border-stone/80 hover:border-stone",
  warning: "border-amber/35 bg-[color-mix(in_oklab,#c08532_6%,#f7f7f4)] hover:border-amber/50",
  danger:
    "border-crimson/35 bg-[color-mix(in_oklab,#cf2d56_6%,#f7f7f4)] hover:border-crimson/50",
};

export function AlertCard({ href, label, value, icon: Icon, tone = "neutral" }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "ui-surface ui-surface-interactive flex items-center gap-4 p-4",
        toneMap[tone],
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone/60 bg-bone text-ash",
          tone === "warning" && "border-amber/30 text-amber",
          tone === "danger" && "border-crimson/30 text-crimson",
        )}
        aria-hidden
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-driftwood">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-ink">{value}</p>
      </div>
      <span className="hidden text-sm font-medium text-forest sm:inline">Consultar</span>
    </Link>
  );
}
