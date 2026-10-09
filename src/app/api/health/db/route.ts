import { NextResponse } from "next/server";
import { getCementerioPool } from "@/lib/db/cementerio";

export async function GET() {
  try {
    const pool = await getCementerioPool();
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM dbo.PABELLONES) AS pabellones,
        (SELECT COUNT(*) FROM dbo.NICHOS) AS nichos
    `);
    const row = result.recordset[0] as { pabellones: number; nichos: number };
    const pabellones = row?.pabellones ?? 0;
    const nichos = row?.nichos ?? 0;
    return NextResponse.json({
      ok: true,
      pabellones,
      nichos,
      esperado: { pabellones: 5, nichos: 292 },
    });
  } catch (error) {
    console.error("[health/db]", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          "No se pudo conectar a CEMENTERIO. Revise .env y migraciones SQL.",
      },
      { status: 503 },
    );
  }
}
