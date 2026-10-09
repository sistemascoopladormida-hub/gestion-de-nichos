import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "ui-surface flex flex-col items-center px-6 py-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <span
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-linen text-forest"
          aria-hidden
        >
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </span>
      ) : null}
      <p className="text-base font-medium text-ink">{title}</p>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-driftwood">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
