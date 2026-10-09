import { NextResponse } from "next/server";
import { isSessionUser, requireSessionApi } from "@/lib/auth/requireSession";
import { listNichosMapaByPabellonCodigo } from "@/lib/repositories/pabellones";

type Ctx = { params: Promise<{ codigo: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await requireSessionApi();
  if (!isSessionUser(session)) return session;
  const codigo = (await ctx.params).codigo;
  const nichos = await listNichosMapaByPabellonCodigo(codigo);
  return NextResponse.json({ nichos });
}
