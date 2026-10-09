/** Valores permitidos por CK_OCUP_TIPO en dbo.OCUPACIONES_NICHO */
export const TIPOS_OCUPACION = ["OCUPACION_PFC", "OCUPACION_PRESTAMO"] as const;

export type TipoOcupacion = (typeof TIPOS_OCUPACION)[number];

export const TIPO_OCUPACION_PFC: TipoOcupacion = "OCUPACION_PFC";
export const TIPO_OCUPACION_PRESTAMO: TipoOcupacion = "OCUPACION_PRESTAMO";

export function labelTipoOcupacion(tipo: string): string {
  switch (tipo) {
    case TIPO_OCUPACION_PFC:
      return "Ocupación PFC / definitiva";
    case TIPO_OCUPACION_PRESTAMO:
      return "Ocupación por préstamo";
    default:
      return tipo;
  }
}
