"use client";

import { useCallback, useEffect, useState } from "react";

type Row = Record<string, unknown>;

function parseJsonSafe(s: unknown): Record<string, unknown> | null {
  if (s == null || s === "") return null;
  try {
    return JSON.parse(String(s)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function DiffTable({ before, after }: { before: unknown; after: unknown }) {
  const b = parseJsonSafe(before);
  const a = parseJsonSafe(after);
  if (!b && !a) return <p className="text-sm text-slate-500">Sin detalle JSON</p>;
  const keys = Array.from(new Set([...Object.keys(b ?? {}), ...Object.keys(a ?? {})]));
  return (
    <table className="mt-2 w-full text-xs">
      <thead>
        <tr className="text-left text-slate-500">
          <th className="py-1">Campo</th>
          <th className="py-1">Anterior</th>
          <th className="py-1">Nuevo</th>
        </tr>
      </thead>
      <tbody>
        {keys.map((k) => (
          <tr key={k} className="border-t">
            <td className="py-1 font-medium">{k}</td>
            <td className="py-1">{b?.[k] != null ? String(b[k]) : "—"}</td>
            <td className="py-1">{a?.[k] != null ? String(a[k]) : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function AuditoriaView() {
  const [rows, setRows] = useState<Row[]>([]);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [accion, setAccion] = useState("");
  const [entidad, setEntidad] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (desde) p.set("desde", desde);
    if (hasta) p.set("hasta", hasta);
    if (accion) p.set("accion", accion);
    if (entidad) p.set("entidad", entidad);
    const res = await fetch(`/api/auditoria?${p}`);
    const data = await res.json();
    setRows(data.rows ?? []);
  }, [desde, hasta, accion, entidad]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">
          Desde
          <input
            type="date"
            className="mt-1 w-full rounded-lg border px-2 py-1"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Hasta
          <input
            type="date"
            className="mt-1 w-full rounded-lg border px-2 py-1"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Acción
          <input
            className="mt-1 w-full rounded-lg border px-2 py-1"
            value={accion}
            onChange={(e) => setAccion(e.target.value)}
            placeholder="MODIFICAR, LOGIN…"
          />
        </label>
        <label className="text-sm">
          Entidad
          <input
            className="mt-1 w-full rounded-lg border px-2 py-1"
            value={entidad}
            onChange={(e) => setEntidad(e.target.value)}
            placeholder="FALLECIDOS…"
          />
        </label>
        <button
          type="button"
          onClick={load}
          className="rounded-lg bg-coop-primary px-4 py-2 text-sm text-white sm:col-span-2 lg:col-span-1"
        >
          Filtrar
        </button>
      </div>

      <ul className="divide-y rounded-xl border bg-white shadow-sm">
        {rows.map((r) => {
          const id = Number(r.ID_AUDITORIA);
          const usuario =
            r.USUARIO_NOMBRE && r.USUARIO_APELLIDO
              ? `${r.USUARIO_NOMBRE} ${r.USUARIO_APELLIDO}`
              : String(r.USUARIO_LOGIN ?? "—");
          const fecha = new Date(String(r.FECHA));
          return (
            <li key={id} className="px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {String(r.ACCION)} · {String(r.ENTIDAD)}
                    {r.ID_REGISTRO ? ` #${r.ID_REGISTRO}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {fecha.toLocaleDateString("es-AR")}{" "}
                    {fecha.toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    — {usuario}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-coop-accent underline"
                  onClick={() => setExpanded(expanded === id ? null : id)}
                >
                  {expanded === id ? "Ocultar" : "Ver detalle"}
                </button>
              </div>
              {expanded === id ? (
                <DiffTable before={r.VALOR_ANTERIOR} after={r.VALOR_NUEVO} />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
