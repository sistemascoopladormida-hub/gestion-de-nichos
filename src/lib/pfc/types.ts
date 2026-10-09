export type SocioPfc = {
  apellidos: string;
  telefono: string | null;
  movil: string | null;
  codSoc: string;
  numeroCuenta: string | null;
  numDni: string | null;
  cdi: string | null;
  obsPostal: string | null;
  email: string | null;
  fechaNacimiento: Date | null;
  adherenteCodigo: string | null;
  adherenteNombre: string | null;
  vinculo: string | null;
  dniAdherente: string | null;
  desCat: string | null;
  fechaAlta: Date | null;
  fechaBaja: Date | null;
  esMigrado: boolean;
  estadoServicio: string;
  servicioActivo: boolean;
};

export type BuscarSocioPfcParams = {
  dni?: string;
  codSoc?: string;
  numeroCuenta?: string;
  apellido?: string;
  limite?: number;
};
