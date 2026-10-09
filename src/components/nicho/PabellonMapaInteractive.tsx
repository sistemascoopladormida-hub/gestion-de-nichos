"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PanelRightOpen } from "lucide-react";
import type { NichoEstadoVisual, NichoMapa } from "@/types/domain";
import { MapaLeyenda } from "./MapaLeyenda";
import { NichoGrid } from "./NichoGrid";
import { AsignarFallecidoModal } from "./AsignarFallecidoModal";
import { FinalizarOcupacionModal } from "./FinalizarOcupacionModal";
import { OcuparSinDatosModal } from "./OcuparSinDatosModal";
import { PrestamoMapaModal } from "./PrestamoMapaModal";
import { ReservarNichoModal } from "./ReservarNichoModal";
import { BloquearNichoModal } from "./BloquearNichoModal";
import { NichoSidebarPanel } from "./NichoSidebarPanel";

type Props = {
  pabellonNombre: string;
  pabellonUbicacion: string;
  nichosIniciales: NichoMapa[];
  columnas: number;
  filas: number;
  canAssign: boolean;
  canFinalize: boolean;
  canChangeEstado: boolean;
  canResolvePrestamo: boolean;
};

export function PabellonMapaInteractive({
  pabellonNombre,
  pabellonUbicacion,
  nichosIniciales,
  columnas,
  filas,
  canAssign,
  canFinalize,
  canChangeEstado,
  canResolvePrestamo,
}: Props) {
  const router = useRouter();
  const [nichos, setNichos] = useState(nichosIniciales);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [prestamoOpen, setPrestamoOpen] = useState(false);
  const [sinDatosOpen, setSinDatosOpen] = useState(false);
  const [reservarOpen, setReservarOpen] = useState(false);
  const [inhabOpen, setInhabOpen] = useState(false);
  const [mantOpen, setMantOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [filters, setFilters] = useState<Set<NichoEstadoVisual>>(new Set());
  const [mobilePanel, setMobilePanel] = useState(false);

  const selected = nichos.find((n) => n.idNicho === selectedId) ?? null;
  const nichoLabel = selected ? String(selected.numero).padStart(2, "0") : "";

  function patchNicho(idNicho: number, patch: Partial<NichoMapa>) {
    setNichos((list) =>
      list.map((n) => (n.idNicho === idNicho ? { ...n, ...patch } : n)),
    );
  }

  function toggleFilter(estado: NichoEstadoVisual) {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(estado)) next.delete(estado);
      else next.add(estado);
      return next;
    });
  }

  const sidebarProps = selected
    ? {
        selected,
        pabellonNombre,
        pabellonUbicacion,
        canAssign,
        canChangeEstado,
        canFinalize,
        canResolvePrestamo,
        onAssign: () => setAssignOpen(true),
        onPrestamo: () => setPrestamoOpen(true),
        onSinDatos: () => setSinDatosOpen(true),
        onReservar: () => setReservarOpen(true),
        onInhabilitar: () => setInhabOpen(true),
        onMantenimiento: () => setMantOpen(true),
        onFinalize: () => setFinalizeOpen(true),
        onEstadoChanged: (patch: Partial<NichoMapa>) => {
          patchNicho(selected.idNicho, patch);
          router.refresh();
        },
      }
    : null;

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-8">
      <div className="space-y-4 min-w-0">
        <MapaLeyenda
          activeFilters={filters}
          onToggleFilter={toggleFilter}
          onClearFilters={() => setFilters(new Set())}
        />
        <p className="text-sm text-driftwood">
          Seleccione un nicho en la grilla. Use la leyenda para resaltar estados.
        </p>
        <NichoGrid
          nichos={nichos}
          columnas={columnas}
          filas={filas}
          mode="interactive"
          selectedId={selectedId}
          highlightEstados={filters}
          onSelect={(n) => {
            setSelectedId(n.idNicho);
            setMobilePanel(true);
          }}
        />
      </div>

      {sidebarProps ? (
        <>
          <NichoSidebarPanel
            className="hidden lg:sticky lg:top-[68px] lg:flex"
            {...sidebarProps}
          />

          {mobilePanel ? (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
                aria-label="Cerrar"
                onClick={() => setMobilePanel(false)}
              />
              <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[var(--radius-modal)] border-t border-stone bg-bone p-4 shadow-[var(--shadow-card)]">
                <NichoSidebarPanel
                  {...sidebarProps}
                  onClose={() => setMobilePanel(false)}
                />
              </div>
            </div>
          ) : null}

          {!mobilePanel ? (
            <button
              type="button"
              className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-[var(--radius-card)] bg-ink px-4 py-3 text-sm text-parchment shadow-lg lg:hidden"
              onClick={() => setMobilePanel(true)}
            >
              <PanelRightOpen className="h-4 w-4" aria-hidden />
              Nicho {selected!.numero}
            </button>
          ) : null}
        </>
      ) : (
        <aside className="hidden rounded-[var(--radius-modal)] border border-dashed border-stone bg-bone/50 p-6 text-sm text-ash lg:block">
          Seleccione un nicho en el mapa para ver detalle y acciones.
        </aside>
      )}

      {sinDatosOpen && selected ? (
        <OcuparSinDatosModal
          idNicho={selected.idNicho}
          nichoLabel={nichoLabel}
          onClose={() => setSinDatosOpen(false)}
          onDone={(result) => {
            patchNicho(selected.idNicho, {
              estadoVisual: result.estadoVisual,
              fallecidoNombre: result.fallecidoNombre,
              idFallecido: result.idFallecido,
              idOcupacion: result.idOcupacion,
              fechaSepultura: result.fechaSepultura,
            });
            router.refresh();
          }}
        />
      ) : null}

      {assignOpen && selected ? (
        <AsignarFallecidoModal
          idNicho={selected.idNicho}
          nichoLabel={nichoLabel}
          onClose={() => setAssignOpen(false)}
          onAssigned={(result) => {
            patchNicho(selected.idNicho, {
              estadoVisual: result.estadoVisual,
              fallecidoNombre: result.fallecidoNombre,
              idFallecido: result.idFallecido,
              idOcupacion: result.idOcupacion,
              fechaSepultura: result.fechaSepultura,
            });
            router.refresh();
          }}
        />
      ) : null}

      {prestamoOpen && selected ? (
        <PrestamoMapaModal
          idNicho={selected.idNicho}
          nichoLabel={nichoLabel}
          onClose={() => setPrestamoOpen(false)}
          onDone={(result) => {
            patchNicho(selected.idNicho, {
              estadoVisual: result.estadoVisual,
              fallecidoNombre: result.fallecidoNombre,
              idFallecido: result.idFallecido,
              idOcupacion: result.idOcupacion,
              idPrestamo: result.idPrestamo,
              fechaSepultura: result.fechaSepultura,
              fechaVencimientoPrestamo: result.fechaVencimientoPrestamo,
              garanteNombre: result.garanteNombre,
            });
            router.refresh();
          }}
        />
      ) : null}

      {reservarOpen && selected ? (
        <ReservarNichoModal
          idNicho={selected.idNicho}
          nichoLabel={nichoLabel}
          onClose={() => setReservarOpen(false)}
          onDone={(result) => {
            patchNicho(selected.idNicho, {
              estadoVisual: result.estadoVisual,
              observaciones: result.observaciones,
            });
            router.refresh();
          }}
        />
      ) : null}

      {inhabOpen && selected ? (
        <BloquearNichoModal
          idNicho={selected.idNicho}
          nichoLabel={nichoLabel}
          modo="INHABILITADO"
          onClose={() => setInhabOpen(false)}
          onDone={(result) => {
            patchNicho(selected.idNicho, {
              estadoVisual: result.estadoVisual,
              observaciones: result.observaciones,
            });
            router.refresh();
          }}
        />
      ) : null}

      {mantOpen && selected ? (
        <BloquearNichoModal
          idNicho={selected.idNicho}
          nichoLabel={nichoLabel}
          modo="MANTENIMIENTO"
          onClose={() => setMantOpen(false)}
          onDone={(result) => {
            patchNicho(selected.idNicho, {
              estadoVisual: result.estadoVisual,
              observaciones: result.observaciones,
            });
            router.refresh();
          }}
        />
      ) : null}

      {finalizeOpen && selected?.idOcupacion ? (
        <FinalizarOcupacionModal
          idOcupacion={selected.idOcupacion}
          fallecido={selected.fallecidoNombre ?? "—"}
          nichoLabel={`${pabellonNombre} — ${nichoLabel}`}
          fechaSepultura={selected.fechaSepultura ?? "—"}
          onClose={() => setFinalizeOpen(false)}
          onFinalized={() => {
            patchNicho(selected.idNicho, {
              estadoVisual: "DISPONIBLE",
              fallecidoNombre: null,
              idFallecido: null,
              idOcupacion: null,
              fechaSepultura: null,
              observaciones: null,
              idPrestamo: null,
              fechaVencimientoPrestamo: null,
              garanteNombre: null,
            });
            setFinalizeOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
