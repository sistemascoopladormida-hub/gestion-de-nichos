import type { SessionUser } from "@/types/domain";

export type Permission =
  | "dashboard:view"
  | "buscar:view"
  | "cementerio:view"
  | "fallecidos:view"
  | "fallecidos:create"
  | "fallecidos:edit"
  | "fallecidos:archive"
  | "fallecidos:restore"
  | "servicios:create"
  | "servicios:edit"
  | "ocupaciones:edit_fecha"
  | "pfc:consult"
  | "prestamos:view"
  | "prestamos:resolve"
  | "ocupaciones:finalize"
  | "ocupaciones:assign"
  | "nichos:estado"
  | "documentos:upload"
  | "documentos:delete"
  | "auditoria:view"
  | "reportes:view"
  | "reportes:export"
  | "usuarios:manage"
  | "config:manage";

const ADMIN: Permission[] = [
  "dashboard:view",
  "buscar:view",
  "cementerio:view",
  "fallecidos:view",
  "fallecidos:create",
  "fallecidos:edit",
  "fallecidos:archive",
  "fallecidos:restore",
  "servicios:create",
  "servicios:edit",
  "ocupaciones:edit_fecha",
  "pfc:consult",
  "prestamos:view",
  "prestamos:resolve",
  "ocupaciones:finalize",
  "ocupaciones:assign",
  "nichos:estado",
  "documentos:upload",
  "documentos:delete",
  "auditoria:view",
  "reportes:view",
  "reportes:export",
  "usuarios:manage",
  "config:manage",
];

const OPERADOR: Permission[] = [
  "dashboard:view",
  "buscar:view",
  "cementerio:view",
  "fallecidos:view",
  "fallecidos:create",
  "fallecidos:edit",
  "ocupaciones:assign",
  "servicios:create",
  "pfc:consult",
  "prestamos:view",
  "documentos:upload",
  "reportes:view",
];

export function hasPermission(user: SessionUser, permission: Permission): boolean {
  const set = user.rol === "ADMINISTRADOR" ? ADMIN : OPERADOR;
  return set.includes(permission);
}

export function requirePermission(user: SessionUser, permission: Permission): void {
  if (!hasPermission(user, permission)) {
    throw new ForbiddenError();
  }
}

export class ForbiddenError extends Error {
  constructor(message = "No tiene permiso para esta acción") {
    super(message);
    this.name = "ForbiddenError";
  }
}
