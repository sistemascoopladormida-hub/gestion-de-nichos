import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearSessionCookieOptions } from "@/lib/auth/session";

export async function POST() {
  const store = await cookies();
  store.set(clearSessionCookieOptions());
  return NextResponse.json({ ok: true });
}
