import { NextResponse } from "next/server";
import { isSessionUser, requireSessionApi } from "@/lib/auth/requireSession";
import { listPabellonesResumen } from "@/lib/repositories/pabellones";

export async function GET() {
  const session = await requireSessionApi();
  if (!isSessionUser(session)) return session;
  const rows = await listPabellonesResumen();
  return NextResponse.json({ rows });
}
