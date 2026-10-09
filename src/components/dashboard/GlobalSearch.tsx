"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

const FILTERS = [
  { id: "all", label: "Todo" },
  { id: "fallecido", label: "Fallecido" },
  { id: "dni", label: "DNI" },
  { id: "nicho", label: "Nicho" },
  { id: "socio", label: "Socio PFC" },
] as const;

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const submit = useCallback(() => {
    const term = q.trim();
    if (!term) return;
    const params = new URLSearchParams({ q: term });
    if (filter !== "all") params.set("tipo", filter);
    router.push(`/buscar?${params.toString()}`);
  }, [q, filter, router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section
      className={cn(
        "ui-card border-2 transition-colors duration-150",
        focused ? "border-forest/40" : "border-stone/60",
      )}
      aria-label="Búsqueda global"
    >
      <p className="ui-eyebrow mb-3">Búsqueda global</p>
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash"
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            placeholder="Fallecido, DNI, nicho o socio…"
            className="ui-input pl-10 pr-20"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-keyshortcuts="/ Control+K Meta+K"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 gap-1 sm:flex">
            <kbd className="ui-kbd">/</kbd>
            <kbd className="ui-kbd">⌘K</kbd>
          </span>
        </div>
        <button type="submit" className="ui-btn-primary shrink-0">
          Buscar
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtro rápido">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={cn(
              "rounded-[var(--radius-card)] border px-2.5 py-1 text-xs transition-colors duration-150",
              filter === f.id
                ? "border-ink/25 bg-linen text-ink"
                : "border-transparent text-ash hover:bg-bone",
            )}
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
    </section>
  );
}
