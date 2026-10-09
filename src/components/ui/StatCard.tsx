import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "forest" | "crimson" | "amber" | "ash";

type Props = {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
  href?: string;
  className?: string;
};

const toneBorder: Record<Tone, string> = {
  neutral: "border-l-ink/20",
  forest: "border-l-[var(--color-nicho-disponible-border)]",
  crimson: "border-l-[var(--color-nicho-ocupado-border)]",
  amber: "border-l-[var(--color-nicho-prestamo-border)]",
  ash: "border-l-ash",
};

function StatCardBody({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: Omit<Props, "href" | "className">) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-pretty text-sm font-medium leading-snug text-ash">{label}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-ink md:text-4xl">
            {value}
          </p>
          {hint ? <p className="mt-1.5 text-sm leading-snug text-driftwood">{hint}</p> : null}
        </div>
        {Icon ? (
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linen/80 text-ash"
            aria-hidden
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
        ) : null}
      </div>
    </>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  href,
  className,
}: Props) {
  const shell = cn(
    "ui-surface ui-surface-interactive block border-l-4 p-5",
    toneBorder[tone],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={shell}>
        <StatCardBody
          label={label}
          value={value}
          hint={hint}
          icon={icon}
          tone={tone}
        />
        <span className="mt-3 inline-block text-sm font-medium text-forest">
          Ver detalle →
        </span>
      </Link>
    );
  }

  return (
    <article className={shell}>
      <StatCardBody label={label} value={value} hint={hint} icon={icon} tone={tone} />
    </article>
  );
}
