"use client";

import Link from "next/link";
import { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";

export type FallecidoFormValues = {
  apellido: string;
  nombre: string;
  dni: string;
  fechaNacimiento: string;
  fechaFallecimiento: string;
  lugarFallecimiento: string;
  personaReferencia: string;
  parentesco: string;
  telefonoReferencia: string;
  emailReferencia: string;
  observaciones: string;
};

function toDateInputValue(value: string | undefined): string {
  if (!value?.trim()) return "";
  const s = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s.slice(0, 10);
}

const empty: FallecidoFormValues = {
  apellido: "",
  nombre: "",
  dni: "",
  fechaNacimiento: "",
  fechaFallecimiento: "",
  lugarFallecimiento: "",
  personaReferencia: "",
  parentesco: "",
  telefonoReferencia: "",
  emailReferencia: "",
  observaciones: "",
};

type Props = {
  initial?: Partial<FallecidoFormValues>;
  onSubmit: (values: FallecidoFormValues) => Promise<void>;
  submitLabel?: string;
  cancelHref?: string;
};

export function FallecidoForm({
  initial,
  onSubmit,
  submitLabel = "Guardar",
  cancelHref,
}: Props) {
  const [values, setValues] = useState<FallecidoFormValues>(() => ({
    ...empty,
    ...initial,
    fechaNacimiento: toDateInputValue(initial?.fechaNacimiento),
    fechaFallecimiento: toDateInputValue(initial?.fechaFallecimiento),
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hoy = new Date().toISOString().slice(0, 10);

  function field(name: keyof FallecidoFormValues, label: string, required?: boolean) {
    return (
      <label className="block text-sm">
        <span className="font-medium text-ash">
          {label}
          {required ? " *" : ""}
        </span>
        <input
          required={required}
          className="ui-input mt-1"
          value={values[name]}
          onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
        />
      </label>
    );
  }

  function dateField(
    name: "fechaNacimiento" | "fechaFallecimiento",
    label: string,
    options?: { max?: string },
  ) {
    return (
      <label className="block text-sm">
        <span className="font-medium text-ash">{label}</span>
        <input
          type="date"
          max={options?.max}
          className="ui-input mt-1"
          value={values[name]}
          onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
        />
      </label>
    );
  }

  return (
    <form
      className="space-y-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
          await onSubmit(values);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error");
        } finally {
          setLoading(false);
        }
      }}
    >
      <div>
        <SectionHeader title="Datos personales" />
        <div className="grid gap-4 sm:grid-cols-2">
          {field("apellido", "Apellido", true)}
          {field("nombre", "Nombre")}
          {field("dni", "DNI")}
          {dateField("fechaNacimiento", "Fecha de nacimiento", { max: hoy })}
        </div>
      </div>

      <div>
        <SectionHeader title="Datos del fallecimiento" />
        <div className="grid gap-4 sm:grid-cols-2">
          {dateField("fechaFallecimiento", "Fecha de fallecimiento", { max: hoy })}
          {field("lugarFallecimiento", "Lugar de fallecimiento")}
        </div>
      </div>

      <div>
        <SectionHeader title="Persona de referencia" />
        <div className="grid gap-4 sm:grid-cols-2">
          {field("personaReferencia", "Nombre")}
          {field("parentesco", "Parentesco")}
          {field("telefonoReferencia", "Teléfono")}
          {field("emailReferencia", "Email")}
        </div>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-ash">Observaciones</span>
        <textarea
          className="ui-input mt-1"
          rows={3}
          value={values.observaciones}
          onChange={(e) => setValues((v) => ({ ...v, observaciones: e.target.value }))}
        />
      </label>

      {error ? <p className="text-sm text-crimson">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        {cancelHref ? (
          <Link
            href={cancelHref}
            className="ui-btn-secondary inline-flex items-center px-5 py-2.5"
          >
            Cancelar
          </Link>
        ) : null}
        <button type="submit" disabled={loading} className="ui-btn-primary disabled:opacity-50">
          {loading ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
