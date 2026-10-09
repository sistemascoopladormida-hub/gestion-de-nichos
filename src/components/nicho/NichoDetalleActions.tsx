"use client";

import { useState } from "react";
import { FinalizarOcupacionModal } from "./FinalizarOcupacionModal";

export function NichoDetalleActions(props: {
  canFinalize: boolean;
  idOcupacion: number;
  fallecido: string;
  nichoLabel: string;
  fechaSepultura: string;
}) {
  const [open, setOpen] = useState(false);
  if (!props.canFinalize) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
      >
        Finalizar ocupación
      </button>
      {open ? (
        <FinalizarOcupacionModal
          {...props}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
