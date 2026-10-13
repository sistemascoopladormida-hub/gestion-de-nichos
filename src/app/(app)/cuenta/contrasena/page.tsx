import { PasswordSelfServiceForm } from "@/components/auth/PasswordSelfServiceForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default function CambiarContrasenaPage() {
  return (
    <div className="ui-stack-page mx-auto max-w-lg">
      <PageHeader
        title="Contraseña"
        description="Actualice su contraseña de acceso al sistema."
      />
      <div className="ui-surface p-6">
        <PasswordSelfServiceForm mode="change" />
      </div>
    </div>
  );
}
