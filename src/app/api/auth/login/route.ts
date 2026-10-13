import sql from "mssql";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getCementerioPool } from "@/lib/db/cementerio";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/logAudit";

const bodySchema = z.object({
  usuario: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const pool = await getCementerioPool();
    const result = await pool
      .request()
      .input("usuario", sql.VarChar(50), body.usuario.trim())
      .query(`
        SELECT ID_USUARIO, NOMBRE, APELLIDO, USUARIO, PASSWORD_HASH, ROL, ACTIVO
        FROM dbo.USUARIOS WHERE USUARIO = @usuario
      `);
    const row = result.recordset[0] as {
      ID_USUARIO: number;
      NOMBRE: string;
      APELLIDO: string;
      USUARIO: string;
      PASSWORD_HASH: Buffer | null;
      ROL: "ADMINISTRADOR" | "OPERADOR";
      ACTIVO: boolean;
    };

    if (!row?.ACTIVO) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 },
      );
    }

    const sinContrasena =
      !row.PASSWORD_HASH || row.PASSWORD_HASH.length === 0;
    if (sinContrasena) {
      return NextResponse.json(
        {
          error:
            "Debe crear su contraseña antes de ingresar. Use «Activar cuenta».",
          code: "PASSWORD_NOT_SET",
        },
        { status: 403 },
      );
    }

    const ok = await verifyPassword(body.password, row.PASSWORD_HASH);
    if (!ok) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 },
      );
    }

    await pool
      .request()
      .input("id", sql.Int, row.ID_USUARIO)
      .query(`UPDATE dbo.USUARIOS SET ULTIMO_ACCESO = SYSUTCDATETIME() WHERE ID_USUARIO = @id`);

    const token = createSessionToken({
      idUsuario: row.ID_USUARIO,
      nombre: row.NOMBRE,
      apellido: row.APELLIDO,
      usuario: row.USUARIO,
      rol: row.ROL,
    });

    const store = await cookies();
    store.set(sessionCookieOptions(token));

    await logAudit({
      idUsuario: row.ID_USUARIO,
      accion: "LOGIN",
      entidad: "USUARIOS",
      idRegistro: row.ID_USUARIO,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
}
