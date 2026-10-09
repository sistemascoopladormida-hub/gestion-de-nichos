"use client";

import { useState } from "react";

type ReportKey =
  | "ocupacion-pabellon"
  | "fallecidos"
  | "prestamos"
  | "diez-anios"
  | "documentacion";

export function ReportesView({ canExport }: { canExport: boolean }) {
  const [active, setActive] = useState<ReportKey>("ocupacion-pabellon");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroPrestamo, setFiltroPrestamo] = useState("");
  const [modoDiez, setModoDiez] = useState("todos");
  const [docCon, setDocCon] = useState("");

  async function load() {
    setLoading(true);
    const p = new URLSearchParams();
    if (active === "prestamos" && filtroPrestamo) p.set("filtro", filtroPrestamo);
    if (active === "diez-anios") p.set("modo", modoDiez);
    if (active === "documentacion" && docCon) p.set("con", docCon);
    const res = await fetch(`/api/reportes/${active}?${p}`);
    const data = await res.json();
    setRows(data.rows ?? []);
    setLoading(false);
  }

  function exportCsv() {
    window.location.href = `/api/reportes/${active}?format=csv${
      active === "prestamos" && filtroPrestamo ? `&filtro=${filtroPrestamo}` : ""
    }${active === "diez-anios" ? `&modo=${modoDiez}` : ""}${
      active === "documentacion" && docCon ? `&con=${docCon}` : ""
    }`;
  }

  const reports: { key: ReportKey; label: string }[] = [
    { key: "ocupacion-pabellon", label: "Ocupación por pabellón" },
    { key: "fallecidos", label: "Fallecidos" },
    { key: "prestamos", label: "Préstamos" },
    { key: "diez-anios", label: "10 años" },
    { key: "documentacion", label: "Documentación" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {reports.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setActive(r.key)}
            className={`rounded-lg px-3 py-2 text-sm ${active === r.key ? "bg-coop-primary text-white" : "border bg-white"}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {active === "prestamos" ? (
        <select
          className="rounded-lg border px-3 py-2 text-sm"
          value={filtroPrestamo}
          onChange={(e) => setFiltroPrestamo(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="activos">Activos</option>
          <option value="vencidos">Vencidos</option>
          <option value="proximos">Próximos</option>
          <option value="resueltos">Resueltos</option>
        </select>
      ) : null}
      {active === "diez-anios" ? (
        <select
          className="rounded-lg border px-3 py-2 text-sm"
          value={modoDiez}
          onChange={(e) => setModoDiez(e.target.value)}
        >
          <option value="todos">Todos (activos)</option>
          <option value="cumplidos">Ya cumplieron 10 años</option>
          <option value="proximos">Próximos a cumplir</option>
        </select>
      ) : null}
      {active === "documentacion" ? (
        <select
          className="rounded-lg border px-3 py-2 text-sm"
          value={docCon}
          onChange={(e) => setDocCon(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="si">Con documentación</option>
          <option value="no">Sin documentación</option>
        </select>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-coop-accent px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Cargando…" : "Generar reporte"}
        </button>
        {canExport ? (
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Exportar CSV
          </button>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-xs">
            <thead className="bg-coop-surface">
              <tr>
                {Object.keys(rows[0]).map((h) => (
                  <th key={h} className="px-2 py-2 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t">
                  {Object.keys(rows[0]).map((h) => (
                    <td key={h} className="px-2 py-1">
                      {row[h] != null ? String(row[h]) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
