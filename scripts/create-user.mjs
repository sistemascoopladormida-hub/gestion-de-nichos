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
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/\r$/, "");
    }
    break;
  }
}

loadEnv();

const nombre = process.argv.find((a) => a.startsWith("--nombre="))?.split("=")[1];
const apellido = process.argv.find((a) => a.startsWith("--apellido="))?.split("=")[1];
const usuario = process.argv.find((a) => a.startsWith("--usuario="))?.split("=")[1];
const password = process.argv.find((a) => a.startsWith("--password="))?.split("=")[1];
const pendiente = process.argv.includes("--pendiente");
const rol =
  process.argv.find((a) => a.startsWith("--rol="))?.split("=")[1] ?? "OPERADOR";

if (!nombre || !apellido || !usuario) {
  console.error(
    "Uso: node scripts/create-user.mjs --nombre=... --apellido=... --usuario=... [--password=***] [--pendiente] [--rol=OPERADOR|ADMINISTRADOR]",
  );
  console.error("  --pendiente: sin contraseña; el usuario la crea en /activar-cuenta");
  process.exit(1);
}

if (!pendiente && !password) {
  console.error("Indique --password=*** o --pendiente para autogestión de contraseña.");
  process.exit(1);
}

if (!["OPERADOR", "ADMINISTRADOR"].includes(rol)) {
  console.error("ROL debe ser OPERADOR o ADMINISTRADOR");
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

const pool = await sql.connect(config);

const exists = await pool
  .request()
  .input("usuario", sql.VarChar(50), usuario)
  .query(`SELECT ID_USUARIO FROM dbo.USUARIOS WHERE USUARIO = @usuario`);

if (exists.recordset.length === 0) {
  if (pendiente) {
    await pool
      .request()
      .input("nombre", sql.NVarChar(100), nombre)
      .input("apellido", sql.NVarChar(100), apellido)
      .input("usuario", sql.VarChar(50), usuario)
      .input("rol", sql.VarChar(20), rol)
      .query(`
        INSERT INTO dbo.USUARIOS (NOMBRE, APELLIDO, USUARIO, ROL, PASSWORD_HASH, PASSWORD_SALT)
        VALUES (@nombre, @apellido, @usuario, @rol, NULL, NULL)
      `);
    console.log("Usuario creado (pendiente de contraseña):", usuario, `(${rol})`);
    console.log("Activación: /activar-cuenta?usuario=" + encodeURIComponent(usuario));
  } else {
    const hash = await bcrypt.hash(password, 12);
    await pool
      .request()
      .input("nombre", sql.NVarChar(100), nombre)
      .input("apellido", sql.NVarChar(100), apellido)
      .input("usuario", sql.VarChar(50), usuario)
      .input("rol", sql.VarChar(20), rol)
      .input("hash", sql.VarBinary(256), Buffer.from(hash, "utf8"))
      .query(`
        INSERT INTO dbo.USUARIOS (NOMBRE, APELLIDO, USUARIO, ROL, PASSWORD_HASH, PASSWORD_SALT)
        VALUES (@nombre, @apellido, @usuario, @rol, @hash, NULL)
      `);
    console.log("Usuario creado:", usuario, `(${rol})`);
  }
} else if (pendiente) {
  console.log("Usuario ya existía:", usuario, "(sin cambios)");
} else {
  const hash = await bcrypt.hash(password, 12);
  await pool
    .request()
    .input("usuario", sql.VarChar(50), usuario)
    .input("hash", sql.VarBinary(256), Buffer.from(hash, "utf8"))
    .query(`UPDATE dbo.USUARIOS SET PASSWORD_HASH = @hash WHERE USUARIO = @usuario`);
  console.log("Usuario ya existía; contraseña actualizada:", usuario);
}

await pool.close();
