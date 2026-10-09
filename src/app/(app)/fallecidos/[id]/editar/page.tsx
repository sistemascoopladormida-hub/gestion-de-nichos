"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FallecidoForm, type FallecidoFormValues } from "@/components/fallecidos/FallecidoForm";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "@/components/ui/FeedbackProvider";

export default function EditarFallecidoPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const [initial, setInitial] = useState<FallecidoFormValues | null>(null);
  const [titulo, setTitulo] = useState("");

  useEffect(() => {
    fetch(`/api/fallecidos/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.row) {
          router.replace("/fallecidos");
          return;
        }
        const row = data.row;
        setTitulo([row.APELLIDO, row.NOMBRE].filter(Boolean).join(", "));
        setInitial({
          apellido: String(row.APELLIDO),
          nombre: String(row.NOMBRE ?? ""),
          dni: String(row.DNI ?? ""),
          fechaNacimiento: row.FECHA_NACIMIENTO
            ? String(row.FECHA_NACIMIENTO).slice(0, 10)
            : "",
          fechaFallecimiento: row.FECHA_FALLECIMIENTO
            ? String(row.FECHA_FALLECIMIENTO).slice(0, 10)
            : "",
          lugarFallecimiento: String(row.LUGAR_FALLECIMIENTO ?? ""),
          personaReferencia: String(row.PERSONA_REFERENCIA ?? ""),
          parentesco: String(row.PARENTESCO ?? ""),
          telefonoReferencia: String(row.TELEFONO_REFERENCIA ?? ""),
          emailReferencia: String(row.EMAIL_REFERENCIA ?? ""),
          observaciones: String(row.OBSERVACIONES ?? ""),
        });
      });
  }, [id, router]);

  if (!initial) {
    return <p className="text-sm text-driftwood">Cargando…</p>;
  }

  return (
    <div className="ui-stack-page">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Fallecidos", href: "/fallecidos" },
          { label: titulo, href: `/fallecidos/${id}` },
          { label: "Editar" },
        ]}
      />
      <PageHeader title="Editar fallecido" description={titulo} />
      <div className="ui-surface p-6">
        <FallecidoForm
          initial={initial}
          submitLabel="Guardar cambios"
          cancelHref={`/fallecidos/${id}`}
          onSubmit={async (values) => {
            const res = await fetch(`/api/fallecidos/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(values),
            });
            const data = await res.json();
            if (!res.ok) {
              toast.error(data.error ?? "No se pudo guardar");
              throw new Error(data.error);
            }
            toast.success("Los datos del fallecido fueron actualizados correctamente");
            router.push(`/fallecidos/${id}`);
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
