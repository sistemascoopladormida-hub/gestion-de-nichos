import sql from "mssql";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit/logAudit";
import { handleApiError } from "@/lib/auth/requireSession";
import {
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { getCementerioPool } from "@/lib/db/cementerio";
import {
  getUsuarioPasswordState,
  setUserPassword,
} from "@/lib/services/updateUserPassword";
import { cleanEmptyFields } from "@/lib/validations/sanitize";
import { setupPasswordBodySchema } from "@/lib/validations/schemas";

export async function POST(request: Request) {
  try {
    const raw = cleanEmptyFields(await request.json());
    const body = setupPasswordBodySchema.parse(raw);
    const usuario = body.usuario.trim();

    const state = await getUsuarioPasswordState(usuario);
    if (!state?.activo) {
      return NextResponse.json(
        { error: "No se pudo activar la cuenta. Verifique el usuario." },
        { status: 400 },
      );
    }
    if (state.hasPassword) {
      return NextResponse.json(
        {
          error:
            "Esta cuenta ya tiene contraseña. Inicie sesión o use «Cambiar contraseña».",
          code: "PASSWORD_ALREADY_SET",
        },
        { status: 400 },
      );
    }

    await setUserPassword({
      idUsuario: state.idUsuario,
      plainPassword: body.password,
      onlyIfMissing: true,
    });

    const pool = await getCementerioPool();
    const row = await pool
      .request()
      .input("id", sql.Int, state.idUsuario)
      .query(`
        SELECT ID_USUARIO, NOMBRE, APELLIDO, USUARIO, ROL
        FROM dbo.USUARIOS WHERE ID_USUARIO = @id
      `);
    const u = row.recordset[0] as {
      ID_USUARIO: number;
      NOMBRE: string;
      APELLIDO: string;
      USUARIO: string;
      ROL: "ADMINISTRADOR" | "OPERADOR";
    };

    const token = createSessionToken({
      idUsuario: u.ID_USUARIO,
      nombre: u.NOMBRE,
      apellido: u.APELLIDO,
      usuario: u.USUARIO,
      rol: u.ROL,
    });
    const store = await cookies();
    store.set(sessionCookieOptions(token));

    await logAudit({
      idUsuario: u.ID_USUARIO,
      accion: "SETUP_PASSWORD",
      entidad: "USUARIOS",
      idRegistro: u.ID_USUARIO,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
