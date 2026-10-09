import { AlertList } from "@/components/dashboard/AlertList";
import {
  QuickActionGrid,
  quickActionIcons,
} from "@/components/dashboard/QuickActionGrid";
import { AlertCard } from "@/components/ui/AlertCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { hasPermission } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";
import { getAlertas, getAlertasConteos } from "@/lib/repositories/alertas";
import { getDashboardResumen } from "@/lib/repositories/dashboard";
import {
  Archive,
  CircleDot,
  Clock,
  FileWarning,
  Landmark,
  Timer,
  HelpCircle,
} from "lucide-react";

export default async function DashboardPage() {
  const [resumen, alertas, conteos, user] = await Promise.all([
    getDashboardResumen(),
    getAlertas(12),
    getAlertasConteos(),
    getSessionUser(),
  ]);

  const noDisponibles =
    resumen.inhabilitados + resumen.mantenimiento + resumen.reservados;

  const quick = [
    {
      href: "/servicios/nuevo",
      label: "Nuevo servicio",
      description: "Registrar un nuevo servicio de sepelio.",
      permission: "servicios:create" as const,
      icon: quickActionIcons.servicio,
      primary: true,
    },
    {
      href: "/fallecidos/nuevo",
      label: "Nuevo fallecido",
      description: "Registrar una persona fallecida.",
      permission: "fallecidos:create" as const,
      icon: quickActionIcons.fallecido,
    },
    {
      href: "/buscar",
      label: "Buscar",
      description: "Buscar fallecido, nicho o socio.",
      permission: "buscar:view" as const,
      icon: quickActionIcons.buscar,
    },
    {
      href: "/cementerio",
      label: "Ver cementerio",
      description: "Consultar los 5 pabellones.",
      permission: "cementerio:view" as const,
      icon: quickActionIcons.cementerio,
    },
  ].filter((q) => user && hasPermission(user, q.permission));

  return (
    <div className="ui-stack-page">
      <PageHeader
        title="Gestión de Cementerio"
        description="Administración de pabellones, nichos, fallecidos y servicios."
      />

      <section aria-labelledby="kpi-heading">
        <SectionHeader id="kpi-heading" title="Resumen" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Nichos"
            value={resumen.totalNichos}
            hint="Total administrado por la Cooperativa."
            icon={Landmark}
            tone="neutral"
            href="/cementerio"
          />
          <StatCard
            label="Ocupados"
            value={resumen.ocupados}
            icon={CircleDot}
            tone="crimson"
            href="/cementerio"
          />
          <StatCard
            label="Disponibles"
            value={resumen.disponibles}
            icon={Archive}
            tone="forest"
            href="/cementerio"
          />
          <StatCard
            label="En préstamo"
            value={resumen.prestados}
            icon={Timer}
            tone="amber"
            href="/prestamos"
          />
          <StatCard
            label="No disponibles"
            value={noDisponibles}
            hint={`${resumen.inhabilitados} inhabilitados · ${resumen.mantenimiento} en mantenimiento · ${resumen.reservados} reservados`}
            icon={Landmark}
            tone="ash"
          />
        </div>
      </section>

      <section
        aria-labelledby="alertas-heading"
        className="ui-surface border-forest/20 bg-[color-mix(in_oklab,#34785c_4%,#f2f1ed)] p-5 md:p-6"
      >
        <SectionHeader
          id="alertas-heading"
          title="Requiere atención"
          variant="emphasis"
          description="Préstamos, plazos de 10 años, documentación y nichos por completar."
        />

        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <AlertCard
            href="/prestamos?filtro=vencidos"
            label="Préstamos vencidos"
            value={conteos.prestamosVencidos}
            icon={Timer}
            tone={conteos.prestamosVencidos > 0 ? "danger" : "neutral"}
          />
          <AlertCard
            href="/prestamos?filtro=proximos"
            label="Próximos a vencer (30 días)"
            value={conteos.prestamosProximos}
            icon={Clock}
            tone={conteos.prestamosProximos > 0 ? "warning" : "neutral"}
          />
          <AlertCard
            href="/reportes"
            label="Documentación pendiente"
            value={conteos.documentacionPendiente}
            icon={FileWarning}
            tone={conteos.documentacionPendiente > 0 ? "warning" : "neutral"}
          />
          <AlertCard
            href="/cementerio"
            label="10 años cumplidos"
            value={conteos.diezAnios}
            icon={Clock}
            tone={conteos.diezAnios > 0 ? "warning" : "neutral"}
          />
          <AlertCard
            href="/cementerio"
            label="Ocupados sin datos"
            value={conteos.nichosSinDatos}
            icon={HelpCircle}
            tone={conteos.nichosSinDatos > 0 ? "warning" : "neutral"}
          />
        </div>

        <AlertList alertas={alertas} />
      </section>

      <section aria-labelledby="accesos-heading">
        <SectionHeader
          id="accesos-heading"
          title="Acciones rápidas"
          description="Lo más habitual en el día a día."
        />
        <QuickActionGrid items={quick} />
      </section>
    </div>
  );
}
