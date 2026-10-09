"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
};

export function NichoModalShell({
  title,
  description,
  children,
  onClose,
  footer,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[1px]">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-modal)] border border-stone/80 bg-bone p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-serif text-xl text-ink">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-driftwood">{description}</p>
        ) : null}
        <div className="mt-5">{children}</div>
        <div className="mt-6 flex justify-end gap-2 border-t border-stone/60 pt-4">
          {footer ?? (
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
