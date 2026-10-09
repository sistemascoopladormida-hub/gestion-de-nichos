import Link from "next/link";
import { notFound } from "next/navigation";
import { PabellonMapaInteractive } from "@/components/nicho/PabellonMapaInteractive";
import { hasPermission } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";
import {
  getPabellonByCodigo,
  listNichosMapaByPabellonCodigo,
} from "@/lib/repositories/pabellones";

type Props = { params: Promise<{ codigo: string }> };

export default async function PabellonMapaPage({ params }: Props) {
  const codigo = (await params).codigo.toUpperCase();
  const [pabellon, nichos, user] = await Promise.all([
    getPabellonByCodigo(codigo),
    listNichosMapaByPabellonCodigo(codigo),
    getSessionUser(),
  ]);
  if (!pabellon) notFound();

  const canAssign = user != null && hasPermission(user, "ocupaciones:assign");
  const canFinalize = user != null && hasPermission(user, "ocupaciones:finalize");
  const canChangeEstado = user != null && hasPermission(user, "nichos:estado");
  const canResolvePrestamo =
    user != null && hasPermission(user, "prestamos:resolve");

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Link href="/cementerio" className="text-sm text-ember hover:underline">
          ← Volver al cementerio
        </Link>
        <p className="ui-eyebrow">{codigo}</p>
        <h1 className="font-serif text-[var(--text-heading-lg)] tracking-tight">
          {String(pabellon.NOMBRE)}
        </h1>
        <p className="text-driftwood">{String(pabellon.UBICACION)}</p>
      </header>
      <PabellonMapaInteractive
        pabellonNombre={String(pabellon.NOMBRE)}
        pabellonUbicacion={String(pabellon.UBICACION)}
        nichosIniciales={nichos}
        columnas={Number(pabellon.COLUMNAS_MAPA)}
        filas={Number(pabellon.FILAS_MAPA)}
        canAssign={canAssign}
        canFinalize={canFinalize}
        canChangeEstado={canChangeEstado}
        canResolvePrestamo={canResolvePrestamo}
      />
    </div>
  );
}
