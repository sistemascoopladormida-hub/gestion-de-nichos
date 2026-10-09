"use client";

import { useState } from "react";
import { toast, useConfirm } from "@/components/ui/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils/format";

type Props = {
  fechaActual: string;
  idOcupacion?: number | null;
  idUbicacionExterna?: number | null;
  onSuccess: () => void;
  onClose: () => void;
};

export function EditarSepulturaModal({
  fechaActual,
  idOcupacion,
  idUbicacionExterna,
  onSuccess,
  onClose,
}: Props) {
  const confirm = useConfirm();
  const [fecha, setFecha] = useState(fechaActual.slice(0, 10));
  const [loading, setLoading] = useState(false);

  async function guardar() {
    if (fecha === fechaActual.slice(0, 10)) {
      onClose();
      return;
    }
    const ok = await confirm({
      title: "¿Modificar fecha de sepultura?",
      description: `Esta fecha se utiliza para calcular el vencimiento del préstamo y el cumplimiento de los 10 años.\n\nFecha actual: ${formatDate(fechaActual)}\nNueva fecha: ${formatDate(fecha)}`,
      confirmText: "Confirmar cambio",
    });
    if (!ok) return;

    setLoading(true);
    try {
      const url = idOcupacion
        ? `/api/ocupaciones/${idOcupacion}/fecha-sepultura`
        : idUbicacionExterna
          ? `/api/ubicaciones-externas/${idUbicacionExterna}/fecha-sepultura`
          : null;
      if (!url) {
        toast.error("No hay sepultura registrada para modificar");
        return;
      }
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fechaSepultura: fecha }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo actualizar");
        return;
      }
      toast.success("Fecha de sepultura actualizada");
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-sepultura-title"
    >
      <div className="ui-surface w-full max-w-md p-6">
        <h2 id="edit-sepultura-title" className="text-lg font-semibold text-ink">
          Editar fecha de sepultura
        </h2>
        <p className="mt-2 text-sm text-driftwood">
          Fecha en la que el fallecido fue sepultado. Se utiliza para calcular el préstamo
          de 6 meses y el período de 10 años.
        </p>
        <label className="mt-4 block text-sm">
          <span className="font-medium text-ash">Fecha de sepultura</span>
          <input
            type="date"
            className="ui-input mt-1"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" disabled={loading} onClick={guardar}>
            {loading ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
