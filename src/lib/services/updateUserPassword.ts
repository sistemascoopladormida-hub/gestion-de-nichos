import sql from "mssql";
import { getCementerioPool } from "@/lib/db/cementerio";
import { hashPassword } from "@/lib/auth/password";

export async function getUsuarioPasswordState(usuario: string): Promise<{
  idUsuario: number;
  activo: boolean;
  hasPassword: boolean;
} | null> {
  const pool = await getCementerioPool();
  const result = await pool
    .request()
    .input("usuario", sql.VarChar(50), usuario.trim())
    .query(`
      SELECT ID_USUARIO, ACTIVO, PASSWORD_HASH
      FROM dbo.USUARIOS WHERE USUARIO = @usuario
    `);
  const row = result.recordset[0] as {
    ID_USUARIO: number;
    ACTIVO: boolean;
    PASSWORD_HASH: Buffer | null;
  };
  if (!row) return null;
  const hasPassword =
    row.PASSWORD_HASH != null && row.PASSWORD_HASH.length > 0;
  return {
    idUsuario: row.ID_USUARIO,
    activo: row.ACTIVO,
    hasPassword,
  };
}

export async function setUserPassword(input: {
  idUsuario: number;
  plainPassword: string;
  onlyIfMissing?: boolean;
}): Promise<void> {
  const pool = await getCementerioPool();
  const hash = await hashPassword(input.plainPassword);

  if (input.onlyIfMissing) {
    const updated = await pool
      .request()
      .input("id", sql.Int, input.idUsuario)
      .input("hash", sql.VarBinary(256), hash)
      .query(`
        UPDATE dbo.USUARIOS SET PASSWORD_HASH = @hash
        WHERE ID_USUARIO = @id
          AND (PASSWORD_HASH IS NULL OR DATALENGTH(PASSWORD_HASH) = 0)
      `);
    if (updated.rowsAffected[0] === 0) {
      throw new Error(
        "La contraseña ya fue definida. Use «Cambiar contraseña» si desea actualizarla.",
      );
    }
    return;
  }

  await pool
    .request()
    .input("id", sql.Int, input.idUsuario)
    .input("hash", sql.VarBinary(256), hash)
    .query(`UPDATE dbo.USUARIOS SET PASSWORD_HASH = @hash WHERE ID_USUARIO = @id`);
}
