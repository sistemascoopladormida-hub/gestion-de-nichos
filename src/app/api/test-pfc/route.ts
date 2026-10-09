import { NextResponse } from "next/server";
import sql from "mssql";
import { getPfcViewName, getProcoopDbConfig } from "@/lib/db/config";
import { getProcoopReadPool } from "@/lib/db/procoop-readonly";
import { buscarSocioPFC } from "@/lib/pfc/buscarSocioPFC";

/**
 * RUTA TEMPORAL DE DIAGNÓSTICO — eliminar cuando PFC en búsqueda global esté verificado.
 */
export async function GET() {
  const viewName = getPfcViewName();
  const cfg = getProcoopDbConfig();
  const qualifiedView = `[${cfg.database}].[dbo].[${viewName}]`;

  try {
    const pool = await getProcoopReadPool();

    const sample = await pool.request().query(`
      SELECT TOP 5 *
      FROM ${qualifiedView}
    `);

    const columns =
      sample.recordset.length > 0
        ? Object.keys(sample.recordset[0] as object)
        : (
            await pool.request().query(`
              SELECT COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION
              FROM [${cfg.database}].INFORMATION_SCHEMA.COLUMNS
              WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = '${viewName.replace(/'/g, "''")}'
              ORDER BY ORDINAL_POSITION
            `)
          ).recordset;

    const requestLike = pool.request();
    requestLike.input("term", sql.NVarChar(100), "%caminos%");
    const likeCaminos = await requestLike.query(`
      SELECT TOP 10 *
      FROM ${qualifiedView}
      WHERE (
        CAST(APELLIDOS AS NVARCHAR(500)) LIKE @term
        OR CAST(ADHERENTE_NOMBRE AS NVARCHAR(500)) LIKE @term
      )
    `);

    let buscarHelper: Awaited<ReturnType<typeof buscarSocioPFC>> = [];
    let buscarHelperError: string | null = null;
    try {
      buscarHelper = await buscarSocioPFC({ apellido: "caminos", limite: 10 });
    } catch (e) {
      buscarHelperError = e instanceof Error ? e.message : String(e);
      console.error("[test-pfc] buscarSocioPFC(apellido=caminos)", e);
    }

    return NextResponse.json({
      ok: true,
      connection: {
        server: cfg.server,
        database: cfg.database,
        user: cfg.user,
        view: viewName,
        qualifiedView,
        pfcViewNameEnv: process.env.PFC_VIEW_NAME ?? null,
      },
      sampleTop5: {
        rowCount: sample.recordset.length,
        columns:
          sample.recordset.length > 0
            ? Object.keys(sample.recordset[0] as object)
            : columns,
        rows: sample.recordset,
      },
      likeCaminos: {
        rowCount: likeCaminos.recordset.length,
        rows: likeCaminos.recordset,
      },
      buscarSocioPFC_apellido_caminos: {
        rowCount: buscarHelper.length,
        rows: buscarHelper,
        error: buscarHelperError,
      },
      note: "Si likeCaminos tiene filas pero buscarSocioPFC no, revisar columnas/nombres en buscarSocioPFC.ts",
    });
  } catch (err) {
    console.error("[test-pfc]", err);
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return NextResponse.json(
      {
        ok: false,
        error: message,
        stack,
        connection: {
          server: cfg.server,
          database: cfg.database,
          user: cfg.user,
          view: viewName,
        },
      },
      { status: 503 },
    );
  }
}
