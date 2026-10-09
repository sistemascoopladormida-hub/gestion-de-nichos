"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutGrid,
  Map,
  Search,
  Shield,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { SessionUser } from "@/types/domain";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils/cn";
import { UserMenu } from "./UserMenu";

const nav: {
  href: string;
  label: string;
  permission: Permission;
  icon: typeof LayoutGrid;
}[] = [
  { href: "/dashboard", label: "Inicio", permission: "dashboard:view", icon: LayoutGrid },
  { href: "/cementerio", label: "Cementerio", permission: "cementerio:view", icon: Map },
  { href: "/fallecidos", label: "Fallecidos", permission: "fallecidos:view", icon: Users },
  {
    href: "/servicios/nuevo",
    label: "Servicios",
    permission: "servicios:create",
    icon: UserPlus,
  },
  { href: "/prestamos", label: "Préstamos", permission: "prestamos:view", icon: Wallet },
  { href: "/buscar", label: "Buscar", permission: "buscar:view", icon: Search },
  { href: "/reportes", label: "Reportes", permission: "reportes:view", icon: BarChart3 },
  { href: "/auditoria", label: "Auditoría", permission: "auditoria:view", icon: Shield },
];

export function AppHeader({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const items = nav.filter((item) => hasPermission(user, item.permission));

  return (
    <header
      className="sticky top-0 z-40 py-4 border-b border-stone/80 bg-parchment/90 backdrop-blur-md"
      style={{ boxShadow: "var(--shadow-header)" }}
    >
      <div className="mx-auto flex h-[52px] max-w-[1300px] items-center gap-4 px-6">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/logocooptransparente.png"
            alt=""
            width={100}
            height={100}
            className="h-16 w-auto"
          />
          <div className="hidden sm:block">
            <p className="text-md font-medium leading-tight text-ink">Cementerio</p>
            <p className="font-mono text-[10px] text-ash">Coop. La Dormida</p>
          </div>
        </Link>

        <nav
          className="hidden flex-1 items-center gap-0.5 overflow-x-auto lg:flex"
          aria-label="Principal"
        >
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-[var(--radius-card)] px-3 py-2 text-sm transition-colors duration-150",
                  active
                    ? "bg-linen text-ink"
                    : "text-ash hover:bg-bone hover:text-ink",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <nav
          className="flex flex-1 gap-1 overflow-x-auto lg:hidden"
          aria-label="Principal móvil"
        >
          {items.slice(0, 5).map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-[var(--radius-card)] px-2 py-1.5 text-xs",
                  active ? "bg-linen text-ink" : "text-ash",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <UserMenu user={user} />
      </div>
    </header>
  );
}
