import Link from "next/link";
import { MapPin } from "lucide-react";
import type { PabellonResumen } from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export function PabellonCard({ p }: { p: PabellonResumen }) {
  const pct =
    p.totalNichos > 0 ? Math.round((p.ocupados / p.totalNichos) * 100) : 0;
  const libres = p.disponibles;

  return (
    <article className="ui-card ui-card-hover flex flex-col border-l-4 border-l-forest/50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="ui-eyebrow">{p.codigo}</p>
          <h2 className="mt-1 font-serif text-[var(--text-heading-sm)] tracking-tight">
            {p.nombre}
          </h2>
          <p className="mt-1 flex items-center gap-1 text-xs text-driftwood">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {p.ubicacion}
          </p>
        </div>
        <span className="ui-badge border-forest/30 text-forest">{pct}% ocup.</span>
      </div>

      <div className="mt-4">
        <div
          className="h-2 overflow-hidden rounded-[var(--radius-card)] bg-linen"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Ocupación ${pct} por ciento`}
        >
          <div
            className={cn(
              "h-full rounded-[var(--radius-card)] transition-all duration-300",
              pct > 85 ? "bg-crimson" : pct > 60 ? "bg-amber" : "bg-forest",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-[var(--radius-card)] bg-linen/80 px-2 py-2">
            <dt className="text-ash">Total</dt>
            <dd className="font-mono text-lg text-ink">{p.totalNichos}</dd>
          </div>
          <div className="rounded-[var(--radius-card)] bg-[color-mix(in_oklab,#cf2d56_8%,#f2f1ed)] px-2 py-2">
            <dt className="text-crimson/80">Ocupados</dt>
            <dd className="font-mono text-lg text-crimson">{p.ocupados}</dd>
          </div>
          <div className="rounded-[var(--radius-card)] bg-[color-mix(in_oklab,#34785c_10%,#f2f1ed)] px-2 py-2">
            <dt className="text-forest/80">Libres</dt>
            <dd className="font-mono text-lg text-forest">{libres}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {p.prestados > 0 ? (
          <span className="ui-badge border-amber/40 text-amber">
            {p.prestados} préstamo{p.prestados !== 1 ? "s" : ""}
          </span>
        ) : null}
      </div>

      <Button
        href={`/cementerio/pabellon/${p.codigo}`}
        className="mt-6 w-full"
      >
        Ver mapa interactivo
      </Button>
    </article>
  );
}
