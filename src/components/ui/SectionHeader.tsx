import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "default" | "emphasis";
  className?: string;
  id?: string;
};

export function SectionHeader({
  title,
  description,
  action,
  variant = "default",
  className,
  id,
}: Props) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div>
        <h2
          id={id}
          className={cn(
            "text-ink",
            variant === "emphasis"
              ? "text-lg font-semibold md:text-xl"
              : "text-sm font-medium uppercase tracking-wide text-ash",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-driftwood">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
