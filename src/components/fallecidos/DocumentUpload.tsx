"use client";

import { useEffect, useState } from "react";
import { toast, useConfirm } from "@/components/ui/FeedbackProvider";

type Doc = {
  ID_DOCUMENTO: number;
  NOMBRE_ARCHIVO: string;
  TIPO_DOCUMENTO: string;
  FECHA_CARGA: string;
  TAMANO: number | string;
  MIME_TYPE: string | null;
  USUARIO_CARGA: string | null;
};

const TIPO_LABEL: Record<string, string> = {
  CERTIFICADO_DEFUNCION: "Certificado de defunción",
  DNI: "DNI",
  AUTORIZACION: "Autorización",
  DOCUMENTACION_NICHO: "Documentación nicho",
  DOCUMENTACION_GARANTE: "Documentación garante",
  COMPROBANTE: "Comprobante",
  OTRO: "Otro",
};

function formatBytes(n: number | string) {
  const b = Number(n);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUpload({
  idFallecido,
  canDelete,
}: {
  idFallecido: number;
  canDelete: boolean;
}) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [tipo, setTipo] = useState("CERTIFICADO_DEFUNCION");
  const [loading, setLoading] = useState(false);
  const confirm = useConfirm();

  async function load() {
    const res = await fetch(`/api/documentos?idFallecido=${idFallecido}`);
    const data = await res.json();
    setDocs(data.rows ?? []);
  }

  useEffect(() => {
    load();
  }, [idFallecido]);

  return (
    <div className="space-y-4">
      <form
        className="rounded-xl border border-dashed border-coop-border bg-coop-surface/50 p-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          fd.set("idFallecido", String(idFallecido));
          setLoading(true);
          const res = await fetch("/api/documentos", { method: "POST", body: fd });
          setLoading(false);
          const data = await res.json().catch(() => ({}));
          if (res.ok) {
            form.reset();
            load();
            toast.success("Documento cargado correctamente");
          } else {
            toast.error(data.error ?? "No se pudo subir el documento");
          }
        }}
      >
        <p className="text-sm font-medium">Subir documento</p>
        <select
          name="tipoDocumento"
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          {Object.entries(TIPO_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input type="file" name="archivo" required className="w-full text-sm" />
        <input
          name="observaciones"
          placeholder="Observación (opcional)"
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-coop-primary px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Subiendo…" : "Cargar"}
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {docs.map((d) => (
          <article
            key={d.ID_DOCUMENTO}
            className="rounded-xl border border-coop-border bg-white p-4 shadow-sm"
          >
            <p className="font-medium text-coop-primary">
              {TIPO_LABEL[d.TIPO_DOCUMENTO] ?? d.TIPO_DOCUMENTO}
            </p>
            <p className="text-sm text-slate-600">{d.NOMBRE_ARCHIVO}</p>
            <p className="mt-2 text-xs text-slate-500">
              {d.MIME_TYPE ?? "Archivo"} · {formatBytes(d.TAMANO)}
            </p>
            <p className="text-xs text-slate-500">
              Cargado el {new Date(d.FECHA_CARGA).toLocaleDateString("es-AR")}
              {d.USUARIO_CARGA ? ` · ${d.USUARIO_CARGA}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`/api/documentos/${d.ID_DOCUMENTO}/download`}
                className="rounded-md bg-coop-surface px-3 py-1 text-xs font-medium hover:bg-slate-200"
                target="_blank"
                rel="noreferrer"
              >
                Descargar
              </a>
              {canDelete ? (
                <button
                  type="button"
                  className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-700"
                  onClick={async () => {
                    const ok = await confirm({
                      title: "¿Eliminar documento?",
                      description:
                        "Esta acción no se puede deshacer. Quedará registrada en auditoría.",
                      confirmText: "Eliminar",
                      variant: "danger",
                    });
                    if (!ok) return;
                    const res = await fetch(`/api/documentos/${d.ID_DOCUMENTO}`, {
                      method: "DELETE",
                    });
                    if (res.ok) {
                      toast.success("Documento eliminado");
                      load();
                    } else {
                      const data = await res.json().catch(() => ({}));
                      toast.error(data.error ?? "No se pudo eliminar");
                    }
                  }}
                >
                  Eliminar
                </button>
              ) : null}
            </div>
          </article>
        ))}
        {docs.length === 0 ? (
          <p className="text-sm text-slate-500 sm:col-span-2">
            No hay documentación cargada para este fallecido.
          </p>
        ) : null}
      </div>
    </div>
  );
}
