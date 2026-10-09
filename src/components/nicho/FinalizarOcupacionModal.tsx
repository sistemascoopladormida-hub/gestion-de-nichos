"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/ui/FeedbackProvider";
import { MOTIVOS_FINALIZACION } from "@/lib/ocupaciones/motivos";

type Props = {
  idOcupacion: number;
  fallecido: string;
  nichoLabel: string;
  fechaSepultura: string;
  onClose: () => void;
  onFinalized?: () => void;
};

export function FinalizarOcupacionModal({
  idOcupacion,
  fallecido,
  nichoLabel,
  fechaSepultura,
  onClose,
  onFinalized,
}: Props) {
  const router = useRouter();
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().slice(0, 10));
  const [codigoMotivo, setCodigoMotivo] = useState("TRASLADO");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-coop-primary">Finalizar ocupación</h2>
        <p className="mt-2 text-sm text-amber-900 bg-amber-50 rounded-lg p-3">
          Esta acción finalizará la ocupación actual y liberará el nicho. El historial se
          conservará.
        </p>
        <dl className="mt-4 space-y-1 text-sm">
          <div>
            <dt className="text-slate-500">Fallecido</dt>
            <dd className="font-medium">{fallecido}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Nicho</dt>
            <dd>{nichoLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Fecha de sepultura</dt>
            <dd>{fechaSepultura}</dd>
          </div>
        </dl>
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            Fecha de finalización
            <input
              type="date"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Motivo
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={codigoMotivo}
              onChange={(e) => setCodigoMotivo(e.target.value)}
            >
              {MOTIVOS_FINALIZACION.map((m) => (
                <option key={m.codigo} value={m.codigo}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Observaciones (opcional)
            <textarea
              className="mt-1 w-full rounded-lg border px-3 py-2"
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </label>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            className="rounded-lg bg-coop-primary px-4 py-2 text-sm text-white disabled:opacity-50"
            onClick={async () => {
              setLoading(true);
              setError(null);
              const res = await fetch(`/api/ocupaciones/${idOcupacion}/finalizar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fechaFin, codigoMotivo, observaciones }),
              });
              const data = await res.json();
              setLoading(false);
              if (!res.ok) {
                const msg = data.error ?? "No se pudo finalizar";
                setError(msg);
                toast.error(msg);
                return;
              }
              toast.success("Ocupación finalizada. El nicho quedó disponible.");
              router.refresh();
              onFinalized?.();
              onClose();
            }}
          >
            {loading ? "Procesando…" : "Confirmar finalización"}
          </button>
        </div>
      </div>
    </div>
  );
}
