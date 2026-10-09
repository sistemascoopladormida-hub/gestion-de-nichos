"use client";

import { useState } from "react";
import type { SocioPfc } from "@/lib/pfc/types";

type Props = {
  onSelect: (socio: SocioPfc) => void;
  label?: string;
};

export function PfcSearchPanel({ onSelect, label = "Buscar socio PFC" }: Props) {
  const [dni, setDni] = useState("");
  const [apellido, setApellido] = useState("");
  const [results, setResults] = useState<SocioPfc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buscar() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dni.trim()) params.set("dni", dni.trim());
      if (apellido.trim()) params.set("apellido", apellido.trim());
      const res = await fetch(`/api/pfc/buscar?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error de búsqueda");
      setResults(data.results ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-coop-border bg-white p-4 shadow-sm">
      <p className="mb-3 font-medium text-coop-primary">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          placeholder="DNI"
          className="rounded-lg border border-coop-border px-3 py-2 text-sm"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
        />
        <input
          placeholder="Apellido"
          className="rounded-lg border border-coop-border px-3 py-2 text-sm"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
        />
      </div>
      <button
        type="button"
        onClick={buscar}
        disabled={loading}
        className="mt-3 rounded-lg bg-coop-accent px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Buscando…" : "Buscar"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <ul className="mt-4 space-y-2">
        {results.map((s) => (
          <li
            key={`${s.codSoc}-${s.numDni}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-coop-border p-3 text-sm"
          >
            <div>
              <p className="font-medium">{s.apellidos}</p>
              <p className="text-slate-500">
                DNI: {s.numDni ?? "—"} · Cuenta: {s.numeroCuenta ?? "—"} · Socio:{" "}
                {s.codSoc}
              </p>
              <p className="text-slate-500">
                PFC: {s.servicioActivo ? "ACTIVO" : s.estadoServicio}
              </p>
            </div>
            <button
              type="button"
              className="rounded-md bg-coop-primary px-3 py-1.5 text-xs text-white"
              onClick={() => onSelect(s)}
            >
              Seleccionar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
