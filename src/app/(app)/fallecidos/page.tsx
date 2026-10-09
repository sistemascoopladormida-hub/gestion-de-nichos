import Link from "next/link";
import { listFallecidos } from "@/lib/repositories/fallecidos";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { formatDate, nombreCompleto } from "@/lib/utils/format";

type Props = { searchParams: Promise<{ q?: string; archivados?: string }> };

export default async function FallecidosPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q;
  const incluirArchivados = sp.archivados === "1";
  const rows = await listFallecidos(q, { incluirArchivados });

  return (
    <div className="ui-stack-page">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Fallecidos" },
        ]}
      />
      <PageHeader
        title="Fallecidos"
        description="Busque por apellido, nombre o DNI."
        actions={
          <Link href="/fallecidos/nuevo" className="ui-btn-primary px-4 py-2.5">
            + Nuevo fallecido
          </Link>
        }
      />
      <form className="ui-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm">
          <span className="font-medium text-ash">Buscar fallecido</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Nombre, apellido o DNI…"
            className="ui-input mt-1"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="archivados"
            value="1"
            defaultChecked={incluirArchivados}
            className="h-4 w-4 rounded border-stone"
          />
          Mostrar archivados
        </label>
        <button type="submit" className="ui-btn-secondary px-4 py-2.5">
          Buscar
        </button>
      </form>
      <div className="ui-surface overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-stone/60 bg-linen/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-ash">Apellido y nombre</th>
              <th className="px-4 py-3 font-medium text-ash">DNI</th>
              <th className="px-4 py-3 font-medium text-ash">Fecha de sepultura</th>
              <th className="px-4 py-3 font-medium text-ash">Ubicación</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-driftwood">
                  No se encontraron registros.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={String(r.ID_FALLECIDO)} className="border-t border-stone/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/fallecidos/${r.ID_FALLECIDO}`}
                      className="font-medium text-forest hover:underline"
                    >
                      {nombreCompleto(String(r.APELLIDO), r.NOMBRE as string)}
                    </Link>
                    {Number(r.ACTIVO) === 0 ? (
                      <span className="ml-2 ui-badge">Archivado</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{String(r.DNI ?? "—")}</td>
                  <td className="px-4 py-3">{formatDate(r.FECHA_SEPULTURA)}</td>
                  <td className="px-4 py-3">
                    {r.PABELLON ? `${r.PABELLON} · Nicho ${r.NICHO}` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
