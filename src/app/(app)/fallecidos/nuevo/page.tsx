"use client";

import { useRouter } from "next/navigation";
import { FallecidoForm } from "@/components/fallecidos/FallecidoForm";
import { toast } from "@/components/ui/FeedbackProvider";

export default function NuevoFallecidoPage() {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-coop-primary">Registrar fallecido</h1>
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <FallecidoForm
          submitLabel="Guardar fallecido"
          onSubmit={async (values) => {
            const res = await fetch("/api/fallecidos", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(values),
            });
            const data = await res.json();
            if (!res.ok) {
              toast.error(data.error ?? "No se pudo guardar el fallecido");
              throw new Error(data.error ?? "Error");
            }
            toast.success("Fallecido guardado correctamente");
            router.push(`/fallecidos/${data.idFallecido}`);
          }}
        />
      </div>
    </div>
  );
}
