import bcrypt from "bcryptjs";
import sql from "mssql";
import { readFileSync, existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(projectRoot, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim();
    }
    break;
  }
}

loadEnv();

const usuario = process.argv.find((a) => a.startsWith("--usuario="))?.split("=")[1];
const password = process.argv.find((a) => a.startsWith("--password="))?.split("=")[1];

if (!usuario || !password) {
  console.error("Uso: node scripts/set-password.mjs --usuario=alejandra.valdez --password=***");
  process.exit(1);
}

const config = {
  server: process.env.CEMENTERIO_DB_SERVER,
  database: process.env.CEMENTERIO_DB_NAME ?? "CEMENTERIO",
  user: process.env.CEMENTERIO_DB_USER,
  password: process.env.CEMENTERIO_DB_PASSWORD ?? "",
  options: {
    encrypt: process.env.CEMENTERIO_DB_ENCRYPT === "true",
    trustServerCertificate: process.env.CEMENTERIO_DB_TRUST_SERVER_CERTIFICATE === "true",
  },
};

const hash = await bcrypt.hash(password, 12);
const pool = await sql.connect(config);
const result = await pool
  .request()
  .input("usuario", sql.VarChar(50), usuario)
  .input("hash", sql.VarBinary(256), Buffer.from(hash, "utf8"))
  .query(`
    UPDATE dbo.USUARIOS SET PASSWORD_HASH = @hash WHERE USUARIO = @usuario
  `);

if (result.rowsAffected[0] === 0) {
  console.error("Usuario no encontrado:", usuario);
  process.exit(1);
}
console.log("Contraseña actualizada para", usuario);
await pool.close();
