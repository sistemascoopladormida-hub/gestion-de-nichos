"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment px-4">
      <div className="ui-card w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/logocooptransparente.png" alt="" width={72} height={72} />
          <p className="ui-eyebrow">Acceso interno</p>
          <h1 className="font-serif text-3xl md:text-4xl font-normal leading-tight tracking-tight">
            Gestión de Cementerio
          </h1>
          <p className="text-sm text-driftwood italic">Cooperativa San José de la Dormida</p>
        </div>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ usuario, password }),
            });
            const data = await res.json();
            setLoading(false);
            if (!res.ok) {
              if (data.code === "PASSWORD_NOT_SET") {
                router.push(
                  `/activar-cuenta?usuario=${encodeURIComponent(usuario.trim())}`,
                );
                return;
              }
              setError(data.error ?? "No se pudo iniciar sesión");
              return;
            }
            router.push(params.get("next") ?? "/dashboard");
            router.refresh();
          }}
        >
          <label className="block text-sm text-ash">
            Usuario
            <input
              className="ui-input mt-1"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="block text-sm text-ash">
            Contraseña
            <input
              type="password"
              className="ui-input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="text-sm text-crimson">{error}</p> : null}
          <button type="submit" disabled={loading} className="ui-btn-primary w-full">
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
          <p className="border-t border-stone/60 pt-4 text-center text-sm text-driftwood">
            ¿Es su primer acceso?{" "}
            <Link
              href={
                usuario.trim()
                  ? `/activar-cuenta?usuario=${encodeURIComponent(usuario.trim())}`
                  : "/activar-cuenta"
              }
              className="font-medium text-forest hover:underline"
            >
              Crear o activar contraseña
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
