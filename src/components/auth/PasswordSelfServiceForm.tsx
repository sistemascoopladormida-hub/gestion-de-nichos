"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "setup" | "change";

type Props = {
  mode: Mode;
  initialUsuario?: string;
  usuarioReadOnly?: boolean;
};

export function PasswordSelfServiceForm({
  mode,
  initialUsuario = "",
  usuarioReadOnly = false,
}: Props) {
  const router = useRouter();
  const [usuario, setUsuario] = useState(initialUsuario);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url =
        mode === "setup" ? "/api/auth/setup-password" : "/api/auth/change-password";
      const body =
        mode === "setup"
          ? { usuario: usuario.trim(), password, passwordConfirm }
          : { currentPassword, password, passwordConfirm };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar la contraseña");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {mode === "setup" ? (
        <label className="block text-sm text-ash">
          Usuario
          <input
            className="ui-input mt-1"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            readOnly={usuarioReadOnly}
            autoComplete="username"
            required
          />
          <span className="mt-1 block text-xs text-driftwood">
            El administrador le indicó su nombre de usuario (ej. nombre.apellido).
          </span>
        </label>
      ) : (
        <label className="block text-sm text-ash">
          Contraseña actual
          <input
            type="password"
            className="ui-input mt-1"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
      )}

      <label className="block text-sm text-ash">
        {mode === "setup" ? "Nueva contraseña" : "Nueva contraseña"}
        <input
          type="password"
          className="ui-input mt-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <span className="mt-1 block text-xs text-driftwood">Mínimo 8 caracteres.</span>
      </label>

      <label className="block text-sm text-ash">
        Repetir contraseña
        <input
          type="password"
          className="ui-input mt-1"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      {error ? <p className="text-sm text-crimson">{error}</p> : null}

      <button type="submit" disabled={loading} className="ui-btn-primary w-full">
        {loading
          ? "Guardando…"
          : mode === "setup"
            ? "Crear contraseña e ingresar"
            : "Actualizar contraseña"}
      </button>

      {mode === "setup" ? (
        <p className="text-center text-sm text-driftwood">
          ¿Ya tiene contraseña?{" "}
          <Link href="/login" className="font-medium text-forest hover:underline">
            Iniciar sesión
          </Link>
        </p>
      ) : (
        <p className="text-center text-sm text-driftwood">
          <Link href="/dashboard" className="font-medium text-forest hover:underline">
            Volver al inicio
          </Link>
        </p>
      )}
    </form>
  );
}
