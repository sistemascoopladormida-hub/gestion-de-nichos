import { getCementerioDbConfig } from "./config";
import { getPool } from "./pool";

const POOL_KEY = "cementerio";

export async function getCementerioPool() {
  return getPool(POOL_KEY, getCementerioDbConfig());
}
