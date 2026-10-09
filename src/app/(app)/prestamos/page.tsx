import Link from "next/link";
import { PrestamosTable } from "@/components/prestamos/PrestamosTable";
import { hasPermission } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";
import { listPrestamos } from "@/lib/repositories/prestamos";

type Props = { searchParams: Promise<{ filtro?: string }> };

export default async function PrestamosPage({ searchParams }: Props) {
  const filtro = (await searchParams).filtro;
  const user = await getSessionUser();
  const rows = await listPrestamos(
    filtro === "vencidos" ? "vencidos" : filtro === "proximos" ? "proximos" : undefined,
  );
  const canResolve = user != null && hasPermission(user, "prestamos:resolve");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-coop-primary">Préstamos de nichos</h1>
      <p className="text-sm text-slate-600">
        Un préstamo vencido genera alerta pero <strong>no libera</strong> el nicho hasta una
        decisión administrativa (por ejemplo, traslado).
      </p>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/prestamos" className="rounded-lg border bg-white px-3 py-1.5">
          Todos
        </Link>
        <Link href="/prestamos?filtro=vencidos" className="rounded-lg border bg-white px-3 py-1.5">
          Vencidos
        </Link>
        <Link href="/prestamos?filtro=proximos" className="rounded-lg border bg-white px-3 py-1.5">
          Próximos (30 días)
        </Link>
      </div>
      <PrestamosTable rows={rows} canResolve={canResolve} />
    </div>
  );
}
