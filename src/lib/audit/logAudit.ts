import sql from "mssql";
import { getCementerioPool } from "@/lib/db/cementerio";

export async function logAudit(input: {
  idUsuario: number | null;
  accion: string;
  entidad: string;
  idRegistro?: string | number | null;
  valorAnterior?: unknown;
  valorNuevo?: unknown;
  ip?: string | null;
}) {
  try {
    const pool = await getCementerioPool();
    await pool
      .request()
      .input("idUsuario", sql.Int, input.idUsuario)
      .input("accion", sql.VarChar(50), input.accion)
      .input("entidad", sql.VarChar(80), input.entidad)
      .input("idRegistro", sql.VarChar(50), input.idRegistro?.toString() ?? null)
      .input(
        "valorAnterior",
        sql.NVarChar(sql.MAX),
        input.valorAnterior != null ? JSON.stringify(input.valorAnterior) : null,
      )
      .input(
        "valorNuevo",
        sql.NVarChar(sql.MAX),
        input.valorNuevo != null ? JSON.stringify(input.valorNuevo) : null,
      )
      .input("ip", sql.VarChar(45), input.ip ?? null)
      .query(`
        INSERT INTO dbo.AUDITORIA_CEMENTERIO
          (ID_USUARIO, ACCION, ENTIDAD, ID_REGISTRO, VALOR_ANTERIOR, VALOR_NUEVO, IP)
        VALUES (@idUsuario, @accion, @entidad, @idRegistro, @valorAnterior, @valorNuevo, @ip)
      `);
  } catch (err) {
    console.error("[audit]", err);
  }
}
