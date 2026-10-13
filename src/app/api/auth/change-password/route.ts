import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit/logAudit";
import { verifyPassword } from "@/lib/auth/password";
import {
  handleApiError,
  isSessionUser,
  requireSessionApi,
} from "@/lib/auth/requireSession";
import { getCementerioPool } from "@/lib/db/cementerio";
import { setUserPassword } from "@/lib/services/updateUserPassword";
import { cleanEmptyFields } from "@/lib/validations/sanitize";
import { changePasswordBodySchema } from "@/lib/validations/schemas";
import sql from "mssql";

export async function POST(request: Request) {
  const session = await requireSessionApi();
  if (!isSessionUser(session)) return session;

  try {
    const raw = cleanEmptyFields(await request.json());
    const body = changePasswordBodySchema.parse(raw);

    const pool = await getCementerioPool();
    const result = await pool
      .request()
      .input("id", sql.Int, session.idUsuario)
      .query(`
        SELECT PASSWORD_HASH FROM dbo.USUARIOS
        WHERE ID_USUARIO = @id AND ACTIVO = 1
      `);
    const hash = (result.recordset[0] as { PASSWORD_HASH: Buffer | null })
      ?.PASSWORD_HASH;

    const ok = await verifyPassword(body.currentPassword, hash);
    if (!ok) {
      return NextResponse.json(
        { error: "La contraseña actual no es correcta" },
        { status: 400 },
      );
    }

    await setUserPassword({
      idUsuario: session.idUsuario,
      plainPassword: body.password,
    });

    await logAudit({
      idUsuario: session.idUsuario,
      accion: "CHANGE_PASSWORD",
      entidad: "USUARIOS",
      idRegistro: session.idUsuario,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
