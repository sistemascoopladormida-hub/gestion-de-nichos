import sql from "mssql";
import { getCementerioPool } from "@/lib/db/cementerio";
import { toOptionalString } from "@/lib/db/sqlParams";

export type EstadoNichoAdmin =
  | "DISPONIBLE"
  | "RESERVADO"
  | "INHABILITADO"
  | "MANTENIMIENTO";

export async function cambiarEstadoAdministrativoNicho(input: {
  idNicho: number;
  estado: EstadoNichoAdmin;
  motivo?: string | null;
  titularReserva?: string | null;
}): Promise<{ estadoVisual: EstadoNichoAdmin }> {
  const pool = await getCementerioPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const check = await new sql.Request(tx)
      .input("id", sql.Int, input.idNicho)
      .query(`
        SELECT n.ESTADO, o.ID_OCUPACION
        FROM dbo.NICHOS n WITH (UPDLOCK, ROWLOCK)
        LEFT JOIN dbo.OCUPACIONES_NICHO o ON o.ID_NICHO = n.ID_NICHO AND o.ESTADO = 'ACTIVO'
        WHERE n.ID_NICHO = @id
      `);
    const row = check.recordset[0] as { ESTADO: string; ID_OCUPACION: number | null };
    if (!row) throw new Error("Nicho no encontrado");

    if (row.ID_OCUPACION && input.estado === "DISPONIBLE") {
      throw new Error(
        "No se puede liberar: el nicho tiene una ocupación activa. Finalice la ocupación primero.",
      );
    }

    if (row.ID_OCUPACION && input.estado !== "DISPONIBLE") {
      throw new Error("El nicho tiene una ocupación activa y no puede cambiar a este estado.");
    }

    const estadosSinOcupacion: EstadoNichoAdmin[] = [
      "DISPONIBLE",
      "RESERVADO",
      "INHABILITADO",
      "MANTENIMIENTO",
    ];
    if (!estadosSinOcupacion.includes(input.estado)) {
      throw new Error("Estado no válido");
    }

    const estadosOrigenAdmin = [
      "DISPONIBLE",
      "RESERVADO",
      "INHABILITADO",
      "MANTENIMIENTO",
    ];
    if (
      input.estado !== "DISPONIBLE" &&
      !estadosOrigenAdmin.includes(row.ESTADO)
    ) {
      throw new Error(`No se puede cambiar desde el estado actual (${row.ESTADO}).`);
    }

    let obs =
      input.estado === "DISPONIBLE"
        ? null
        : toOptionalString(input.motivo ?? null);
    if (input.estado === "RESERVADO" && input.titularReserva?.trim()) {
      const titular = input.titularReserva.trim();
      obs = obs ? `Reserva: ${titular}. ${obs}` : `Reserva: ${titular}`;
    }

    await new sql.Request(tx)
      .input("id", sql.Int, input.idNicho)
      .input("estado", sql.VarChar(20), input.estado)
      .input("obs", sql.NVarChar(500), obs)
      .query(`
        UPDATE dbo.NICHOS SET
          ESTADO = @estado,
          OBSERVACIONES = @obs
        WHERE ID_NICHO = @id
      `);

    await tx.commit();
    return { estadoVisual: input.estado };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}
