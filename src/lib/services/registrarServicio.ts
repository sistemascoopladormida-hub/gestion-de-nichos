import sql from "mssql";
import { getCementerioPool } from "@/lib/db/cementerio";
import { toOptionalString, toSqlDate } from "@/lib/db/sqlParams";
import type { SocioPfc } from "@/lib/pfc/types";
import {
  TIPO_OCUPACION_PFC,
  TIPO_OCUPACION_PRESTAMO,
} from "@/lib/ocupaciones/tipos";
import {
  assertNichoDisponible,
  marcarNichoOcupado,
} from "@/lib/repositories/nichos";
import {
  createFallecido,
  type FallecidoInput,
} from "@/lib/repositories/fallecidos";

export type RegistrarServicioInput = {
  fallecido: FallecidoInput;
  esPfc: boolean;
  pfcSnapshot?: SocioPfc | null;
  tipoServicio: string;
  fechaServicio: string;
  fechaSepultura?: string | null;
  atendidoPor: string;
  observaciones?: string | null;
  ubicacion: {
    tipo: "PABELLON" | "EXTERNA";
    idNicho?: number;
    externa?: {
      descripcion: string;
      sector?: string | null;
      referencia?: string | null;
      fechaSepultura?: string | null;
      observaciones?: string | null;
    };
  };
  prestamo?: {
    garante: SocioPfc;
  };
};

function addMonths(dateStr: string, months: number): Date {
  const base = toSqlDate(dateStr);
  if (!base) throw new Error("Fecha inválida para calcular vencimiento");
  const d = new Date(base.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function registrarServicio(
  input: RegistrarServicioInput,
  idUsuario: number | null,
): Promise<{ idServicio: number; idFallecido: number }> {
  const pool = await getCementerioPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const idFallecido = await createFallecido(tx, input.fallecido, idUsuario);

    let idOcupacion: number | null = null;
    let idUbicacionExterna: number | null = null;
    const fechaSepulturaStr =
      input.fechaSepultura?.trim() ||
      (input.ubicacion.tipo === "PABELLON"
        ? input.fechaServicio
        : input.ubicacion.externa?.fechaSepultura ?? input.fechaServicio);
    const fechaSepultura = toSqlDate(fechaSepulturaStr);
    if (!fechaSepultura) {
      throw new Error("La fecha de sepultura no es válida");
    }
    const fechaServicio = toSqlDate(input.fechaServicio);
    if (!fechaServicio) {
      throw new Error("La fecha del servicio no es válida");
    }

    if (input.ubicacion.tipo === "PABELLON") {
      const idNicho = input.ubicacion.idNicho;
      if (!idNicho) throw new Error("Debe seleccionar un nicho");
      await assertNichoDisponible(tx, idNicho);

      const tipoOcup =
        input.prestamo != null ? TIPO_OCUPACION_PRESTAMO : TIPO_OCUPACION_PFC;
      const fechaVencOcup = input.prestamo
        ? addMonths(fechaSepulturaStr, 6)
        : null;

      const ocupResult = await new sql.Request(tx)
        .input("idNicho", sql.Int, idNicho)
        .input("idFallecido", sql.Int, idFallecido)
        .input("fechaInicio", sql.Date, fechaSepultura)
        .input("tipo", sql.VarChar(30), tipoOcup)
        .input("fechaVenc", sql.Date, fechaVencOcup)
        .input("usuario", sql.Int, idUsuario)
        .query(`
          INSERT INTO dbo.OCUPACIONES_NICHO (
            ID_NICHO, ID_FALLECIDO, FECHA_INICIO, TIPO_OCUPACION,
            FECHA_VENCIMIENTO, ESTADO, USUARIO_ALTA
          )
          OUTPUT INSERTED.ID_OCUPACION
          VALUES (@idNicho, @idFallecido, @fechaInicio, @tipo, @fechaVenc, 'ACTIVO', @usuario)
        `);
      idOcupacion = Number(ocupResult.recordset[0].ID_OCUPACION);
      await marcarNichoOcupado(tx, idNicho);

      if (input.prestamo) {
        const g = input.prestamo.garante;
        const garResult = await new sql.Request(tx)
          .input("codSoc", sql.VarChar(20), g.codSoc)
          .input("cuenta", sql.VarChar(30), g.numeroCuenta)
          .input("dni", sql.VarChar(20), g.numDni)
          .input("nombre", sql.NVarChar(200), g.apellidos)
          .input(
            "tel",
            sql.VarChar(50),
            toOptionalString(g.telefono ?? g.movil ?? null),
          )
          .input("email", sql.VarChar(150), toOptionalString(g.email))
          .input("fechaAlta", sql.Date, toSqlDate(g.fechaAlta))
          .input("estado", sql.NVarChar(50), g.estadoServicio)
          .input("fechaConsulta", sql.DateTime2, new Date())
          .query(`
            INSERT INTO dbo.GARANTES (
              COD_SOC_SNAPSHOT, NUMERO_CUENTA_SNAPSHOT, DNI, NOMBRE, TELEFONO, EMAIL,
              FECHA_ALTA_PFC_SNAPSHOT, ESTADO_PFC_SNAPSHOT, FECHA_CONSULTA_PFC
            )
            OUTPUT INSERTED.ID_GARANTE
            VALUES (@codSoc, @cuenta, @dni, @nombre, @tel, @email, @fechaAlta, @estado, @fechaConsulta)
          `);
        const idGarante = Number(garResult.recordset[0].ID_GARANTE);
        const fechaVenc = addMonths(fechaSepulturaStr, 6);

        await new sql.Request(tx)
          .input("idOcup", sql.Int, idOcupacion)
          .input("idGar", sql.Int, idGarante)
          .input("inicio", sql.Date, fechaSepultura)
          .input("venc", sql.Date, fechaVenc)
          .input("usuario", sql.Int, idUsuario)
          .query(`
            INSERT INTO dbo.PRESTAMOS_NICHO (
              ID_OCUPACION, ID_GARANTE, FECHA_INICIO, FECHA_VENCIMIENTO, ESTADO, USUARIO_ALTA
            )
            VALUES (@idOcup, @idGar, @inicio, @venc, 'ACTIVO', @usuario)
          `);
      }
    } else {
      const ext = input.ubicacion.externa;
      if (!ext?.descripcion?.trim()) {
        throw new Error("Indique la descripción de la ubicación externa");
      }
      const extResult = await new sql.Request(tx)
        .input("idFallecido", sql.Int, idFallecido)
        .input("desc", sql.NVarChar(300), ext.descripcion.trim())
        .input("sector", sql.NVarChar(150), toOptionalString(ext.sector ?? null))
        .input("ref", sql.NVarChar(200), toOptionalString(ext.referencia ?? null))
        .input(
          "fecha",
          sql.Date,
          toSqlDate(ext.fechaSepultura ?? fechaSepulturaStr) ?? fechaSepultura,
        )
        .input(
          "obs",
          sql.NVarChar(sql.MAX),
          toOptionalString(ext.observaciones ?? null),
        )
        .input("usuario", sql.Int, idUsuario)
        .query(`
          INSERT INTO dbo.UBICACIONES_EXTERNAS (
            ID_FALLECIDO, DESCRIPCION, SECTOR, REFERENCIA, FECHA_SEPULTURA, OBSERVACIONES, USUARIO_ALTA
          )
          OUTPUT INSERTED.ID_UBICACION_EXTERNA
          VALUES (@idFallecido, @desc, @sector, @ref, @fecha, @obs, @usuario)
        `);
      idUbicacionExterna = Number(extResult.recordset[0].ID_UBICACION_EXTERNA);
    }

    const snap = input.pfcSnapshot;
    const servResult = await new sql.Request(tx)
      .input("idFallecido", sql.Int, idFallecido)
      .input("idOcup", sql.Int, idOcupacion)
      .input("idExt", sql.Int, idUbicacionExterna)
      .input("tipo", sql.NVarChar(100), input.tipoServicio)
      .input("fecha", sql.Date, fechaServicio)
      .input("atendido", sql.NVarChar(150), input.atendidoPor)
      .input("esPfc", sql.Bit, input.esPfc)
      .input("codSoc", sql.VarChar(20), snap?.codSoc ?? null)
      .input("cuenta", sql.VarChar(30), snap?.numeroCuenta ?? null)
      .input("dniPfc", sql.VarChar(20), snap?.numDni ?? null)
      .input("nombrePfc", sql.NVarChar(200), snap?.apellidos ?? null)
      .input("fechaAltaPfc", sql.Date, toSqlDate(snap?.fechaAlta ?? null))
      .input("estadoPfc", sql.NVarChar(50), snap?.estadoServicio ?? null)
      .input("fechaConsulta", sql.DateTime2, snap ? new Date() : null)
      .input(
        "obs",
        sql.NVarChar(sql.MAX),
        toOptionalString(input.observaciones ?? null),
      )
      .input("usuario", sql.Int, idUsuario)
      .query(`
        INSERT INTO dbo.SERVICIOS_CEMENTERIO (
          ID_FALLECIDO, ID_OCUPACION, ID_UBICACION_EXTERNA, TIPO_SERVICIO, FECHA_SERVICIO,
          ATENDIDO_POR, ES_PFC, COD_SOC_SNAPSHOT, NUMERO_CUENTA_SNAPSHOT, DNI_PFC_SNAPSHOT,
          NOMBRE_PFC_SNAPSHOT, FECHA_ALTA_PFC_SNAPSHOT, ESTADO_PFC_SNAPSHOT, FECHA_CONSULTA_PFC,
          OBSERVACIONES, USUARIO_REGISTRO
        )
        OUTPUT INSERTED.ID_SERVICIO
        VALUES (
          @idFallecido, @idOcup, @idExt, @tipo, @fecha, @atendido, @esPfc,
          @codSoc, @cuenta, @dniPfc, @nombrePfc, @fechaAltaPfc, @estadoPfc, @fechaConsulta,
          @obs, @usuario
        )
      `);

    const idServicio = Number(servResult.recordset[0].ID_SERVICIO);
    await tx.commit();
    return { idServicio, idFallecido };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}
