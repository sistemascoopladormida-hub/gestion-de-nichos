import { NextResponse } from "next/server";
import {
  isSessionUser,
  requirePermissionApi,
} from "@/lib/auth/requireSession";
import {
  reporteDiezAnios,
  reporteDocumentacion,
  reporteFallecidos,
  reporteOcupacionPorPabellon,
  reportePrestamos,
} from "@/lib/repositories/reportes";
import { rowsToCsv } from "@/lib/utils/csv";

type Ctx = { params: Promise<{ tipo: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const exportCsv = new URL(request.url).searchParams.get("format") === "csv";
  const perm = exportCsv ? "reportes:export" : "reportes:view";
  const session = await requirePermissionApi(perm);
  if (!isSessionUser(session)) return session;

  const tipo = (await ctx.params).tipo;
  const sp = new URL(request.url).searchParams;
  let rows: Record<string, unknown>[] = [];

  switch (tipo) {
    case "ocupacion-pabellon":
      rows = (await reporteOcupacionPorPabellon()) as Record<string, unknown>[];
      break;
    case "fallecidos":
      rows = (await reporteFallecidos({
        q: sp.get("q") ?? undefined,
        pabellon: sp.get("pabellon") ?? undefined,
        soloPfc: sp.get("pfc") === "1",
        conPrestamo: sp.get("prestamo") === "1",
      })) as Record<string, unknown>[];
      break;
    case "prestamos":
      rows = (await reportePrestamos(sp.get("filtro") ?? undefined)) as Record<
        string,
        unknown
      >[];
      break;
    case "diez-anios":
      rows = (await reporteDiezAnios(
        (sp.get("modo") as "cumplidos" | "proximos" | "todos") ?? "todos",
      )) as Record<string, unknown>[];
      break;
    case "documentacion":
      rows = (await reporteDocumentacion(
        sp.get("con") === "si" ? true : sp.get("con") === "no" ? false : null,
      )) as Record<string, unknown>[];
      break;
    default:
      return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
  }

  if (exportCsv) {
    const csv = rowsToCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${tipo}.csv"`,
      },
    });
  }

  return NextResponse.json({ rows });
}
