import { redirect } from "next/navigation";
import { AuditoriaView } from "@/components/auditoria/AuditoriaView";
import { hasPermission } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";

export default async function AuditoriaPage() {
  const user = await getSessionUser();
  if (!user || !hasPermission(user, "auditoria:view")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-coop-primary">Auditoría</h1>
      <p className="text-sm text-slate-600">
        Registro de acciones administrativas y operativas del sistema.
      </p>
      <AuditoriaView />
    </div>
  );
}
