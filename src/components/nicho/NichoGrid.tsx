import type { NichoEstadoVisual, NichoMapa } from "@/types/domain";
import { NichoTile } from "./NichoTile";

type Props = {
  nichos: NichoMapa[];
  columnas: number;
  filas: number;
  mode?: "link" | "select" | "interactive";
  selectedId?: number | null;
  onSelect?: (nicho: NichoMapa) => void;
  highlightEstados?: Set<NichoEstadoVisual> | null;
};

export function NichoGrid({
  nichos,
  columnas,
  filas,
  mode = "link",
  selectedId,
  onSelect,
  highlightEstados,
}: Props) {
  const byFila = new Map<number, NichoMapa[]>();
  for (const n of nichos) {
    const list = byFila.get(n.fila) ?? [];
    list.push(n);
    byFila.set(n.fila, list);
  }

  const filterActive = highlightEstados && highlightEstados.size > 0;

  return (
    <div className="space-y-4 overflow-x-auto pb-2">
      {Array.from({ length: filas }, (_, i) => i + 1).map((fila) => {
        const row = (byFila.get(fila) ?? []).sort((a, b) => a.columna - b.columna);
        return (
          <div key={fila} className="min-w-[min(100%,640px)]">
            <p className="ui-eyebrow mb-2">Fila {fila}</p>
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}
            >
              {row.map((n) => (
                <NichoTile
                  key={n.idNicho}
                  nicho={n}
                  mode={mode}
                  selected={selectedId === n.idNicho}
                  dimmed={
                    filterActive ? !highlightEstados!.has(n.estadoVisual) : false
                  }
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
