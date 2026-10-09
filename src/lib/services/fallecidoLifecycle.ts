import sql from "mssql";
import { getCementerioPool } from "@/lib/db/cementerio";

export type FallecidoRelaciones = {
  servicios: number;
  ocupaciones: number;
  prestamos: number;
  documentos: number;
  ubicacionesExternas: number;
};

export async function contarRelacionesFallecido(
  idFallecido: number,
): Promise<FallecidoRelaciones> {
  const pool = await getCementerioPool();
  const result = await pool.request().input("id", sql.Int, idFallecido).query(`
    SELECT
      (SELECT COUNT(*) FROM dbo.SERVICIOS_CEMENTERIO WHERE ID_FALLECIDO = @id) AS servicios,
      (SELECT COUNT(*) FROM dbo.OCUPACIONES_NICHO WHERE ID_FALLECIDO = @id) AS ocupaciones,
      (SELECT COUNT(*) FROM dbo.PRESTAMOS_NICHO pr
        INNER JOIN dbo.OCUPACIONES_NICHO o ON o.ID_OCUPACION = pr.ID_OCUPACION
        WHERE o.ID_FALLECIDO = @id) AS prestamos,
      (SELECT COUNT(*) FROM dbo.DOCUMENTOS_CEMENTERIO WHERE ID_FALLECIDO = @id) AS documentos,
      (SELECT COUNT(*) FROM dbo.UBICACIONES_EXTERNAS WHERE ID_FALLECIDO = @id) AS ubicacionesExternas
  `);
  const row = result.recordset[0] as Record<string, number>;
  return {
    servicios: Number(row.servicios),
    ocupaciones: Number(row.ocupaciones),
    prestamos: Number(row.prestamos),
    documentos: Number(row.documentos),
    ubicacionesExternas: Number(row.ubicacionesExternas),
  };
}

export function requiereArchivado(rel: FallecidoRelaciones): boolean {
  return (
    rel.servicios > 0 ||
    rel.ocupaciones > 0 ||
    rel.prestamos > 0 ||
    rel.documentos > 0 ||
    rel.ubicacionesExternas > 0
  );
}

export async function archivarFallecido(
  idFallecido: number,
  idUsuario: number | null,
): Promise<void> {
  const pool = await getCementerioPool();
  await pool
    .request()
    .input("id", sql.Int, idFallecido)
    .input("usuario", sql.Int, idUsuario)
    .query(`
      UPDATE dbo.FALLECIDOS SET
        ACTIVO = 0,
        FECHA_MODIFICACION = SYSUTCDATETIME(),
        USUARIO_MODIFICACION = @usuario
      WHERE ID_FALLECIDO = @id AND ACTIVO = 1
    `);
}

export async function restaurarFallecido(
  idFallecido: number,
  idUsuario: number | null,
): Promise<void> {
  const pool = await getCementerioPool();
  const check = await pool.request().input("id", sql.Int, idFallecido).query(`
    SELECT ID_FALLECIDO FROM dbo.FALLECIDOS WHERE ID_FALLECIDO = @id AND ACTIVO = 0
  `);
  if (!check.recordset.length) {
    throw new Error("El fallecido no está archivado o no existe");
  }

  await pool
    .request()
    .input("id", sql.Int, idFallecido)
    .input("usuario", sql.Int, idUsuario)
    .query(`
      UPDATE dbo.FALLECIDOS SET
        ACTIVO = 1,
        FECHA_MODIFICACION = SYSUTCDATETIME(),
        USUARIO_MODIFICACION = @usuario
      WHERE ID_FALLECIDO = @id
    `);
}

export async function eliminarFallecidoFisico(idFallecido: number): Promise<void> {
  const rel = await contarRelacionesFallecido(idFallecido);
  if (requiereArchivado(rel)) {
    throw new Error(
      "No se puede eliminar: el registro tiene información asociada. Use archivar.",
    );
  }
  const pool = await getCementerioPool();
  await pool.request().input("id", sql.Int, idFallecido).query(`
    DELETE FROM dbo.FALLECIDOS WHERE ID_FALLECIDO = @id
  `);
}
