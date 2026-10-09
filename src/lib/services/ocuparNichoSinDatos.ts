import sql from "mssql";
import { getCementerioPool } from "@/lib/db/cementerio";
import { toSqlDate } from "@/lib/db/sqlParams";
import {
  FALLECIDO_SIN_DATOS_APELLIDO,
  FALLECIDO_SIN_DATOS_NOMBRE,
} from "@/lib/constants/fallecido";
import { TIPO_OCUPACION_PFC } from "@/lib/ocupaciones/tipos";
import {
  assertNichoDisponible,
  marcarNichoOcupado,
} from "@/lib/repositories/nichos";

export async function ocuparNichoSinDatos(input: {
  idNicho: number;
  fechaInicio: string;
  idUsuario: number | null;
}) {
  const fechaInicio = toSqlDate(input.fechaInicio);
  if (!fechaInicio) {
    throw new Error("La fecha de sepultura no es válida");
  }

  const pool = await getCementerioPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    await assertNichoDisponible(tx, input.idNicho);

    const fInsert = await new sql.Request(tx)
      .input("apellido", sql.NVarChar(150), FALLECIDO_SIN_DATOS_APELLIDO)
      .input("nombre", sql.NVarChar(150), FALLECIDO_SIN_DATOS_NOMBRE)
      .input("usuario", sql.Int, input.idUsuario)
      .query(`
        INSERT INTO dbo.FALLECIDOS (
          APELLIDO, NOMBRE, DATOS_INCOMPLETOS, OBSERVACIONES, USUARIO_ALTA
        )
        OUTPUT INSERTED.ID_FALLECIDO
        VALUES (
          @apellido, @nombre, 1,
          N'Ocupación registrada sin datos filiatorios. Completar cuando se disponga de la información.',
          @usuario
        )
      `);

    const idFallecido = Number(fInsert.recordset[0].ID_FALLECIDO);

    const insert = await new sql.Request(tx)
      .input("idNicho", sql.Int, input.idNicho)
      .input("idFallecido", sql.Int, idFallecido)
      .input("fechaInicio", sql.Date, fechaInicio)
      .input("tipo", sql.VarChar(30), TIPO_OCUPACION_PFC)
      .input("usuario", sql.Int, input.idUsuario)
      .query(`
        INSERT INTO dbo.OCUPACIONES_NICHO (
          ID_NICHO, ID_FALLECIDO, FECHA_INICIO, TIPO_OCUPACION, ESTADO, USUARIO_ALTA
        )
        OUTPUT INSERTED.ID_OCUPACION
        VALUES (@idNicho, @idFallecido, @fechaInicio, @tipo, 'ACTIVO', @usuario)
      `);

    const idOcupacion = Number(insert.recordset[0].ID_OCUPACION);
    await marcarNichoOcupado(tx, input.idNicho);

    await tx.commit();

    return {
      idOcupacion,
      idFallecido,
      fallecidoNombre: `${FALLECIDO_SIN_DATOS_APELLIDO}, ${FALLECIDO_SIN_DATOS_NOMBRE}`,
      fechaSepultura: input.fechaInicio,
      estadoVisual: "OCUPADO_SIN_DATOS" as const,
    };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}
