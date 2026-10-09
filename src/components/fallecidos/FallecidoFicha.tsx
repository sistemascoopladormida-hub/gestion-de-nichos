"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DocumentUpload } from "./DocumentUpload";
import { EditarSepulturaModal } from "./EditarSepulturaModal";
import { FallecidoActionsMenu } from "./FallecidoActionsMenu";
import { toast } from "@/components/ui/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatDate, nombreCompleto } from "@/lib/utils/format";
import { toDateOnlyString } from "@/lib/utils/dates";

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-ash">{label}</dt>
      <dd className="mt-0.5 text-base text-ink">{value || "—"}</dd>
    </div>
  );
}

type Props = {
  idFallecido: number;
  contexto: Record<string, unknown>;
  historial: Record<string, unknown>[];
  canEdit: boolean;
  canEditSepultura: boolean;
  canEditServicio: boolean;
  canArchive: boolean;
  canRestore: boolean;
  canDeleteDocs: boolean;
};

export function FallecidoFicha({
  idFallecido,
  contexto,
  historial,
  canEdit,
  canEditSepultura,
  canEditServicio,
  canArchive,
  canRestore,
  canDeleteDocs,
}: Props) {
  const router = useRouter();
  const [editSepultura, setEditSepultura] = useState(false);
  const [editServicio, setEditServicio] = useState(false);

  const archivado = Number(contexto.ACTIVO) === 0;
  const datosIncompletos = Number(contexto.DATOS_INCOMPLETOS) === 1;
  const nombre = nombreCompleto(String(contexto.APELLIDO), contexto.NOMBRE as string);
  const idOcupacion = contexto.ID_OCUPACION ? Number(contexto.ID_OCUPACION) : null;
  const idNicho = contexto.ID_NICHO ? Number(contexto.ID_NICHO) : null;
  const idUbicExt = contexto.ID_UBICACION_EXTERNA
    ? Number(contexto.ID_UBICACION_EXTERNA)
    : null;
  const fechaSepultura = idOcupacion
    ? contexto.FECHA_SEPULTURA
    : idUbicExt
      ? contexto.FECHA_SEPULTURA_EXTERNA
      : null;

  let estado = "Registrado";
  if (archivado) estado = "Archivado";
  else if (idOcupacion) estado = "Sepultada";
  else if (idUbicExt) estado = "Sepultada (ubicación externa)";
  else if (contexto.FECHA_FALLECIMIENTO) estado = "Fallecido registrado";

  const idServicio = contexto.ID_SERVICIO ? Number(contexto.ID_SERVICIO) : null;

  async function guardarServicio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!idServicio) return;
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/servicios/${idServicio}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipoServicio: fd.get("tipoServicio"),
        fechaServicio: fd.get("fechaServicio"),
        atendidoPor: fd.get("atendidoPor"),
        observaciones: fd.get("observaciones"),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Error");
      return;
    }
    toast.success("Datos del servicio actualizados");
    setEditServicio(false);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <header className="ui-surface flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{nombre}</h1>
          <p className="mt-1 text-sm text-driftwood">
            DNI {String(contexto.DNI ?? "—")}
          </p>
          <p className="mt-2 text-sm">
            <span className="text-ash">Estado: </span>
            <span className="font-medium text-ink">{estado}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && !archivado ? (
            <Button href={`/fallecidos/${idFallecido}/editar`} variant="primary">
              Editar fallecido
            </Button>
          ) : null}
          <FallecidoActionsMenu
            idFallecido={idFallecido}
            nombre={nombre}
            archivado={archivado}
            canArchive={canArchive}
            canRestore={canRestore}
          />
        </div>
      </header>

      {archivado ? (
        <p className="rounded-lg border border-amber/40 bg-[color-mix(in_oklab,#c08532_8%,#f2f1ed)] px-4 py-3 text-sm text-ink">
          Este fallecido está archivado y no aparece en listados habituales.
        </p>
      ) : null}
      {datosIncompletos && !archivado ? (
        <p className="rounded-lg border border-dashed border-ash/60 bg-[var(--color-paper)] px-4 py-3 text-sm text-ink">
          Este nicho está ocupado pero faltan datos del fallecido. Complete la
          identificación en{" "}
          <Link href={`/fallecidos/${idFallecido}/editar`} className="font-medium text-forest underline">
            Editar fallecido
          </Link>
          .
        </p>
      ) : null}

      <section className="ui-surface p-6">
        <SectionHeader title="Datos personales" />
        <dl className="grid gap-4 sm:grid-cols-2">
          <InfoBlock label="Nombre" value={String(contexto.NOMBRE ?? "—")} />
          <InfoBlock label="Apellido" value={String(contexto.APELLIDO)} />
          <InfoBlock label="DNI" value={String(contexto.DNI ?? "—")} />
          <InfoBlock
            label="Fecha de nacimiento"
            value={formatDate(contexto.FECHA_NACIMIENTO)}
          />
        </dl>
      </section>

      <section className="ui-surface p-6">
        <SectionHeader title="Fallecimiento" />
        <dl className="grid gap-4 sm:grid-cols-2">
          <InfoBlock
            label="Fecha de fallecimiento"
            value={formatDate(contexto.FECHA_FALLECIMIENTO)}
          />
          <InfoBlock
            label="Lugar de fallecimiento"
            value={String(contexto.LUGAR_FALLECIMIENTO ?? "—")}
          />
          <InfoBlock
            label="Persona de referencia"
            value={String(contexto.PERSONA_REFERENCIA ?? "—")}
          />
          <InfoBlock label="Parentesco" value={String(contexto.PARENTESCO ?? "—")} />
          <InfoBlock
            label="Teléfono"
            value={String(contexto.TELEFONO_REFERENCIA ?? "—")}
          />
          <InfoBlock label="Email" value={String(contexto.EMAIL_REFERENCIA ?? "—")} />
          {contexto.OBSERVACIONES ? (
            <div className="sm:col-span-2">
              <InfoBlock label="Observaciones" value={String(contexto.OBSERVACIONES)} />
            </div>
          ) : null}
        </dl>
      </section>

      <section className="ui-surface border-l-4 border-l-forest p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <SectionHeader title="Sepultura" className="mb-0" />
          {canEditSepultura && (idOcupacion || idUbicExt) && !archivado ? (
            <Button type="button" variant="secondary" onClick={() => setEditSepultura(true)}>
              Editar fecha
            </Button>
          ) : null}
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <InfoBlock
            label="Fecha de sepultura"
            value={formatDate(fechaSepultura)}
          />
          {idOcupacion ? (
            <>
              <InfoBlock
                label="Ubicación"
                value={
                  contexto.PABELLON && contexto.NICHO
                    ? `${contexto.PABELLON} · Nicho ${contexto.NICHO}`
                    : "—"
                }
              />
              <InfoBlock
                label="10 años (cumplimiento)"
                value={formatDate(contexto.FECHA_CUMPLIMIENTO_10_ANIOS)}
              />
              <InfoBlock
                label="Estado de ocupación"
                value={String(contexto.OCUPACION_ESTADO ?? "—")}
              />
            </>
          ) : idUbicExt ? (
            <InfoBlock
              label="Ubicación externa"
              value={String(contexto.UBICACION_EXTERNA ?? "—")}
            />
          ) : (
            <p className="sm:col-span-2 text-sm text-driftwood">
              Aún no hay sepultura registrada en un nicho de la Cooperativa ni ubicación
              externa. Puede registrar un{" "}
              <Link href="/servicios/nuevo" className="font-medium text-forest hover:underline">
                nuevo servicio
              </Link>
              .
            </p>
          )}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          {idNicho ? (
            <Button href={`/cementerio/nicho/${idNicho}`} variant="secondary">
              Ver nicho
            </Button>
          ) : null}
          {contexto.ID_PRESTAMO ? (
            <Button
              href={`/prestamos?id=${contexto.ID_PRESTAMO}`}
              variant="secondary"
            >
              Ver préstamo
            </Button>
          ) : null}
        </div>
      </section>

      {idServicio ? (
        <section className="ui-surface p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <SectionHeader title="Servicio" className="mb-0" />
            {canEditServicio && !archivado ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditServicio((v) => !v)}
              >
                {editServicio ? "Cancelar" : "Editar servicio"}
              </Button>
            ) : null}
          </div>
          {editServicio ? (
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={guardarServicio}>
              <label className="text-sm">
                Tipo
                <input
                  name="tipoServicio"
                  className="ui-input mt-1"
                  defaultValue={String(contexto.TIPO_SERVICIO ?? "")}
                />
              </label>
              <label className="text-sm">
                Fecha del servicio
                <input
                  type="date"
                  name="fechaServicio"
                  className="ui-input mt-1"
                  defaultValue={String(contexto.FECHA_SERVICIO).slice(0, 10)}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                Atendido por
                <input
                  name="atendidoPor"
                  className="ui-input mt-1"
                  defaultValue={String(contexto.ATENDIDO_POR ?? "")}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                Observaciones
                <textarea
                  name="observaciones"
                  className="ui-input mt-1"
                  rows={2}
                  defaultValue={String(contexto.SERVICIO_OBSERVACIONES ?? "")}
                />
              </label>
              <Button type="submit" variant="primary" className="sm:col-span-2 w-fit">
                Guardar servicio
              </Button>
            </form>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoBlock
                label="Fecha del servicio"
                value={formatDate(contexto.FECHA_SERVICIO)}
              />
              <InfoBlock label="Atendido por" value={String(contexto.ATENDIDO_POR ?? "—")} />
              <InfoBlock label="Tipo" value={String(contexto.TIPO_SERVICIO ?? "—")} />
              <InfoBlock
                label="PFC"
                value={Number(contexto.ES_PFC) === 1 ? "Sí" : "No"}
              />
            </dl>
          )}
        </section>
      ) : null}

      {contexto.ID_PRESTAMO ? (
        <section className="ui-surface p-6">
          <SectionHeader title="Préstamo" />
          <dl className="grid gap-4 sm:grid-cols-2">
            <InfoBlock
              label="Vencimiento (6 meses)"
              value={formatDate(contexto.FECHA_VENCIMIENTO)}
            />
            <InfoBlock label="Estado" value={String(contexto.PRESTAMO_ESTADO ?? "—")} />
            <InfoBlock label="Garante" value={String(contexto.GARANTE_NOMBRE ?? "—")} />
          </dl>
        </section>
      ) : null}

      <section className="ui-surface p-6">
        <SectionHeader title="Documentación" />
        <DocumentUpload idFallecido={idFallecido} canDelete={canDeleteDocs} />
      </section>

      {historial.length > 0 ? (
        <section className="ui-surface p-6">
          <SectionHeader title="Historial de ocupaciones" />
          <ul className="divide-y divide-stone/50 text-sm">
            {historial.map((h) => (
              <li key={String(h.ID_OCUPACION)} className="py-3">
                <p className="font-medium text-ink">
                  {String(h.PABELLON)} · Nicho {String(h.NICHO)}
                </p>
                <p className="text-driftwood">
                  Sepultura {formatDate(h.FECHA_INICIO)}
                  {h.FECHA_FIN ? ` — finalizada ${formatDate(h.FECHA_FIN)}` : ""} ·{" "}
                  {String(h.ESTADO)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {editSepultura && fechaSepultura ? (
        <EditarSepulturaModal
          fechaActual={toDateOnlyString(fechaSepultura as string | Date) ?? ""}
          idOcupacion={idOcupacion}
          idUbicacionExterna={idUbicExt}
          onClose={() => setEditSepultura(false)}
          onSuccess={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}
