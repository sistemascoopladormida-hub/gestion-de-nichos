"use client";

import { useState } from "react";
import { FallecidoForm, type FallecidoFormValues } from "./FallecidoForm";
import { toast } from "@/components/ui/FeedbackProvider";
import { DocumentUpload } from "./DocumentUpload";

type Props = {
  idFallecido: number;
  initial: FallecidoFormValues;
  contexto: Record<string, unknown>;
  canEdit: boolean;
  canDeleteDocs: boolean;
  initialTab?: string;
};

const tabs = ["Datos", "Ubicación", "Servicio", "Documentos"] as const;

export function FallecidoTabs({
  idFallecido,
  initial,
  contexto,
  canEdit,
  canDeleteDocs,
  initialTab,
}: Props) {
  const start =
    initialTab === "documentos"
      ? "Documentos"
      : (tabs.find((t) => t.toLowerCase() === initialTab) ?? "Datos");
  const [tab, setTab] = useState<(typeof tabs)[number]>(
    tabs.includes(start as (typeof tabs)[number])
      ? (start as (typeof tabs)[number])
      : "Datos",
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm ${tab === t ? "bg-coop-primary text-white" : "border bg-white"}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Datos" ? (
        canEdit ? (
          <FallecidoForm
            initial={initial}
            onSubmit={async (values) => {
              const res = await fetch(`/api/fallecidos/${idFallecido}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
              });
              const data = await res.json();
              if (!res.ok) {
                toast.error(data.error ?? "No se pudo guardar");
                throw new Error(data.error ?? "Error");
              }
              toast.success("Datos guardados correctamente");
            }}
          />
        ) : (
          <p className="rounded-lg border bg-white p-4 text-sm text-slate-600">
            Solo la administradora puede modificar los datos del fallecido. Puede
            consultar las demás pestañas.
          </p>
        )
      ) : null}
      {tab === "Ubicación" ? (
        <dl className="grid gap-2 rounded-xl border bg-white p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Pabellón</dt>
            <dd>{String(contexto.PABELLON ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Nicho</dt>
            <dd>{contexto.NICHO ? String(contexto.NICHO) : "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Ubicación externa</dt>
            <dd>{String(contexto.UBICACION_EXTERNA ?? "—")}</dd>
          </div>
        </dl>
      ) : null}
      {tab === "Servicio" ? (
        <dl className="grid gap-2 rounded-xl border bg-white p-4 text-sm">
          <div>
            <dt className="text-slate-500">Tipo ocupación</dt>
            <dd>{String(contexto.TIPO_OCUPACION ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Préstamo</dt>
            <dd>
              {contexto.ID_PRESTAMO
                ? `Vence ${String(contexto.FECHA_VENCIMIENTO)} (${String(contexto.PRESTAMO_ESTADO)})`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Garante</dt>
            <dd>{String(contexto.GARANTE_NOMBRE ?? "—")}</dd>
          </div>
        </dl>
      ) : null}
      {tab === "Documentos" ? (
        <DocumentUpload idFallecido={idFallecido} canDelete={canDeleteDocs} />
      ) : null}
    </div>
  );
}
