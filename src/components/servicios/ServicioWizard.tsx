"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { SocioPfc } from "@/lib/pfc/types";
import { PfcSearchPanel } from "@/components/pfc/PfcSearchPanel";
import { FallecidoForm, type FallecidoFormValues } from "@/components/fallecidos/FallecidoForm";
import { NichoMapaWizard } from "./NichoMapaWizard";
import type { NichoMapa } from "@/types/domain";
import { toast } from "@/components/ui/FeedbackProvider";

const ATENDIDOS = ["Alejandra Valdez", "Nahuel Ponce"];

type Step = 1 | 2 | 3 | 4;

export function ServicioWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [esPfc, setEsPfc] = useState<boolean | null>(null);
  const [pfcSnapshot, setPfcSnapshot] = useState<SocioPfc | null>(null);
  const [solicitaNicho, setSolicitaNicho] = useState<boolean | null>(null);
  const [garante, setGarante] = useState<SocioPfc | null>(null);
  const [fallecido, setFallecido] = useState<FallecidoFormValues | null>(null);
  const [ubicacionTipo, setUbicacionTipo] = useState<"PABELLON" | "EXTERNA">("PABELLON");
  const [idNicho, setIdNicho] = useState<number | null>(null);
  const [nichoLabel, setNichoLabel] = useState<string | null>(null);
  const [externa, setExterna] = useState({
    descripcion: "",
    sector: "",
    referencia: "",
    fechaSepultura: "",
  });
  const [tipoServicio, setTipoServicio] = useState("Sepelio");
  const [fechaServicio, setFechaServicio] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [fechaSepultura, setFechaSepultura] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [atendidoPor, setAtendidoPor] = useState(ATENDIDOS[0]);
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fechaVencimientoPrestamo = useMemo(() => {
    if (!fechaSepultura) return "";
    const d = new Date(fechaSepultura + "T12:00:00");
    d.setMonth(d.getMonth() + 6);
    return d.toLocaleDateString("es-AR");
  }, [fechaSepultura]);

  async function finalizar() {
    if (!fallecido) return;
    setLoading(true);
    setError(null);
    try {
      const body = {
        fallecido,
        esPfc: Boolean(esPfc),
        pfcSnapshot: esPfc ? pfcSnapshot : null,
        tipoServicio,
        fechaServicio,
        fechaSepultura:
          ubicacionTipo === "PABELLON" || esPfc || solicitaNicho
            ? fechaSepultura
            : externa.fechaSepultura || fechaSepultura,
        atendidoPor,
        observaciones,
        ubicacion:
          ubicacionTipo === "PABELLON"
            ? { tipo: "PABELLON" as const, idNicho: idNicho! }
            : {
                tipo: "EXTERNA" as const,
                externa: {
                  ...externa,
                  fechaSepultura: externa.fechaSepultura || fechaServicio,
                },
              },
        prestamo:
          !esPfc && solicitaNicho && garante
            ? { garante }
            : undefined,
      };
      const res = await fetch("/api/servicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "No se pudo registrar";
        toast.error(msg);
        throw new Error(msg);
      }
      toast.success("Servicio registrado correctamente");
      router.push(`/fallecidos/${data.idFallecido}?servicio=ok`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2 text-xs text-slate-500">
        {["PFC", "Datos", "Ubicación", "Confirmar"].map((t, i) => (
          <li
            key={t}
            className={`rounded-full px-3 py-1 ${step === i + 1 ? "bg-coop-primary text-white" : "bg-white border border-coop-border"}`}
          >
            {i + 1}. {t}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <div className="space-y-4 rounded-xl border border-coop-border bg-white p-6 shadow-sm">
          <p className="text-lg font-medium">¿El fallecido es socio PFC?</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={`rounded-lg px-6 py-3 text-sm font-medium ${esPfc === true ? "bg-coop-primary text-white" : "border border-coop-border"}`}
              onClick={() => {
                setEsPfc(true);
                setSolicitaNicho(null);
              }}
            >
              Sí
            </button>
            <button
              type="button"
              className={`rounded-lg px-6 py-3 text-sm font-medium ${esPfc === false ? "bg-coop-primary text-white" : "border border-coop-border"}`}
              onClick={() => {
                setEsPfc(false);
                setPfcSnapshot(null);
              }}
            >
              No
            </button>
          </div>
          {esPfc ? (
            <PfcSearchPanel
              onSelect={(s) => {
                if (!s.servicioActivo) {
                  setError("El socio seleccionado no tiene PFC activo");
                  return;
                }
                setPfcSnapshot(s);
                setError(null);
              }}
            />
          ) : null}
          {esPfc && pfcSnapshot ? (
            <p className="text-sm text-green-700">
              Seleccionado: {pfcSnapshot.apellidos} (snapshot guardado al registrar)
            </p>
          ) : null}
          {!esPfc && esPfc !== null ? (
            <div className="mt-4 space-y-2">
              <p>¿Solicita nicho de la Cooperativa?</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className={`rounded-lg px-4 py-2 text-sm ${solicitaNicho === true ? "bg-coop-primary text-white" : "border"}`}
                  onClick={() => setSolicitaNicho(true)}
                >
                  Sí
                </button>
                <button
                  type="button"
                  className={`rounded-lg px-4 py-2 text-sm ${solicitaNicho === false ? "bg-coop-primary text-white" : "border"}`}
                  onClick={() => setSolicitaNicho(false)}
                >
                  No / ubicación externa
                </button>
              </div>
              {solicitaNicho ? (
                <PfcSearchPanel
                  label="Buscar garante PFC"
                  onSelect={(s) => {
                    if (!s.servicioActivo) {
                      setError("El garante debe tener PFC activo");
                      return;
                    }
                    setGarante(s);
                    setError(null);
                  }}
                />
              ) : null}
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="button"
            className="rounded-lg bg-coop-primary px-5 py-2 text-sm text-white"
            onClick={() => {
              if (esPfc === null) return;
              if (esPfc && !pfcSnapshot) {
                setError("Seleccione un socio PFC");
                return;
              }
              if (!esPfc && solicitaNicho === null) {
                setError("Indique si solicita nicho");
                return;
              }
              if (!esPfc && solicitaNicho && !garante) {
                setError("Seleccione garante PFC");
                return;
              }
              if (!esPfc && !solicitaNicho) setUbicacionTipo("EXTERNA");
              if (!esPfc && solicitaNicho) setUbicacionTipo("PABELLON");
              setStep(2);
            }}
          >
            Continuar
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="rounded-xl border border-coop-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium">Datos del fallecido</h2>
          <FallecidoForm
            submitLabel="Continuar"
            onSubmit={async (v) => {
              setFallecido(v);
              setStep(3);
            }}
          />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4 rounded-xl border border-coop-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium">Ubicación y servicio</h2>
          {esPfc || solicitaNicho ? (
            <NichoMapaWizard
              selectedId={idNicho}
              onSelect={(n: NichoMapa, pab) => {
                setIdNicho(n.idNicho);
                setNichoLabel(`${pab.nombre} — Nicho ${n.numero}`);
              }}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">
                Descripción del lugar *
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={externa.descripcion}
                  onChange={(e) => setExterna((x) => ({ ...x, descripcion: e.target.value }))}
                />
              </label>
              <label className="text-sm">
                Sector
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={externa.sector}
                  onChange={(e) => setExterna((x) => ({ ...x, sector: e.target.value }))}
                />
              </label>
              <label className="text-sm">
                Referencia
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  value={externa.referencia}
                  onChange={(e) => setExterna((x) => ({ ...x, referencia: e.target.value }))}
                />
              </label>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Tipo de servicio
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={tipoServicio}
                onChange={(e) => setTipoServicio(e.target.value)}
              />
            </label>
            <label className="text-sm">
              Fecha del servicio
              <input
                type="date"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={fechaServicio}
                onChange={(e) => setFechaServicio(e.target.value)}
              />
            </label>
            <label className="text-sm">
              Fecha de sepultura
              <input
                type="date"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={fechaSepultura}
                onChange={(e) => setFechaSepultura(e.target.value)}
              />
              <span className="mt-1 block text-xs text-slate-500">
                Fecha en la que el fallecido fue sepultado. Se utiliza para calcular el
                préstamo de 6 meses y el período de 10 años.
              </span>
            </label>
            <label className="text-sm">
              Atendido por
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={atendidoPor}
                onChange={(e) => setAtendidoPor(e.target.value)}
              >
                {ATENDIDOS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {!esPfc && solicitaNicho ? (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              Vencimiento del préstamo (6 meses): <strong>{fechaVencimientoPrestamo}</strong>{" "}
              — calculado automáticamente desde la fecha de sepultura.
            </p>
          ) : null}
          <textarea
            placeholder="Observaciones"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setStep(2)}>
              Atrás
            </button>
            <button
              type="button"
              className="rounded-lg bg-coop-primary px-4 py-2 text-sm text-white"
              onClick={() => {
                if ((esPfc || solicitaNicho) && !idNicho) {
                  setError("Indique el nicho");
                  return;
                }
                setError(null);
                setStep(4);
              }}
            >
              Continuar
            </button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4 rounded-xl border border-coop-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium">Confirmar registro</h2>
          <p className="text-sm text-slate-600">
            Revise los datos antes de registrar el servicio.
          </p>
          <dl className="grid gap-2 rounded-lg border bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Fallecido</dt>
              <dd className="font-medium">
                {fallecido
                  ? `${fallecido.apellido}${fallecido.nombre ? `, ${fallecido.nombre}` : ""}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Fecha de fallecimiento</dt>
              <dd>
                {fallecido?.fechaFallecimiento
                  ? new Date(fallecido.fechaFallecimiento + "T12:00:00").toLocaleDateString(
                      "es-AR",
                    )
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Fecha de sepultura</dt>
              <dd>
                {new Date(fechaSepultura + "T12:00:00").toLocaleDateString("es-AR")}
              </dd>
            </div>
            {nichoLabel ? (
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Ubicación</dt>
                <dd className="font-medium">{nichoLabel}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-slate-500">Tipo</dt>
              <dd>{esPfc ? "PFC" : solicitaNicho ? "Préstamo" : "Ubicación externa"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Atendido por</dt>
              <dd>{atendidoPor}</dd>
            </div>
          </dl>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setStep(3)}>
              Atrás
            </button>
            <button
              type="button"
              disabled={loading}
              className="rounded-lg bg-coop-primary px-6 py-2 text-sm text-white disabled:opacity-50"
              onClick={finalizar}
            >
              {loading ? "Registrando…" : "Registrar servicio"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
