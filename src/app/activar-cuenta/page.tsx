import Image from "next/image";
import { Suspense } from "react";
import { PasswordSelfServiceForm } from "@/components/auth/PasswordSelfServiceForm";

type Props = { searchParams: Promise<{ usuario?: string }> };

async function ActivarContent({ searchParams }: Props) {
  const params = await searchParams;
  const usuario = params.usuario?.trim() ?? "";

  return (
    <PasswordSelfServiceForm
      mode="setup"
      initialUsuario={usuario}
      usuarioReadOnly={Boolean(usuario)}
    />
  );
}

export default function ActivarCuentaPage(props: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment px-4">
      <div className="ui-card w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/logocooptransparente.png" alt="" width={72} height={72} />
          <p className="ui-eyebrow">Primera vez</p>
          <h1 className="font-serif text-3xl font-normal leading-tight tracking-tight md:text-4xl">
            Activar cuenta
          </h1>
          <p className="text-sm text-driftwood">
            Cree su contraseña personal. Luego ingresará al sistema automáticamente.
          </p>
        </div>
        <Suspense fallback={<p className="text-sm text-driftwood">Cargando…</p>}>
          <ActivarContent searchParams={props.searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
