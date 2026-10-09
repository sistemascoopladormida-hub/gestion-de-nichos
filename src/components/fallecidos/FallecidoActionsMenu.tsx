"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast, useConfirm } from "@/components/ui/FeedbackProvider";
import { Button } from "@/components/ui/Button";

type Props = {
  idFallecido: number;
  nombre: string;
  archivado: boolean;
  canArchive: boolean;
  canRestore: boolean;
};

export function FallecidoActionsMenu({
  idFallecido,
  nombre,
  archivado,
  canArchive,
  canRestore,
}: Props) {
  const [open, setOpen] = useState(false);
  const confirm = useConfirm();
  const router = useRouter();

  if (!canArchive && !canRestore) return null;

  async function onArchiveOrDelete() {
    setOpen(false);
    const ok = await confirm({
      title: "¿Eliminar o archivar este fallecido?",
      description: `Se evaluará si "${nombre}" tiene información asociada. Si la tiene, se archivará para conservar el historial.`,
      confirmText: "Continuar",
      variant: "danger",
    });
    if (!ok) return;

    const res = await fetch(`/api/fallecidos/${idFallecido}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "No se pudo completar la acción");
      return;
    }
    if (data.modo === "eliminado") {
      toast.success("Fallecido eliminado correctamente");
      router.push("/fallecidos");
      router.refresh();
      return;
    }
    toast.success("Fallecido archivado. Puede consultarlo con el filtro «Mostrar archivados».");
    router.refresh();
  }

  async function onRestore() {
    setOpen(false);
    const ok = await confirm({
      title: "¿Restaurar fallecido?",
      description: `Volverá a aparecer en listados activos. No se modifican ocupaciones ni nichos automáticamente.`,
      confirmText: "Restaurar",
    });
    if (!ok) return;
    const res = await fetch(`/api/fallecidos/${idFallecido}/restore`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "No se pudo restaurar");
      return;
    }
    toast.success("Fallecido restaurado");
    router.refresh();
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Más acciones ▾
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
            className="absolute right-0 z-20 mt-1 min-w-[220px] rounded-lg border border-stone/70 bg-bone py-1 shadow-lg"
          >
            {canArchive && !archivado ? (
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-4 py-2 text-left text-sm text-crimson hover:bg-linen/60"
                  onClick={onArchiveOrDelete}
                >
                  Archivar / eliminar…
                </button>
              </li>
            ) : null}
            {canRestore && archivado ? (
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-4 py-2 text-left text-sm text-ink hover:bg-linen/60"
                  onClick={onRestore}
                >
                  Restaurar fallecido
                </button>
              </li>
            ) : null}
          </ul>
        </>
      ) : null}
    </div>
  );
}
