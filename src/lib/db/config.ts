import { z } from "zod";

const boolFromEnv = z
  .enum(["true", "false"])
  .optional()
  .transform((v) => v === "true");

const cementerioSchema = z.object({
  server: z.string().min(1),
  database: z.string().min(1),
  user: z.string().min(1),
  password: z.string(),
  encrypt: boolFromEnv,
  trustServerCertificate: boolFromEnv,
});

export type CementerioDbConfig = z.infer<typeof cementerioSchema>;

export function getCementerioDbConfig(): CementerioDbConfig {
  return cementerioSchema.parse({
    server: process.env.CEMENTERIO_DB_SERVER,
    database: process.env.CEMENTERIO_DB_NAME ?? "CEMENTERIO",
    user: process.env.CEMENTERIO_DB_USER,
    password: process.env.CEMENTERIO_DB_PASSWORD ?? "",
    encrypt: process.env.CEMENTERIO_DB_ENCRYPT,
    trustServerCertificate: process.env.CEMENTERIO_DB_TRUST_SERVER_CERTIFICATE,
  });
}

export function getProcoopDbConfig(): CementerioDbConfig {
  return cementerioSchema.parse({
    server: process.env.PROCOOP_DB_SERVER,
    database: process.env.PROCOOP_DB_NAME ?? "PR_DORM",
    user: process.env.PROCOOP_DB_USER,
    password: process.env.PROCOOP_DB_PASSWORD ?? "",
    encrypt: process.env.PROCOOP_DB_ENCRYPT,
    trustServerCertificate: process.env.PROCOOP_DB_TRUST_SERVER_CERTIFICATE,
  });
}

/** Nombre calificado de la vista PFC en PR_DORM (solo lectura). */
export function getPfcViewName(): string {
  const name = process.env.PFC_VIEW_NAME?.trim();
  if (!name) {
    throw new Error(
      "PFC_VIEW_NAME no configurado. Usar vw_socios_adherentes en .env",
    );
  }
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error("PFC_VIEW_NAME contiene caracteres no permitidos");
  }
  return name;
}
