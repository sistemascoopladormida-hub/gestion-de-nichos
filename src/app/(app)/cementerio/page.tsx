import { PabellonCard } from "@/components/cementerio/PabellonCard";
import { listPabellonesResumen } from "@/lib/repositories/pabellones";

export default async function CementerioPage() {
  const pabellones = await listPabellonesResumen();

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="ui-eyebrow">Inventario</p>
        <h1 className="font-serif text-5xl md:text-6xl font-normal leading-tight tracking-tight">
          Mapa del cementerio
        </h1>
        <p className="text-driftwood">
          Cinco pabellones administrados por la Cooperativa — seleccione uno para
          asignar nichos o consultar ocupación.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        {pabellones.map((p) => (
          <PabellonCard key={p.codigo} p={p} />
        ))}
      </div>
    </div>
  );
}
