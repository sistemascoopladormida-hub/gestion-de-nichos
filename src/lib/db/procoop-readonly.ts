import { getProcoopDbConfig } from "./config";
import { getPool } from "./pool";

const POOL_KEY = "procoop_readonly";

/** Conexión de solo lectura a PR_DORM — permisos deben limitarse en el servidor SQL. */
export async function getProcoopReadPool() {
  return getPool(POOL_KEY, getProcoopDbConfig());
}
