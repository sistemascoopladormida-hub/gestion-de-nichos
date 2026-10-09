"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Toaster, toast } from "sonner";

export { toast };

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmContext);
  if (!fn) {
    throw new Error("useConfirm debe usarse dentro de FeedbackProvider");
  }
  return fn;
}

type PendingConfirm = ConfirmOptions & { open: true };

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setPending({ ...options, open: true });
    });
  }, []);

  function close(result: boolean) {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setPending(null);
  }

  const danger = pending?.variant === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast: "font-sans shadow-lg border border-coop-border",
          },
        }}
      />
      {pending ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-semibold text-coop-primary"
            >
              {pending.title}
            </h2>
            {pending.description ? (
              <p className="mt-2 text-sm text-slate-600">{pending.description}</p>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-coop-border px-4 py-2 text-sm hover:bg-coop-surface"
                onClick={() => close(false)}
              >
                {pending.cancelText ?? "Cancelar"}
              </button>
              <button
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                  danger
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-coop-primary hover:bg-coop-primary-dark"
                }`}
                onClick={() => close(true)}
              >
                {pending.confirmText ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}
