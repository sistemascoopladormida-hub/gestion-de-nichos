"use client";

import { useEffect, useState } from "react";
import type { NichoMapa } from "@/types/domain";
import { MapaLeyenda } from "@/components/nicho/MapaLeyenda";
import { NichoGrid } from "@/components/nicho/NichoGrid";

type Pabellon = {
  codigo: string;
  nombre: string;
  columnasMapa: number;
  filasMapa: number;
};

type Props = {
  selectedId: number | null;
  onSelect: (nicho: NichoMapa, pabellon: Pabellon) => void;
};

export function NichoMapaWizard({ selectedId, onSelect }: Props) {
  const [pabellones, setPabellones] = useState<Pabellon[]>([]);
  const [codigo, setCodigo] = useState("P1");
  const [nichos, setNichos] = useState<NichoMapa[]>([]);
  const [selectedMeta, setSelectedMeta] = useState<{
    nicho: NichoMapa;
    pabellon: Pabellon;
  } | null>(null);

  useEffect(() => {
    fetch("/api/pabellones")
      .then((r) => r.json())
      .then((d) => {
        const rows = (d.rows ?? []).map(
          (p: {
            codigo: string;
            nombre: string;
            columnasMapa: number;
            filasMapa: number;
          }) => ({
            codigo: p.codigo,
            nombre: p.nombre,
            columnasMapa: p.columnasMapa,
            filasMapa: p.filasMapa,
          }),
        );
        setPabellones(rows);
        if (rows[0]) setCodigo(rows[0].codigo);
      });
  }, []);

  useEffect(() => {
    if (!codigo) return;
    fetch(`/api/pabellones/${codigo}/nichos`)
      .then((r) => r.json())
      .then((d) => setNichos(d.nichos ?? []));
  }, [codigo]);

  const pab = pabellones.find((p) => p.codigo === codigo);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        1. Seleccionar pabellón
        <select
          className="mt-1 w-full max-w-md rounded-lg border border-coop-border px-3 py-2"
          value={codigo}
          onChange={(e) => {
            setCodigo(e.target.value);
            setSelectedMeta(null);
          }}
        >
          {pabellones.map((p) => (
            <option key={p.codigo} value={p.codigo}>
              {p.nombre}
            </option>
          ))}
        </select>
      </label>

      {pab ? (
        <>
          <p className="text-sm text-slate-600">
            2. Haga clic en un nicho <strong>disponible</strong> en el mapa
          </p>
          <MapaLeyenda />
          <NichoGrid
            nichos={nichos}
            columnas={pab.columnasMapa}
            filas={pab.filasMapa}
            mode="select"
            selectedId={selectedId}
            onSelect={(n) => {
              setSelectedMeta({ nicho: n, pabellon: pab });
              onSelect(n, pab);
            }}
          />
          {selectedMeta ? (
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-900">
              Nicho seleccionado:{" "}
              <strong>
                {selectedMeta.pabellon.nombre} — Nicho {selectedMeta.nicho.numero}
              </strong>
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
