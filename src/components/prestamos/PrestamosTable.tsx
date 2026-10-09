"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/ui/FeedbackProvider";

type Row = Record<string, unknown>;

export function PrestamosTable({
  rows,
  canResolve,
}: {
  rows: Row[];
  canResolve: boolean;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<Row | null>(null);
  const [estado, setEstado] = useState<"RESUELTO" | "TRASLADADO" | "CONVERTIDO_EN_ARANCEL">(
    "RESUELTO",
  );
  const [resolucion, setResolucion] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-coop-surface text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Fallecido</th>
              <th className="px-3 py-2">Nicho</th>
              <th className="px-3 py-2">Vencimiento</th>
              <th className="px-3 py-2">Garante</th>
              <th className="px-3 py-2">Alerta</th>
              {canResolve ? <th className="px-3 py-2">Acción</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.ID_PRESTAMO)} className="border-t">
                <td className="px-3 py-2">{String(r.FALLECIDO)}</td>
                <td className="px-3 py-2">
                  {String(r.PABELLON)} — Nicho {String(r.NICHO)}
                </td>
                <td className="px-3 py-2">
                  {String(r.FECHA_VENCIMIENTO).slice(0, 10)}
                </td>
                <td className="px-3 py-2">{String(r.GARANTE)}</td>
                <td className="px-3 py-2">
                  {r.ALERTA === "VENCIDO" ? (
                    <span className="font-medium text-red-700">PRÉSTAMO VENCIDO</span>
                  ) : r.ALERTA === "PROXIMO" ? (
                    <span className="text-amber-700">Por vencer</span>
                  ) : (
                    "Activo"
                  )}
                </td>
                {canResolve ? (
                  <td className="px-3 py-2">
                    {!["RESUELTO", "TRASLADADO", "CONVERTIDO_EN_ARANCEL"].includes(
                      String(r.ESTADO),
                    ) ? (
                      <button
                        type="button"
                        className="text-xs text-coop-accent underline"
                        onClick={() => {
                          setModal(r);
                          setEstado("RESUELTO");
                          setResolucion("");
                          setError(null);
                        }}
                      >
                        Registrar resolución
                      </button>
                    ) : (
                      <span className="text-slate-500">{String(r.ESTADO)}</span>
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && canResolve ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="font-semibold text-coop-primary">Resolución del préstamo</h3>
            <p className="mt-1 text-sm text-slate-600">{String(modal.FALLECIDO)}</p>
            {estado === "TRASLADADO" ? (
              <p className="mt-2 text-sm text-amber-800 bg-amber-50 p-2 rounded">
                Traslado: se finalizará la ocupación y el nicho quedará disponible.
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                El nicho <strong>no</strong> se libera automáticamente (incluye vencimiento sin
                traslado).
              </p>
            )}
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                Conclusión
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={estado}
                  onChange={(e) =>
                    setEstado(e.target.value as typeof estado)
                  }
                >
                  <option value="RESUELTO">Resuelto (sin liberar nicho)</option>
                  <option value="TRASLADADO">Traslado (libera nicho)</option>
                  <option value="CONVERTIDO_EN_ARANCEL">
                    Convertido en arancel (administrativo, sin facturación)
                  </option>
                </select>
              </label>
              <label className="block text-sm">
                Fecha
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Descripción
                <textarea
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  rows={3}
                  value={resolucion}
                  onChange={(e) => setResolucion(e.target.value)}
                />
              </label>
            </div>
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border px-3 py-1.5 text-sm"
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading || !resolucion.trim()}
                className="rounded-lg bg-coop-primary px-3 py-1.5 text-sm text-white disabled:opacity-50"
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  const res = await fetch("/api/prestamos", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      idPrestamo: Number(modal.ID_PRESTAMO),
                      resolucion,
                      estado,
                      fechaResolucion: fecha,
                    }),
                  });
                  const data = await res.json();
                  setLoading(false);
                  if (!res.ok) {
                    const msg = data.error ?? "Error";
                    setError(msg);
                    toast.error(msg);
                    return;
                  }
                  toast.success("Resolución registrada correctamente");
                  setModal(null);
                  router.refresh();
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
