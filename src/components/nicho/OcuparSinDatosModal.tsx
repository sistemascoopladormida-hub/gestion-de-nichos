"use client";

import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/FeedbackProvider";
import {
  FechaSepulturaField,
  todayDateOnly,
} from "./FechaSepulturaField";

type Props = {
  idNicho: number;
  nichoLabel: string;
  onClose: () => void;
  onDone: (result: {
    idFallecido: number;
    fallecidoNombre: string;
    idOcupacion: number;
    fechaSepultura: string;
    estadoVisual: "OCUPADO_SIN_DATOS";
  }) => void;
};

export function OcuparSinDatosModal({ idNicho, nichoLabel, onClose, onDone }: Props) {
  const [fechaInicio, setFechaInicio] = useState(todayDateOnly());
  const [loading, setLoading] = useState(false);

  async function confirmar() {
    if (!fechaInicio.trim()) {
      toast.error("Indique la fecha de sepultura");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/nichos/${idNicho}/ocupar-sin-datos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fechaInicio }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo registrar la ocupación");
        return;
      }
      toast.success(`Nicho ${nichoLabel} marcado como ocupado sin datos`);
      onDone({
        idFallecido: data.idFallecido,
        fallecidoNombre: data.fallecidoNombre,
        idOcupacion: data.idOcupacion,
        fechaSepultura: data.fechaSepultura,
        estadoVisual: "OCUPADO_SIN_DATOS",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[1px]">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-modal)] border border-stone/80 bg-bone p-6 shadow-[var(--shadow-card)]">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-card)] border border-amber/40 bg-[color-mix(in_oklab,#c08532_12%,#f2f1ed)] text-amber">
            <AlertCircle className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          </span>
          <div>
            <h2 className="font-serif text-xl text-ink">Ocupado sin datos</h2>
            <p className="mt-1 text-sm text-driftwood">
              Nicho {nichoLabel} — el nicho está ocupado pero aún no hay datos del
              fallecido. Podrá completarlos más adelante.
            </p>
          </div>
        </div>

        <FechaSepulturaField
          className="mt-6"
          value={fechaInicio}
          onChange={setFechaInicio}
        />

        <div className="mt-6 flex justify-end gap-2 border-t border-stone/60 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" disabled={loading} onClick={confirmar}>
            {loading ? "Guardando…" : "Confirmar ocupación"}
          </Button>
        </div>
      </div>
    </div>
  );
}
