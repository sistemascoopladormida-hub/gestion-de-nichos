import { NextResponse } from "next/server";
import { getSessionUser } from "./session";
import type { SessionUser } from "@/types/domain";
import { mapErrorMessage } from "@/lib/utils/format";
import {
  ForbiddenError,
  hasPermission,
  type Permission,
} from "./permissions";

export async function requireSessionApi(): Promise<
  SessionUser | NextResponse
> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return user;
}

export function isSessionUser(
  value: SessionUser | NextResponse,
): value is SessionUser {
  return "idUsuario" in value;
}

export async function requirePermissionApi(
  permission: Permission,
): Promise<SessionUser | NextResponse> {
  const session = await requireSessionApi();
  if (!isSessionUser(session)) return session;
  if (!hasPermission(session, permission)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  return session;
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  if (err instanceof Error) {
    return NextResponse.json({ error: mapErrorMessage(err) }, { status: 400 });
  }
  const mapped = mapErrorMessage(err);
  if (mapped !== String(err)) {
    return NextResponse.json({ error: mapped }, { status: 400 });
  }
  return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
}
