"use client";

import { useEffect, useState } from "react";
import type { NichoMapa } from "@/types/domain";

type Pabellon = { codigo: string; nombre: string };

export function NichoSelector({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number) => void;
}) {
  const [pabellones, setPabellones] = useState<Pabellon[]>([]);
  const [codigo, setCodigo] = useState("P1");
  const [nichos, setNichos] = useState<NichoMapa[]>([]);

  useEffect(() => {
    fetch("/api/pabellones")
      .then((r) => r.json())
      .then((d) =>
        setPabellones(
          (d.rows ?? []).map((p: { codigo: string; nombre: string }) => ({
            codigo: p.codigo,
            nombre: p.nombre,
          })),
        ),
      );
  }, []);

  useEffect(() => {
    fetch(`/api/pabellones/${codigo}/nichos`)
      .then((r) => r.json())
      .then((d) => setNichos(d.nichos ?? []));
  }, [codigo]);

  const disponibles = nichos.filter((n) => n.estadoVisual === "DISPONIBLE");

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        Pabellón
        <select
          className="mt-1 w-full max-w-sm rounded-lg border px-3 py-2"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        >
          {pabellones.map((p) => (
            <option key={p.codigo} value={p.codigo}>
              {p.nombre}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-slate-500">
        {disponibles.length} nichos disponibles en este pabellón
      </p>
      <div className="max-h-48 overflow-y-auto rounded-lg border p-2">
        <div className="flex flex-wrap gap-1">
          {disponibles.map((n) => (
            <button
              key={n.idNicho}
              type="button"
              onClick={() => onChange(n.idNicho)}
              className={`rounded px-2 py-1 text-xs ${value === n.idNicho ? "bg-coop-primary text-white" : "bg-coop-surface hover:bg-slate-200"}`}
            >
              {n.numero}
            </button>
          ))}
        </div>
      </div>
      {value ? (
        <p className="text-sm text-green-700">Nicho seleccionado (ID {value})</p>
      ) : null}
    </div>
  );
}
