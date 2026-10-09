import { ReportesView } from "@/components/reportes/ReportesView";
import { hasPermission } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";

export default async function ReportesPage() {
  const user = await getSessionUser();
  const canExport = user != null && hasPermission(user, "reportes:export");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-coop-primary">Reportes</h1>
      <p className="text-sm text-slate-600">
        Consultas operativas con exportación CSV (solo administradora).
      </p>
      <ReportesView canExport={canExport} />
    </div>
  );
}
