import sql from "mssql";
import { getCementerioPool } from "@/lib/db/cementerio";
import { toOptionalString, toSqlDate } from "@/lib/db/sqlParams";
import {
  labelMotivo,
  type CodigoMotivoFinalizacion,
} from "@/lib/ocupaciones/motivos";

export type FinalizarOcupacionInput = {
  idOcupacion: number;
  fechaFin: string;
  codigoMotivo: CodigoMotivoFinalizacion;
  observaciones?: string;
  idUsuario: number;
};

export async function finalizarOcupacion(
  input: FinalizarOcupacionInput,
): Promise<{ idNicho: number }> {
  const pool = await getCementerioPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const req = new sql.Request(tx);
    const current = await req
      .input("id", sql.Int, input.idOcupacion)
      .query(`
        SELECT o.ID_OCUPACION, o.ID_NICHO, o.ESTADO, o.FECHA_INICIO, n.ESTADO AS ESTADO_NICHO
        FROM dbo.OCUPACIONES_NICHO o WITH (UPDLOCK, ROWLOCK)
        INNER JOIN dbo.NICHOS n WITH (UPDLOCK, ROWLOCK) ON n.ID_NICHO = o.ID_NICHO
        WHERE o.ID_OCUPACION = @id
      `);

    const row = current.recordset[0] as {
      ID_OCUPACION: number;
      ID_NICHO: number;
      ESTADO: string;
      FECHA_INICIO: Date;
      ESTADO_NICHO: string;
    };

    if (!row) throw new Error("Ocupación no encontrada");
    if (row.ESTADO !== "ACTIVO") {
      throw new Error("Esta ocupación ya fue finalizada");
    }

    const fechaFin = toSqlDate(input.fechaFin);
    if (!fechaFin) {
      throw new Error("La fecha de finalización no es válida");
    }
    const inicio = new Date(row.FECHA_INICIO);
    if (fechaFin < inicio) {
      throw new Error("La fecha de finalización no puede ser anterior a la sepultura");
    }

    await new sql.Request(tx)
      .input("id", sql.Int, input.idOcupacion)
      .input("fechaFin", sql.Date, fechaFin)
      .input("codigo", sql.VarChar(40), input.codigoMotivo)
      .input("motivo", sql.NVarChar(300), labelMotivo(input.codigoMotivo))
      .input(
        "obs",
        sql.NVarChar(sql.MAX),
        toOptionalString(input.observaciones ?? null),
      )
      .input("usuario", sql.Int, input.idUsuario)
      .query(`
        UPDATE dbo.OCUPACIONES_NICHO SET
          ESTADO = 'FINALIZADO',
          FECHA_FIN = @fechaFin,
          CODIGO_MOTIVO_FINALIZACION = @codigo,
          MOTIVO_FINALIZACION = @motivo,
          OBSERVACIONES = CASE
            WHEN @obs IS NOT NULL AND LEN(@obs) > 0
            THEN CONCAT(ISNULL(OBSERVACIONES, ''), CASE WHEN OBSERVACIONES IS NULL THEN '' ELSE CHAR(10) END, @obs)
            ELSE OBSERVACIONES END,
          USUARIO_FINALIZACION = @usuario,
          FECHA_MODIFICACION = SYSUTCDATETIME()
        WHERE ID_OCUPACION = @id AND ESTADO = 'ACTIVO'
      `);

    await new sql.Request(tx)
      .input("idNicho", sql.Int, row.ID_NICHO)
      .query(`
        UPDATE dbo.NICHOS SET ESTADO = 'DISPONIBLE'
        WHERE ID_NICHO = @idNicho
          AND NOT EXISTS (
            SELECT 1 FROM dbo.OCUPACIONES_NICHO o
            WHERE o.ID_NICHO = @idNicho AND o.ESTADO = 'ACTIVO'
          )
      `);

    await tx.commit();
    return { idNicho: row.ID_NICHO };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}
