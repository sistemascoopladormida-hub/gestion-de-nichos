import type { LucideIcon } from "lucide-react";
import { Map, Search, UserPlus, Users } from "lucide-react";
import { QuickActionCard } from "@/components/ui/QuickActionCard";

type Item = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  primary?: boolean;
};

export function QuickActionGrid({ items }: { items: Item[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((q) => (
        <QuickActionCard key={q.href} {...q} />
      ))}
    </div>
  );
}

export const quickActionIcons = {
  servicio: UserPlus,
  fallecido: Users,
  buscar: Search,
  cementerio: Map,
};
