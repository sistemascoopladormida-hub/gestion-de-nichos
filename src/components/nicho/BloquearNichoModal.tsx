"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/FeedbackProvider";
import type { NichoEstadoVisual } from "@/types/domain";
import { NichoModalShell } from "./NichoModalShell";

type Modo = "INHABILITADO" | "MANTENIMIENTO";

const PRESETS = [
  "Humedad / filtraciones",
  "Rotura de tapa o losa",
  "Clausurado",
  "Obra en sector",
  "Reparación estructural",
];

type Props = {
  idNicho: number;
  nichoLabel: string;
  modo: Modo;
  onClose: () => void;
  onDone: (result: {
    estadoVisual: NichoEstadoVisual;
    observaciones: string | null;
  }) => void;
};

export function BloquearNichoModal({
  idNicho,
  nichoLabel,
  modo,
  onClose,
  onDone,
}: Props) {
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  const titulo =
    modo === "INHABILITADO"
      ? `Inhabilitar nicho ${nichoLabel}`
      : `Mantenimiento — nicho ${nichoLabel}`;

  async function confirmar() {
    if (!motivo.trim()) {
      toast.error("Indique el motivo");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/nichos/${idNicho}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: modo, motivo: motivo.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo actualizar el nicho");
        return;
      }
      toast.success(
        modo === "INHABILITADO"
          ? `Nicho ${nichoLabel} inhabilitado`
          : `Nicho ${nichoLabel} en mantenimiento`,
      );
      onDone({ estadoVisual: modo, observaciones: motivo.trim() });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <NichoModalShell
      title={titulo}
      description="El nicho dejará de estar disponible en la grilla hasta que se libere."
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" disabled={loading} onClick={confirmar}>
            {loading ? "Guardando…" : "Confirmar"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-driftwood">Motivo frecuente</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <li key={p}>
            <button
              type="button"
              className="rounded-[var(--radius-card)] border border-mist px-2.5 py-1 text-xs text-ink hover:bg-linen"
              onClick={() => setMotivo(p)}
            >
              {p}
            </button>
          </li>
        ))}
      </ul>
      <label className="mt-4 block text-sm">
        <span className="font-medium text-ash">Motivo / observación</span>
        <textarea
          className="ui-input mt-1 min-h-[88px] resize-y"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          autoFocus
        />
      </label>
    </NichoModalShell>
  );
}
