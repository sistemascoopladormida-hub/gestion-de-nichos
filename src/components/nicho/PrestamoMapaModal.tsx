"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FallecidoForm, type FallecidoFormValues } from "@/components/fallecidos/FallecidoForm";
import { Button } from "@/components/ui/Button";
import { toast, useConfirm } from "@/components/ui/FeedbackProvider";
import { addMonthsFromDateStr, compareDateOnly, toDateOnlyString } from "@/lib/utils/dates";
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
  onDone: (result: {
    idFallecido: number;
    fallecidoNombre: string;
    idOcupacion: number;
    idPrestamo: number;
    fechaSepultura: string;
    fechaVencimientoPrestamo: string;
    garanteNombre: string;
    estadoVisual: "PRESTAMO";
  }) => void;
};

export function PrestamoMapaModal({ idNicho, nichoLabel, onClose, onDone }: Props) {
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<FallecidoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FallecidoRow | null>(null);
  const [fechaInicio, setFechaInicio] = useState(todayDateOnly());
  const [fechaVenc, setFechaVenc] = useState("");
  const [garanteNombre, setGaranteNombre] = useState("");
  const [garanteDni, setGaranteDni] = useState("");
  const [obs, setObs] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"buscar" | "crear">("buscar");

  const vencDefault = useMemo(() => {
    if (!fechaInicio.trim()) return "";
    return toDateOnlyString(addMonthsFromDateStr(fechaInicio, 6)) ?? "";
  }, [fechaInicio]);

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

  async function confirmPrestamo(row: FallecidoRow, fechaFallCreacion?: string) {
    if (!fechaInicio.trim()) {
      toast.error("Indique la fecha de sepultura / inicio");
      return;
    }
    if (!garanteNombre.trim()) {
      toast.error("Indique el garante responsable");
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
          "La fecha de sepultura es anterior a la de fallecimiento. ¿Continuar?",
        confirmText: "Continuar",
        variant: "danger",
      });
      if (!ok) return;
    }

    const venc = fechaVenc.trim() || vencDefault;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/nichos/${idNicho}/prestamo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idFallecido: row.ID_FALLECIDO,
          fechaInicio,
          fechaVencimiento: venc || undefined,
          garanteNombre: garanteNombre.trim(),
          garanteDni: garanteDni.trim() || undefined,
          observaciones: obs.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo registrar el préstamo");
        return;
      }
      toast.success(`Préstamo registrado — nicho ${nichoLabel}`);
      onDone({
        idFallecido: row.ID_FALLECIDO,
        fallecidoNombre: data.fallecidoNombre,
        idOcupacion: data.idOcupacion,
        idPrestamo: data.idPrestamo,
        fechaSepultura: data.fechaSepultura,
        fechaVencimientoPrestamo: data.fechaVencimiento,
        garanteNombre: data.garanteNombre,
        estadoVisual: "PRESTAMO",
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
          Registrar préstamo — Nicho {nichoLabel}
        </h2>
        <p className="mt-1 text-sm text-driftwood">
          Ocupación temporal con garante responsable. Por defecto vence a 6 meses desde
          la sepultura.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-ash">Garante / responsable *</span>
            <input
              className="ui-input mt-1"
              value={garanteNombre}
              onChange={(e) => setGaranteNombre(e.target.value)}
              placeholder="Apellido y nombre"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ash">DNI del garante</span>
            <input
              className="ui-input mt-1"
              value={garanteDni}
              onChange={(e) => setGaranteDni(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ash">Vencimiento del préstamo</span>
            <input
              type="date"
              className="ui-input mt-1"
              value={fechaVenc || vencDefault}
              onChange={(e) => setFechaVenc(e.target.value)}
            />
          </label>
        </div>

        <FechaSepulturaField
          className="mt-4"
          value={fechaInicio}
          onChange={setFechaInicio}
          fechaFallecimiento={mode === "buscar" ? fechaFallSelected : undefined}
        />

        <label className="mt-4 block text-sm">
          <span className="font-medium text-ash">Observaciones</span>
          <textarea
            className="ui-input mt-1 min-h-[72px] resize-y"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
        </label>

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
            Buscar fallecido
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
            Crear fallecido
          </button>
        </div>

        {mode === "crear" ? (
          <div className="mt-4">
            <FallecidoForm
              submitLabel="Crear y registrar préstamo"
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
                const row: FallecidoRow = {
                  ID_FALLECIDO: data.idFallecido,
                  APELLIDO: values.apellido,
                  NOMBRE: values.nombre || null,
                  DNI: values.dni || null,
                  FECHA_FALLECIMIENTO: values.fechaFallecimiento || null,
                };
                await confirmPrestamo(row, values.fechaFallecimiento || undefined);
              }}
            />
          </div>
        ) : (
          <>
            <label className="mt-4 block text-sm">
              <span className="font-medium text-ash">Beneficiario del préstamo</span>
              <input
                className="ui-input mt-1"
                placeholder="Apellido, nombre o DNI…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-[var(--radius-card)] border border-stone/70 bg-[var(--color-paper)] p-2">
              {loading ? (
                <li className="p-2 text-sm text-driftwood">Buscando…</li>
              ) : rows.length === 0 ? (
                <li className="p-2 text-sm text-driftwood">Sin resultados.</li>
              ) : (
                rows.map((r) => {
                  const label = [r.APELLIDO, r.NOMBRE].filter(Boolean).join(", ");
                  const active = selected?.ID_FALLECIDO === r.ID_FALLECIDO;
                  return (
                    <li key={r.ID_FALLECIDO}>
                      <button
                        type="button"
                        className={`w-full rounded-[var(--radius-card)] px-3 py-2 text-left text-sm ${
                          active ? "bg-linen ring-1 ring-ink/20" : "hover:bg-linen/60"
                        }`}
                        onClick={() => setSelected(r)}
                      >
                        <span className="font-medium text-ink">{label}</span>
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
            href="/prestamos"
            className="text-sm text-forest hover:underline"
            onClick={onClose}
          >
            Ver listado de préstamos
          </Link>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            {mode === "buscar" ? (
              <Button
                type="button"
                disabled={!selected || submitting || !garanteNombre.trim()}
                onClick={() => selected && confirmPrestamo(selected)}
              >
                {submitting ? "Registrando…" : "Confirmar préstamo"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
