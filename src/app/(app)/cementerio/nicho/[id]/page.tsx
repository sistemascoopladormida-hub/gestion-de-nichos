import Link from "next/link";
import { notFound } from "next/navigation";
import { NichoDetalleActions } from "@/components/nicho/NichoDetalleActions";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { nichoEstadoLabel } from "@/components/nicho/nichoStyles";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getHistorialNicho, getNichoDetalle } from "@/lib/repositories/nichos";
import { formatDate, nombreCompleto } from "@/lib/utils/format";
import type { NichoEstadoVisual } from "@/types/domain";

type Props = { params: Promise<{ id: string }> };

function diasHastaDiezAnios(fecha: unknown): string {
  if (!fecha) return "—";
  const cumple = new Date(String(fecha));
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  cumple.setHours(0, 0, 0, 0);
  const diff = Math.ceil((cumple.getTime() - hoy.getTime()) / 86400000);
  if (diff <= 0) return "10 AÑOS CUMPLIDOS";
  return `Faltan ${diff} días`;
}

function calcularTiempoSepultado(fechaInicio: unknown): string {
  if (!fechaInicio) return "—";

  const inicio = new Date(String(fechaInicio));
  const hoy = new Date();

  // Si la fecha es inválida o futura
  if (isNaN(inicio.getTime()) || inicio > hoy) {
    return "—";
  }

  let anios = hoy.getFullYear() - inicio.getFullYear();
  let meses = hoy.getMonth() - inicio.getMonth();
  let dias = hoy.getDate() - inicio.getDate();

  if (dias < 0) {
    meses -= 1;
    // Días del mes anterior
    const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
    dias += ultimoDiaMesAnterior;
  }

  if (meses < 0) {
    anios -= 1;
    meses += 12;
  }

  const partes: string[] = [];
  if (anios > 0) partes.push(`${anios} ${anios === 1 ? "año" : "años"}`);
  if (meses > 0) partes.push(`${meses} ${meses === 1 ? "mes" : "meses"}`);
  if (dias > 0 || partes.length === 0) partes.push(`${dias} ${dias === 1 ? "día" : "días"}`);

  return partes.join(", ");
}

export default async function NichoDetallePage({ params }: Props) {
  const id = Number((await params).id);
  const [detalle, historial, user] = await Promise.all([
    getNichoDetalle(id),
    getHistorialNicho(id),
    getSessionUser(),
  ]);
  if (!detalle) notFound();

  const estado = detalle.ESTADO_VISUAL as NichoEstadoVisual;
  const ocupado = Boolean(detalle.ID_OCUPACION);
  const canFinalize =
    user != null &&
    hasPermission(user, "ocupaciones:finalize") &&
    ocupado;

  const fallecidoNombre = ocupado
    ? nombreCompleto(String(detalle.APELLIDO), detalle.NOMBRE as string)
    : "";

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Cementerio", href: "/cementerio" },
          {
            label: String(detalle.PABELLON_NOMBRE),
            href: `/cementerio/pabellon/${detalle.PABELLON_CODIGO}`,
          },
          { label: `Nicho ${String(detalle.NUMERO)}` },
        ]}
      />

      <header className="rounded-xl border border-coop-border bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">{String(detalle.UBICACION)}</p>
        <h1 className="text-2xl font-semibold text-coop-primary">
          {String(detalle.PABELLON_NOMBRE)} — Nicho{" "}
          {String(detalle.NUMERO).padStart(2, "0")}
        </h1>
        <p className="mt-2 inline-block rounded-full bg-coop-surface px-3 py-1 text-sm">
          Estado: <strong>{nichoEstadoLabel(estado)}</strong>
        </p>

        {ocupado ? (
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p>
              Fallecido:{" "}
              <Link
                href={`/fallecidos/${detalle.ID_FALLECIDO}`}
                className="font-medium text-coop-accent hover:underline"
              >
                {fallecidoNombre}
              </Link>
            </p>
            <p>DNI: {String(detalle.DNI ?? "—")}</p>
            <p>Fallecimiento: {formatDate(detalle.FECHA_FALLECIMIENTO)}</p>
            <p>Lugar: {String(detalle.LUGAR_FALLECIMIENTO ?? "—")}</p>
            <p>
              <span className="text-slate-500">Fecha de sepultura: </span>
              {formatDate(detalle.FECHA_INICIO)}
            </p>
            <p>
              <span className="text-slate-500">10 años: </span>
              {formatDate(detalle.FECHA_CUMPLIMIENTO_10_ANIOS)}
            </p>
            <p>
              Tiempo sepultado:{" "}
              <strong>{calcularTiempoSepultado(detalle.FECHA_INICIO)}</strong>
            </p>
            <p>
              PFC:{" "}
              {detalle.ES_PFC === true || detalle.ES_PFC === 1 ? "Sí" : "No"}
            </p>
            <p>Tipo ocupación: {String(detalle.TIPO_OCUPACION)}</p>
            <p className="text-slate-600">{diasHastaDiezAnios(detalle.FECHA_CUMPLIMIENTO_10_ANIOS)}</p>
            {detalle.ID_PRESTAMO ? (
              <>
                <p>
                  Préstamo: {String(detalle.PRESTAMO_ESTADO)} — vence{" "}
                  {formatDate(detalle.PRESTAMO_VENCIMIENTO)}
                </p>
                <p>
                  Garante: {String(detalle.GARANTE_NOMBRE ?? "—")} (DNI{" "}
                  {String(detalle.GARANTE_DNI ?? "—")})
                </p>
              </>
            ) : null}
            {detalle.TIPO_SERVICIO ? (
              <p>Servicio: {String(detalle.TIPO_SERVICIO)}</p>
            ) : null}
            {detalle.OCUP_OBSERVACIONES ? (
              <p className="sm:col-span-2">
                Observaciones: {String(detalle.OCUP_OBSERVACIONES)}
              </p>
            ) : null}
          </div>
        ) : null}

        {ocupado && detalle.ID_FALLECIDO ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button href={`/fallecidos/${detalle.ID_FALLECIDO}`} variant="secondary">
              Ver ficha del fallecido
            </Button>
          </div>
        ) : null}

        {canFinalize ? (
          <NichoDetalleActions
            canFinalize
            idOcupacion={Number(detalle.ID_OCUPACION)}
            fallecido={fallecidoNombre}
            nichoLabel={`${detalle.PABELLON_NOMBRE} — Nicho ${detalle.NUMERO}`}
            fechaSepultura={formatDate(detalle.FECHA_INICIO)}
          />
        ) : null}
      </header>

      <section className="rounded-xl border border-coop-border bg-white p-6 shadow-sm">
        <h2 className="mb-3 font-medium">Historial del nicho</h2>
        {historial.length === 0 ? (
          <p className="text-sm text-slate-500">Sin ocupaciones registradas.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {historial.map((h) => {
              const activa = h.ESTADO === "ACTIVO";
              const motivo = h.MOTIVO_FINALIZACION
                ? String(h.MOTIVO_FINALIZACION)
                : null;
              return (
                <li
                  key={String(h.ID_OCUPACION)}
                  className="rounded-lg border border-coop-border p-3"
                >
                  <p className="font-medium">{String(h.FALLECIDO)}</p>
                  <p className="text-slate-600">
                    {formatDate(h.FECHA_INICIO)}
                    {activa
                      ? " → ACTUAL"
                      : h.FECHA_FIN
                        ? ` → ${formatDate(h.FECHA_FIN)}`
                        : ""}
                  </p>
                  {motivo && !activa ? (
                    <p className="text-slate-500">Motivo: {motivo}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}