"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FallecidoForm, type FallecidoFormValues } from "@/components/fallecidos/FallecidoForm";
import { Button } from "@/components/ui/Button";
import { toast, useConfirm } from "@/components/ui/FeedbackProvider";
import { compareDateOnly, toDateOnlyString } from "@/lib/utils/dates";
import {
  FechaSepulturaField,
  todayDateOnly,
} from "./FechaSepulturaField";

type FallecidoRow = {
  ID_FALLECIDO: number;
  APELLIDO: string;
  NOMBRE: string | null;
  DNI: string | null;
  FECHA_FALLECIMIENTO?: string | Date | null;
};

type Props = {
  idNicho: number;
  nichoLabel: string;
  onClose: () => void;
  onAssigned: (result: {
    idFallecido: number;
    fallecidoNombre: string;
    idOcupacion: number;
    fechaSepultura: string;
    estadoVisual: "OCUPADO";
  }) => void;
};

export function AsignarFallecidoModal({
  idNicho,
  nichoLabel,
  onClose,
  onAssigned,
}: Props) {
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<FallecidoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FallecidoRow | null>(null);
  const [fechaInicio, setFechaInicio] = useState(todayDateOnly());
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"buscar" | "crear">("buscar");

  const fechaFallSelected = selected?.FECHA_FALLECIMIENTO
    ? toDateOnlyString(selected.FECHA_FALLECIMIENTO)
    : null;

  const search = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const params = term.trim() ? `?q=${encodeURIComponent(term.trim())}` : "";
      const res = await fetch(`/api/fallecidos${params}`);
      const data = await res.json();
      setRows((data.rows ?? []) as FallecidoRow[]);
    } catch {
      toast.error("No se pudo buscar fallecidos");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(q), 300);
    return () => clearTimeout(t);
  }, [q, search]);

  async function confirmAssign(row: FallecidoRow, fechaFallCreacion?: string) {
    if (!fechaInicio.trim()) {
      toast.error("Indique la fecha de sepultura");
      return;
    }
    const fall =
      fechaFallCreacion ??
      (row.FECHA_FALLECIMIENTO
        ? toDateOnlyString(row.FECHA_FALLECIMIENTO)
        : null);
    const sep = toDateOnlyString(fechaInicio);
    if (fall && sep && compareDateOnly(sep, fall) < 0) {
      const ok = await confirm({
        title: "¿Confirmar con fechas inconsistentes?",
        description:
          "La fecha de sepultura es anterior a la fecha de fallecimiento. ¿Desea continuar igualmente?",
        confirmText: "Continuar",
        variant: "danger",
      });
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/nichos/${idNicho}/ocupar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idFallecido: row.ID_FALLECIDO,
          fechaInicio,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo asignar el nicho");
        return;
      }
      const nombre = [row.APELLIDO, row.NOMBRE].filter(Boolean).join(", ");
      toast.success(`Nicho ${nichoLabel} asignado con éxito a ${nombre}`);
      onAssigned({
        idFallecido: row.ID_FALLECIDO,
        fallecidoNombre: data.fallecidoNombre ?? nombre,
        idOcupacion: data.idOcupacion,
        fechaSepultura: data.fechaSepultura ?? fechaInicio,
        estadoVisual: "OCUPADO",
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[1px]">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[var(--radius-modal)] border border-stone/80 bg-bone p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-serif text-xl text-ink">
          Asignar fallecido — Nicho {nichoLabel}
        </h2>
        <p className="mt-1 text-sm text-driftwood">
          Busque por DNI, apellido o nombre. Solo fallecidos sin nicho activo pueden
          asignarse.
        </p>

        <FechaSepulturaField
          className="mt-5"
          value={fechaInicio}
          onChange={setFechaInicio}
          fechaFallecimiento={
            mode === "buscar" ? fechaFallSelected : undefined
          }
        />

        <div className="mt-5 flex gap-2 border-b border-stone/60 pb-3">
          <button
            type="button"
            className={`rounded-[var(--radius-card)] border px-3 py-1.5 text-sm ${
              mode === "buscar"
                ? "border-ink bg-ink text-parchment"
                : "border-mist bg-transparent text-ink hover:bg-linen"
            }`}
            onClick={() => setMode("buscar")}
          >
            Buscar existente
          </button>
          <button
            type="button"
            className={`rounded-[var(--radius-card)] border px-3 py-1.5 text-sm ${
              mode === "crear"
                ? "border-ink bg-ink text-parchment"
                : "border-mist bg-transparent text-ink hover:bg-linen"
            }`}
            onClick={() => setMode("crear")}
          >
            Crear nuevo fallecido
          </button>
        </div>

        {mode === "crear" ? (
          <div className="mt-4">
            <FallecidoForm
              submitLabel="Crear y asignar nicho"
              onSubmit={async (values: FallecidoFormValues) => {
                const res = await fetch("/api/fallecidos", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(values),
                });
                const data = await res.json();
                if (!res.ok) {
                  toast.error(data.error ?? "No se pudo crear el fallecido");
                  throw new Error(data.error ?? "Error");
                }
                toast.success("Fallecido registrado correctamente");
                const row: FallecidoRow = {
                  ID_FALLECIDO: data.idFallecido,
                  APELLIDO: values.apellido,
                  NOMBRE: values.nombre || null,
                  DNI: values.dni || null,
                  FECHA_FALLECIMIENTO: values.fechaFallecimiento || null,
                };
                await confirmAssign(
                  row,
                  values.fechaFallecimiento || undefined,
                );
              }}
            />
          </div>
        ) : (
          <>
            <label className="mt-4 block text-sm">
              <span className="font-medium text-ash">Buscar fallecido</span>
              <input
                className="ui-input mt-1"
                placeholder="Apellido, nombre o DNI…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoFocus
              />
            </label>
            <ul className="mt-4 max-h-56 space-y-1 overflow-y-auto rounded-[var(--radius-card)] border border-stone/70 bg-[var(--color-paper)] p-2">
              {loading ? (
                <li className="p-2 text-sm text-driftwood">Buscando…</li>
              ) : rows.length === 0 ? (
                <li className="p-2 text-sm text-driftwood">
                  Sin resultados.{" "}
                  <button
                    type="button"
                    className="font-medium text-forest underline"
                    onClick={() => setMode("crear")}
                  >
                    Crear nuevo fallecido
                  </button>
                </li>
              ) : (
                rows.map((r) => {
                  const label = [r.APELLIDO, r.NOMBRE].filter(Boolean).join(", ");
                  const active = selected?.ID_FALLECIDO === r.ID_FALLECIDO;
                  return (
                    <li key={r.ID_FALLECIDO}>
                      <button
                        type="button"
                        className={`w-full rounded-[var(--radius-card)] px-3 py-2 text-left text-sm transition-colors ${
                          active
                            ? "bg-linen ring-1 ring-ink/20"
                            : "hover:bg-linen/60"
                        }`}
                        onClick={() => setSelected(r)}
                      >
                        <span className="font-medium text-ink">{label}</span>
                        {r.DNI ? (
                          <span className="ml-2 text-driftwood">DNI {r.DNI}</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-stone/60 pt-4">
          <Link
            href="/fallecidos/nuevo"
            className="text-sm text-forest hover:underline"
            onClick={onClose}
          >
            Abrir formulario completo de fallecido
          </Link>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            {mode === "buscar" ? (
              <Button
                type="button"
                variant="primary"
                disabled={!selected || submitting || !fechaInicio.trim()}
                onClick={() => selected && confirmAssign(selected)}
              >
                {submitting ? "Asignando…" : "Confirmar asignación"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
