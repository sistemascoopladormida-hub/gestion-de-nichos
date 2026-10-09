export const MOTIVOS_FINALIZACION = [
  { codigo: "TRASLADO", label: "Traslado" },
  { codigo: "EXHUMACION", label: "Exhumación" },
  { codigo: "FINALIZACION_ADMINISTRATIVA", label: "Finalización administrativa" },
  { codigo: "ERROR_DE_REGISTRO", label: "Error de registro" },
  { codigo: "OTRO", label: "Otro" },
] as const;

export type CodigoMotivoFinalizacion =
  (typeof MOTIVOS_FINALIZACION)[number]["codigo"];

export function labelMotivo(codigo: string): string {
  return MOTIVOS_FINALIZACION.find((m) => m.codigo === codigo)?.label ?? codigo;
}
