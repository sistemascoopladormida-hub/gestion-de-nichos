import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

type Props = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  primary?: boolean;
};

export function QuickActionCard({
  href,
  label,
  description,
  icon: Icon,
  primary,
}: Props) {
  return (
    <Button
      href={href}
      variant={primary ? "primary" : "secondary"}
      className={cn(
        "!h-auto w-full !flex-row !items-start !justify-start !gap-4 !p-5 !text-left",
        !primary && "ui-surface !border-stone/80 !bg-bone !shadow-none hover:!bg-linen/50",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
          primary ? "bg-parchment/15 text-parchment" : "bg-linen text-ink",
        )}
        aria-hidden
      >
        {primary ? (
          <Plus className="h-5 w-5" strokeWidth={2} />
        ) : (
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-medium">{label}</span>
        <span
          className={cn(
            "mt-0.5 block text-sm font-normal leading-snug",
            primary ? "text-parchment/85" : "text-driftwood",
          )}
        >
          {description}
        </span>
      </span>
    </Button>
  );
}
