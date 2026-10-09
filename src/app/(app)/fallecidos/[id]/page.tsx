import { notFound } from "next/navigation";
import { FallecidoFicha } from "@/components/fallecidos/FallecidoFicha";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { hasPermission } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";
import {
  getFallecidoContexto,
  getHistorialOcupacionesFallecido,
} from "@/lib/repositories/fallecidos";
import { nombreCompleto } from "@/lib/utils/format";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ servicio?: string; tab?: string }>;
};

export default async function FallecidoDetallePage({ params, searchParams }: Props) {
  const id = Number((await params).id);
  const sp = await searchParams;
  const user = await getSessionUser();

  let ctx = await getFallecidoContexto(id);
  if (!ctx && user?.rol === "ADMINISTRADOR") {
    ctx = await getFallecidoContexto(id, { incluirArchivados: true });
  }
  if (!ctx) notFound();

  const historial = await getHistorialOcupacionesFallecido(id);
  const titulo = nombreCompleto(String(ctx.APELLIDO), ctx.NOMBRE as string);

  const canEdit = user != null && hasPermission(user, "fallecidos:edit");
  const canEditSepultura = user != null && hasPermission(user, "ocupaciones:edit_fecha");
  const canEditServicio = user != null && hasPermission(user, "servicios:edit");
  const canArchive = user != null && hasPermission(user, "fallecidos:archive");
  const canRestore = user != null && hasPermission(user, "fallecidos:restore");
  const canDeleteDocs = user != null && hasPermission(user, "documentos:delete");

  return (
    <div className="ui-stack-page">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Fallecidos", href: "/fallecidos" },
          { label: titulo },
        ]}
      />
      {sp.servicio === "ok" ? (
        <p className="rounded-lg border border-forest/30 bg-[color-mix(in_oklab,#34785c_10%,#f2f1ed)] px-4 py-2 text-sm text-ink">
          Servicio registrado correctamente. Revise la sección Sepultura y cargue documentación
          abajo si corresponde.
        </p>
      ) : null}
      <FallecidoFicha
        idFallecido={id}
        contexto={ctx}
        historial={historial}
        canEdit={canEdit}
        canEditSepultura={canEditSepultura}
        canEditServicio={canEditServicio}
        canArchive={canArchive}
        canRestore={canRestore}
        canDeleteDocs={canDeleteDocs}
      />
    </div>
  );
}
