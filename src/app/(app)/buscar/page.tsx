"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { nichoEstadoLabel } from "@/components/nicho/nichoStyles";
import type { NichoEstadoVisual } from "@/types/domain";

function BuscarContent() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [data, setData] = useState<{
    fallecidos: Record<string, unknown>[];
    nichos: Record<string, unknown>[];
    sociosPfc: { apellidos: string; codSoc: string; numDni: string | null; numeroCuenta: string | null }[];
  } | null>(null);

  useEffect(() => {
    if (!q.trim()) return;
    fetch(`/api/buscar?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then(setData);
  }, [q]);

  if (!q.trim()) {
    return (
      <p className="text-sm text-slate-500">
        Use el buscador del inicio o escriba un criterio en la URL (?q=…).
      </p>
    );
  }

  if (!data) return <p className="text-sm">Buscando…</p>;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 font-medium">Fallecidos</h2>
        <ul className="space-y-2">
          {data.fallecidos.map((f) => (
            <li
              key={String(f.ID_FALLECIDO)}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              <Link
                href={`/fallecidos/${f.ID_FALLECIDO}`}
                className="font-medium text-coop-accent hover:underline"
              >
                {String(f.APELLIDO)}, {String(f.NOMBRE ?? "")}
              </Link>
              <p className="text-sm text-slate-500">
                {f.PABELLON
                  ? `${f.PABELLON} — Nicho ${f.NICHO}`
                  : "Sin nicho Cooperativa activo"}
                {f.ESTADO_OCUPACION ? ` · ${String(f.ESTADO_OCUPACION)}` : ""}
              </p>
            </li>
          ))}
          {data.fallecidos.length === 0 ? (
            <li className="text-sm text-slate-500">Sin resultados</li>
          ) : null}
        </ul>
      </section>
      <section>
        <h2 className="mb-3 font-medium">Nichos</h2>
        <ul className="space-y-2">
          {data.nichos.map((n) => (
            <li
              key={String(n.ID_NICHO)}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              <Link
                href={`/cementerio/nicho/${n.ID_NICHO}`}
                className="font-medium text-coop-accent hover:underline"
              >
                {String(n.PABELLON)} — Nicho {String(n.NUMERO)}
              </Link>
              <p className="text-sm text-slate-500">
                {nichoEstadoLabel(n.ESTADO_VISUAL as NichoEstadoVisual)}
                {n.OCUPANTE ? ` · ${String(n.OCUPANTE)}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-3 font-medium">Socios PFC</h2>
        <ul className="space-y-2">
          {data.sociosPfc.map((s, index) => (
            <li key={`${s.codSoc}-${s.numDni ?? 'no-dni'}-${index}`} className="rounded-xl border bg-white p-4 text-sm">
              <p className="font-medium">{s.apellidos}</p>
              <p className="text-slate-500">
                DNI {s.numDni ?? "—"} · Cuenta {s.numeroCuenta ?? "—"} · Socio{" "}
                {s.codSoc}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-coop-primary">Búsqueda global</h1>
      <Suspense fallback={<p className="text-sm">Cargando…</p>}>
        <BuscarContent />
      </Suspense>
    </div>
  );
}
