export type NichoEstadoVisual =
  | "DISPONIBLE"
  | "OCUPADO"
  | "OCUPADO_SIN_DATOS"
  | "PRESTAMO"
  | "INHABILITADO"
  | "MANTENIMIENTO"
  | "RESERVADO";

export type PabellonResumen = {
  idPabellon: number;
  codigo: string;
  nombre: string;
  ubicacion: string;
  totalNichos: number;
  columnasMapa: number;
  filasMapa: number;
  ocupados: number;
  disponibles: number;
  prestados: number;
};

export type NichoMapa = {
  idNicho: number;
  numero: number;
  fila: number;
  columna: number;
  estadoVisual: NichoEstadoVisual;
  fallecidoNombre: string | null;
  idFallecido: number | null;
  idOcupacion: number | null;
  fechaSepultura: string | null;
  observaciones?: string | null;
  idPrestamo?: number | null;
  fechaVencimientoPrestamo?: string | null;
  garanteNombre?: string | null;
};

export type DashboardResumen = {
  totalPabellones: number;
  totalNichos: number;
  ocupados: number;
  disponibles: number;
  prestados: number;
  mantenimiento: number;
  inhabilitados: number;
  reservados: number;
};

export type AlertaItem = {
  tipo:
    | "PRESTAMO_VENCIDO"
    | "PRESTAMO_PROXIMO"
    | "DIEZ_ANIOS"
    | "DOCUMENTACION"
    | "NICHO_SIN_DATOS";
  titulo: string;
  detalle: string;
  href: string;
};

export type SessionUser = {
  idUsuario: number;
  nombre: string;
  apellido: string;
  usuario: string;
  rol: "ADMINISTRADOR" | "OPERADOR";
};
