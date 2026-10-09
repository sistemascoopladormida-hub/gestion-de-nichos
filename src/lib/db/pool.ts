import sql, { type config as MssqlConfig, ConnectionPool } from "mssql";
import type { CementerioDbConfig } from "./config";

const pools = new Map<string, ConnectionPool>();

function toMssqlConfig(cfg: CementerioDbConfig): MssqlConfig {
  return {
    server: cfg.server,
    database: cfg.database,
    user: cfg.user,
    password: cfg.password,
    options: {
      encrypt: cfg.encrypt ?? true,
      trustServerCertificate: cfg.trustServerCertificate ?? false,
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30_000 },
  };
}

export async function getPool(
  key: string,
  cfg: CementerioDbConfig,
): Promise<ConnectionPool> {
  const existing = pools.get(key);
  if (existing?.connected) return existing;

  const pool = new sql.ConnectionPool(toMssqlConfig(cfg));
  pool.on("error", (err) => {
    console.error(`[db:${key}] pool error`, err);
    pools.delete(key);
  });
  await pool.connect();
  pools.set(key, pool);
  return pool;
}
