import sql from "mssql";
import { getCementerioPool } from "@/lib/db/cementerio";
import { toSqlDate } from "@/lib/db/sqlParams";
import { TIPO_OCUPACION_PFC } from "@/lib/ocupaciones/tipos";
import {
  assertNichoDisponible,
  marcarNichoOcupado,
} from "@/lib/repositories/nichos";
import { validateFechasFallecido } from "@/lib/utils/dates";
import { toDateOnlyString } from "@/lib/utils/dates";

export type AsignarOcupacionInput = {
  idNicho: number;
  idFallecido: number;
  fechaInicio: string;
  idUsuario: number | null;
};

export async function asignarFallecidoANicho(input: AsignarOcupacionInput) {
  const fechaInicio = toSqlDate(input.fechaInicio);
  if (!fechaInicio) {
    throw new Error("La fecha de sepultura no es válida");
  }

  const pool = await getCementerioPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    await assertNichoDisponible(tx, input.idNicho);

    const fReq = new sql.Request(tx);
    const fRes = await fReq
      .input("idF", sql.Int, input.idFallecido)
      .query(`
        SELECT f.ID_FALLECIDO, f.APELLIDO, f.NOMBRE, f.ACTIVO, f.FECHA_FALLECIMIENTO
        FROM dbo.FALLECIDOS f WITH (UPDLOCK, ROWLOCK)
        WHERE f.ID_FALLECIDO = @idF
      `);
    const fallecido = fRes.recordset[0] as {
      ID_FALLECIDO: number;
      APELLIDO: string;
      NOMBRE: string | null;
      ACTIVO: boolean;
      FECHA_FALLECIMIENTO: Date | null;
    };
    if (!fallecido?.ACTIVO) {
      throw new Error("El fallecido no existe o está inactivo");
    }

    const dateErr = validateFechasFallecido({
      fechaFallecimiento: toDateOnlyString(fallecido.FECHA_FALLECIMIENTO),
      fechaSepultura: input.fechaInicio,
    });
    if (dateErr) {
      throw new Error(dateErr);
    }

    const ocupReq = new sql.Request(tx);
    const ocupRes = await ocupReq
      .input("idF", sql.Int, input.idFallecido)
      .query(`
        SELECT TOP 1 o.ID_OCUPACION, p.NOMBRE AS PABELLON, n.NUMERO
        FROM dbo.OCUPACIONES_NICHO o
        INNER JOIN dbo.NICHOS n ON n.ID_NICHO = o.ID_NICHO
        INNER JOIN dbo.PABELLONES p ON p.ID_PABELLON = n.ID_PABELLON
        WHERE o.ID_FALLECIDO = @idF AND o.ESTADO = 'ACTIVO'
      `);
    const ocupActiva = ocupRes.recordset[0] as
      | { PABELLON: string; NUMERO: number }
      | undefined;
    if (ocupActiva) {
      throw new Error(
        `El fallecido ya tiene un nicho activo (${ocupActiva.PABELLON} — nicho ${ocupActiva.NUMERO}). Finalice esa ocupación antes de reasignar.`,
      );
    }

    const insert = await new sql.Request(tx)
      .input("idNicho", sql.Int, input.idNicho)
      .input("idFallecido", sql.Int, input.idFallecido)
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

    const meta = await new sql.Request(tx)
      .input("idNicho", sql.Int, input.idNicho)
      .query(`
        SELECT n.NUMERO, p.NOMBRE AS PABELLON
        FROM dbo.NICHOS n
        INNER JOIN dbo.PABELLONES p ON p.ID_PABELLON = n.ID_PABELLON
        WHERE n.ID_NICHO = @idNicho
      `);
    const row = meta.recordset[0] as { NUMERO: number; PABELLON: string };

    await tx.commit();

    const nombre = [fallecido.APELLIDO, fallecido.NOMBRE].filter(Boolean).join(", ");
    return {
      idOcupacion,
      idFallecido: fallecido.ID_FALLECIDO,
      fallecidoNombre: nombre,
      numeroNicho: row.NUMERO,
      pabellonNombre: row.PABELLON,
      fechaSepultura: input.fechaInicio,
      estadoVisual: "OCUPADO" as const,
    };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}
