import { NextResponse } from "next/server";
import {
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";
import { buscarGlobal } from "@/lib/repositories/buscar";

export async function GET(request: Request) {
  const session = await requirePermissionApi("buscar:view");
  if (!isSessionUser(session)) return session;
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const data = await buscarGlobal(q);
  return NextResponse.json(data);
}
