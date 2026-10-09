"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/FeedbackProvider";
import type { NichoEstadoVisual } from "@/types/domain";
import { NichoModalShell } from "./NichoModalShell";

type Props = {
  idNicho: number;
  nichoLabel: string;
  onClose: () => void;
  onDone: (result: {
    estadoVisual: NichoEstadoVisual;
    observaciones: string | null;
  }) => void;
};

export function ReservarNichoModal({ idNicho, nichoLabel, onClose, onDone }: Props) {
  const [titular, setTitular] = useState("");
  const [obs, setObs] = useState("");
  const [loading, setLoading] = useState(false);

  async function confirmar() {
    if (!titular.trim()) {
      toast.error("Indique el titular o socio que reserva");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/nichos/${idNicho}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "RESERVADO",
          titularReserva: titular.trim(),
          motivo: obs.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo reservar el nicho");
        return;
      }
      const observaciones = obs.trim()
        ? `Reserva: ${titular.trim()}. ${obs.trim()}`
        : `Reserva: ${titular.trim()}`;
      toast.success(`Nicho ${nichoLabel} reservado`);
      onDone({ estadoVisual: "RESERVADO", observaciones });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <NichoModalShell
      title={`Reservar nicho ${nichoLabel}`}
      description="Registre quién reserva el nicho. Quedará bloqueado para otras asignaciones."
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={loading} onClick={confirmar}>
            {loading ? "Guardando…" : "Confirmar reserva"}
          </Button>
        </>
      }
    >
      <label className="block text-sm">
        <span className="font-medium text-ash">Titular / socio</span>
        <input
          className="ui-input mt-1"
          value={titular}
          onChange={(e) => setTitular(e.target.value)}
          placeholder="Apellido y nombre o nº de socio"
          autoFocus
        />
      </label>
      <label className="mt-4 block text-sm">
        <span className="font-medium text-ash">Observaciones (opcional)</span>
        <textarea
          className="ui-input mt-1 min-h-[80px] resize-y"
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder="Contacto, plazo estimado, etc."
        />
      </label>
    </NichoModalShell>
  );
}
