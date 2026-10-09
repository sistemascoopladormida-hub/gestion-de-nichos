import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold text-ink">Página no encontrada</h1>
      <p className="text-driftwood">El recurso que busca no existe o fue movido.</p>
      <Link href="/dashboard" className="ui-btn-primary px-5 py-2.5">
        Volver al inicio
      </Link>
    </div>
  );
}
