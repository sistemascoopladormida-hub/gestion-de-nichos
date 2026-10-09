import { ServicioWizard } from "@/components/servicios/ServicioWizard";

export default function NuevoServicioPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-coop-primary">Nuevo servicio de sepelio</h1>
      <ServicioWizard />
    </div>
  );
}
