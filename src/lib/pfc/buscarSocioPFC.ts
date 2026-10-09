import sql from "mssql";
import { getPfcViewName } from "@/lib/db/config";
import { getProcoopReadPool } from "@/lib/db/procoop-readonly";
import type { BuscarSocioPfcParams, SocioPfc } from "./types";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;

function mapRow(row: Record<string, unknown>): SocioPfc {
  return {
    apellidos: String(row.APELLIDOS ?? ""),
    telefono: row.TELEFONO != null ? String(row.TELEFONO) : null,
    movil: row.MOVIL != null ? String(row.MOVIL) : null,
    codSoc: String(row.COD_SOC ?? ""),
    numeroCuenta: row.NUMERO_CUENTA != null ? String(row.NUMERO_CUENTA) : null,
    numDni: row.NUM_DNI != null ? String(row.NUM_DNI) : null,
    cdi: row.CDI != null ? String(row.CDI) : null,
    obsPostal: row.OBS_POSTAL != null ? String(row.OBS_POSTAL) : null,
    email: row.EMAIL != null ? String(row.EMAIL) : null,
    fechaNacimiento: row.FECHA_NACIMIENTO
      ? new Date(row.FECHA_NACIMIENTO as string | Date)
      : null,
    adherenteCodigo:
      row.ADHERENTE_CODIGO != null ? String(row.ADHERENTE_CODIGO) : null,
    adherenteNombre:
      row.ADHERENTE_NOMBRE != null ? String(row.ADHERENTE_NOMBRE) : null,
    vinculo: row.VINCULO != null ? String(row.VINCULO) : null,
    dniAdherente:
      row.DNI_ADHERENTE != null ? String(row.DNI_ADHERENTE) : null,
    desCat: row.DES_CAT != null ? String(row.DES_CAT) : null,
    fechaAlta: row.FECHA_ALTA
      ? new Date(row.FECHA_ALTA as string | Date)
      : null,
    fechaBaja: row.FECHA_BAJA
      ? new Date(row.FECHA_BAJA as string | Date)
      : null,
    esMigrado: Boolean(row.ES_MIGRADO),
    estadoServicio: String(row.ESTADO_SERVICIO ?? ""),
    servicioActivo: Boolean(row.SERVICIO_ACTIVO),
  };
}

/**
 * Búsqueda parametrizada de socios PFC en la vista configurada (PR_DORM).
 */
export async function buscarSocioPFC(
  params: BuscarSocioPfcParams,
): Promise<SocioPfc[]> {
  const { dni, codSoc, numeroCuenta, apellido } = params;
  const limite = Math.min(params.limite ?? DEFAULT_LIMIT, MAX_LIMIT);

  const criterios = [dni, codSoc, numeroCuenta, apellido].filter(
    (v) => v != null && String(v).trim() !== "",
  );
  if (criterios.length === 0) {
    return [];
  }

  const viewName = getPfcViewName();
  const pool = await getProcoopReadPool();
  const request = pool.request();

  const where: string[] = [];
  if (dni?.trim()) {
    request.input("dni", sql.VarChar(20), dni.trim());
    where.push("(NUM_DNI = @dni OR DNI_ADHERENTE = @dni)");
  }
  if (codSoc?.trim()) {
    request.input("codSoc", sql.VarChar(20), codSoc.trim());
    where.push("COD_SOC = @codSoc");
  }
  if (numeroCuenta?.trim()) {
    request.input("numeroCuenta", sql.VarChar(30), numeroCuenta.trim());
    where.push("NUMERO_CUENTA = @numeroCuenta");
  }
  if (apellido?.trim()) {
    request.input("apellido", sql.NVarChar(100), `%${apellido.trim()}%`);
    where.push(
      "(APELLIDOS LIKE @apellido OR ADHERENTE_NOMBRE LIKE @apellido)",
    );
  }

  request.input("limite", sql.Int, limite);

  const query = `
    SELECT TOP (@limite)
      APELLIDOS, TELEFONO, MOVIL, COD_SOC, NUMERO_CUENTA, NUM_DNI, CDI,
      OBS_POSTAL, EMAIL, FECHA_NACIMIENTO, ADHERENTE_CODIGO, ADHERENTE_NOMBRE,
      VINCULO, DNI_ADHERENTE, DES_CAT, FECHA_ALTA, FECHA_BAJA, ES_MIGRADO,
      ESTADO_SERVICIO, SERVICIO_ACTIVO
    FROM dbo.[${viewName}]
    WHERE ${where.join(" AND ")}
    ORDER BY APELLIDOS
  `;

  const result = await request.query(query);
  return (result.recordset as Record<string, unknown>[]).map(mapRow);
}
