"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SessionUser } from "@/types/domain";
import { cn } from "@/lib/utils/cn";

export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const initials = `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
  const isAdmin = user.rol === "ADMINISTRADOR";

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-[var(--radius-card)] border border-stone/80 bg-bone px-2 py-1.5 transition-colors hover:bg-linen focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-card)] bg-ink font-mono text-xs text-parchment"
          aria-hidden
        >
          {initials}
        </span>
        <span className="hidden max-w-[140px] truncate text-left sm:block">
          <span className="block text-sm text-ink">
            {user.nombre} {user.apellido}
          </span>
          <span className="ui-badge mt-0.5 border-0 bg-transparent p-0 normal-case tracking-normal">
            {user.rol}
          </span>
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 rounded-[var(--radius-modal)] border border-stone bg-bone p-2 shadow-[var(--shadow-card)]"
        >
          <div className="border-b border-stone/60 px-3 py-2">
            <p className="text-sm text-ink">
              {user.nombre} {user.apellido}
            </p>
            <p className="font-mono text-[11px] text-ash">@{user.usuario}</p>
            <span
              className={cn(
                "ui-badge mt-2",
                isAdmin ? "border-forest/40 text-forest" : "text-ash",
              )}
            >
              {user.rol}
            </span>
          </div>
          <button
            type="button"
            role="menuitem"
            className="mt-1 flex w-full items-center gap-2 rounded-[var(--radius-card)] px-3 py-2 text-left text-sm text-crimson hover:bg-[color-mix(in_oklab,#cf2d56_8%,#f2f1ed)]"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
              router.refresh();
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}
