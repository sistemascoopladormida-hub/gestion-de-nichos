"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { NichoMapa } from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { toast, useConfirm } from "@/components/ui/FeedbackProvider";
import { cn } from "@/lib/utils/cn";
import { nichoEstadoLabel } from "./nichoStyles";

type Props = {
  selected: NichoMapa;
  pabellonNombre: string;
  pabellonUbicacion: string;
  canAssign: boolean;
  canChangeEstado: boolean;
  canFinalize: boolean;
  canResolvePrestamo: boolean;
  onAssign: () => void;
  onPrestamo: () => void;
  onSinDatos: () => void;
  onReservar: () => void;
  onInhabilitar: () => void;
  onMantenimiento: () => void;
  onFinalize: () => void;
  onEstadoChanged: (patch: Partial<NichoMapa>) => void;
  onClose?: () => void;
  className?: string;
};

function CambiarEstadoMenu({
  items,
}: {
  items: { label: string; onClick: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <div className="relative w-full">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Cambiar estado / Más acciones ▾
      </Button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <ul
            role="menu"
            className="absolute left-0 right-0 z-20 mt-1 rounded-lg border border-stone/70 bg-bone py-1 shadow-lg"
          >
            {items.map((item) => (
              <li key={item.label} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-4 py-2.5 text-left text-sm text-ink hover:bg-linen/60"
                  onClick={() => {
                    setOpen(false);
                    item.onClick();
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

export function NichoSidebarPanel({
  selected,
  pabellonNombre,
  pabellonUbicacion,
  canAssign,
  canChangeEstado,
  canFinalize,
  canResolvePrestamo,
  onAssign,
  onPrestamo,
  onSinDatos,
  onReservar,
  onInhabilitar,
  onMantenimiento,
  onFinalize,
  onEstadoChanged,
  onClose,
  className,
}: Props) {
  const confirm = useConfirm();
  const ev = selected.estadoVisual;
  const sinDatos = ev === "OCUPADO_SIN_DATOS";
  const ocupado =
    ev === "OCUPADO" || ev === "PRESTAMO" || sinDatos;
  const adminEstado =
    ev === "RESERVADO" || ev === "INHABILITADO" || ev === "MANTENIMIENTO";

  async function liberarAdministrativo() {
    const ok = await confirm({
      title: "¿Volver a disponible?",
      description:
        "El nicho quedará libre para asignación. Se borrarán las observaciones de bloqueo o reserva.",
      confirmText: "Liberar",
    });
    if (!ok) return;
    const res = await fetch(`/api/nichos/${selected.idNicho}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "DISPONIBLE" }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "No se pudo liberar el nicho");
      return;
    }
    toast.success("Nicho disponible");
    onEstadoChanged({
      estadoVisual: "DISPONIBLE",
      observaciones: null,
      fallecidoNombre: null,
      idFallecido: null,
      idOcupacion: null,
      fechaSepultura: null,
      idPrestamo: null,
      fechaVencimientoPrestamo: null,
      garanteNombre: null,
    });
  }

  async function finalizarPrestamo() {
    if (!selected.idPrestamo) {
      toast.error("No se encontró el préstamo activo");
      return;
    }
    const ok = await confirm({
      title: "¿Finalizar préstamo y devolver nicho?",
      description:
        "Se dará por resuelto el préstamo y se finalizará la ocupación. El nicho volverá a disponible.",
      confirmText: "Devolver nicho",
      variant: "danger",
    });
    if (!ok) return;
    const res = await fetch("/api/prestamos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idPrestamo: selected.idPrestamo,
        resolucion: "Devolución desde mapa de pabellón",
        estado: "TRASLADADO",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "No se pudo finalizar el préstamo");
      return;
    }
    toast.success("Préstamo finalizado — nicho disponible");
    onEstadoChanged({
      estadoVisual: "DISPONIBLE",
      observaciones: null,
      fallecidoNombre: null,
      idFallecido: null,
      idOcupacion: null,
      fechaSepultura: null,
      idPrestamo: null,
      fechaVencimientoPrestamo: null,
      garanteNombre: null,
    });
  }

  async function convertirPrestamoDefinitivo() {
    if (!selected.idPrestamo) return;
    const ok = await confirm({
      title: "¿Convertir en ocupación definitiva?",
      description:
        "El préstamo se cerrará como arancel definitivo y el nicho quedará ocupado de forma permanente.",
      confirmText: "Convertir",
    });
    if (!ok) return;
    const res = await fetch("/api/prestamos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idPrestamo: selected.idPrestamo,
        resolucion: "Conversión a ocupación definitiva desde mapa",
        estado: "CONVERTIDO_EN_ARANCEL",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "No se pudo convertir el préstamo");
      return;
    }
    toast.success("Préstamo convertido — ocupación definitiva");
    onEstadoChanged({
      estadoVisual: "OCUPADO",
      idPrestamo: null,
      fechaVencimientoPrestamo: null,
      garanteNombre: null,
    });
  }

  const menuDisponible =
    canChangeEstado || canAssign
      ? [
          ...(canAssign
            ? [
                { label: "Registrar como préstamo", onClick: onPrestamo },
                { label: "Marcar ocupado sin datos", onClick: onSinDatos },
              ]
            : []),
          ...(canChangeEstado
            ? [
                { label: "Reservar nicho", onClick: onReservar },
                { label: "Inhabilitar nicho", onClick: onInhabilitar },
                { label: "Poner en mantenimiento", onClick: onMantenimiento },
              ]
            : []),
        ]
      : [];

  return (
    <aside
      className={cn(
        "flex flex-col rounded-[var(--radius-modal)] border border-stone/80 bg-bone p-6 shadow-[var(--shadow-card)]",
        className,
      )}
      aria-label="Detalle del nicho seleccionado"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="ui-eyebrow">Nicho seleccionado</p>
        {onClose ? (
          <button
            type="button"
            className="rounded-[var(--radius-card)] p-1 text-ash hover:bg-linen lg:hidden"
            aria-label="Cerrar panel"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <h2 className="mt-2 font-serif text-[var(--text-heading-sm)] tracking-tight">
        {pabellonNombre} — Nº {selected.numero}
      </h2>
      <p className="text-sm text-driftwood">{pabellonUbicacion}</p>
      <span className="ui-badge mt-4 w-fit border-forest/30 text-forest">
        {nichoEstadoLabel(ev)}
      </span>

      {adminEstado && selected.observaciones ? (
        <p className="mt-4 rounded-[var(--radius-card)] border border-mist/80 bg-[var(--color-paper)] p-3 text-sm text-driftwood">
          {selected.observaciones}
        </p>
      ) : null}

      {sinDatos ? (
        <div
          className="mt-5 rounded-[var(--radius-card)] border border-dashed border-ash/50 bg-[var(--color-paper)] p-4 text-sm"
          role="alert"
        >
          <p className="flex items-start gap-2 font-medium text-ink">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" aria-hidden />
            Nicho ocupado — sin datos del fallecido
          </p>
        </div>
      ) : null}

      {ev === "PRESTAMO" ? (
        <dl className="mt-5 space-y-3 border-t border-stone/60 pt-4 text-sm">
          <div>
            <dt className="ui-eyebrow normal-case tracking-normal">Fallecido</dt>
            <dd className="mt-1 text-ink">{selected.fallecidoNombre ?? "—"}</dd>
          </div>
          <div>
            <dt className="ui-eyebrow normal-case tracking-normal">Garante</dt>
            <dd className="mt-1 text-ink">{selected.garanteNombre ?? "—"}</dd>
          </div>
          {selected.fechaSepultura ? (
            <div>
              <dt className="ui-eyebrow normal-case tracking-normal">Inicio</dt>
              <dd className="mt-1 font-mono text-ink">{selected.fechaSepultura}</dd>
            </div>
          ) : null}
          {selected.fechaVencimientoPrestamo ? (
            <div>
              <dt className="ui-eyebrow normal-case tracking-normal">Vencimiento</dt>
              <dd className="mt-1 font-mono text-ink">
                {selected.fechaVencimientoPrestamo}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {ocupado && ev !== "PRESTAMO" ? (
        <dl className="mt-5 space-y-3 border-t border-stone/60 pt-4 text-sm">
          <div>
            <dt className="ui-eyebrow normal-case tracking-normal">Fallecido</dt>
            <dd className="mt-1 text-ink">{selected.fallecidoNombre ?? "—"}</dd>
          </div>
          {selected.fechaSepultura ? (
            <div>
              <dt className="ui-eyebrow normal-case tracking-normal">Sepultura</dt>
              <dd className="mt-1 font-mono text-ink">{selected.fechaSepultura}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="mt-6 flex flex-col gap-2">
        {ev === "DISPONIBLE" && canAssign ? (
          <Button type="button" onClick={onAssign} className="cursor-pointer">
            Asignar fallecido
          </Button>
        ) : null}

        {ev === "DISPONIBLE" && menuDisponible.length > 0 ? (
          <CambiarEstadoMenu items={menuDisponible} />
        ) : null}

        {adminEstado && canChangeEstado ? (
          <>
            <Button type="button" variant="primary" onClick={liberarAdministrativo}>
              Liberar / Volver a disponible
            </Button>
            {ev === "RESERVADO" ? (
              <Button type="button" variant="outline" onClick={onReservar}>
                Editar reserva
              </Button>
            ) : null}
            {(ev === "INHABILITADO" || ev === "MANTENIMIENTO") && (
              <Button
                type="button"
                variant="outline"
                onClick={ev === "INHABILITADO" ? onMantenimiento : onInhabilitar}
              >
                {ev === "INHABILITADO"
                  ? "Cambiar a mantenimiento"
                  : "Cambiar a inhabilitado"}
              </Button>
            )}
          </>
        ) : null}

        {ev === "PRESTAMO" ? (
          <>
            {canResolvePrestamo ? (
              <>
                <Button type="button" variant="danger" onClick={finalizarPrestamo}>
                  Finalizar préstamo / Devolver nicho
                </Button>
                <Button type="button" variant="outline" onClick={convertirPrestamoDefinitivo}>
                  Convertir en ocupación definitiva
                </Button>
              </>
            ) : null}
            <Button href="/prestamos" variant="secondary">
              Ver detalle de préstamos
            </Button>
          </>
        ) : null}

        {sinDatos && selected.idFallecido ? (
          <Button href={`/fallecidos/${selected.idFallecido}/editar`} variant="primary">
            Completar datos del fallecido
          </Button>
        ) : null}

        {ocupado && selected.idFallecido && !sinDatos && ev !== "PRESTAMO" ? (
          <>
            <Button href={`/fallecidos/${selected.idFallecido}`} variant="secondary">
              Ver ficha completa
            </Button>
            <Button href={`/cementerio/nicho/${selected.idNicho}`} variant="outline">
              Cambiar de nicho / detalle
            </Button>
          </>
        ) : null}

        {ocupado && canFinalize && selected.idOcupacion && ev !== "PRESTAMO" ? (
          <Button type="button" variant="danger" onClick={onFinalize}>
            Liberar nicho
          </Button>
        ) : null}

        <Link
          href={`/cementerio/nicho/${selected.idNicho}`}
          className="mt-2 text-center text-sm text-ember hover:underline"
        >
          Abrir ficha del nicho
        </Link>
      </div>
    </aside>
  );
}
