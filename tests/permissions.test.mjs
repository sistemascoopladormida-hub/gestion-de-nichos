import test from "node:test";
import assert from "node:assert/strict";

/** Minimal mirror of permission rules for regression checks */
const ADMIN_PERMS = new Set([
  "ocupaciones:finalize",
  "prestamos:resolve",
  "fallecidos:edit",
  "auditoria:view",
  "documentos:delete",
]);

const OPERADOR_PERMS = new Set([
  "servicios:create",
  "documentos:upload",
  "prestamos:view",
]);

function adminHas(p) {
  return ADMIN_PERMS.has(p) || OPERADOR_PERMS.has(p) || p === "dashboard:view";
}
function operadorHas(p) {
  return OPERADOR_PERMS.has(p) || p === "dashboard:view" || p === "fallecidos:view";
}

test("operador no finaliza ocupaciones", () => {
  assert.equal(operadorHas("ocupaciones:finalize"), false);
});

test("admin finaliza ocupaciones", () => {
  assert.equal(adminHas("ocupaciones:finalize"), true);
});

test("operador no resuelve prestamos administrativamente", () => {
  assert.equal(operadorHas("prestamos:resolve"), false);
});

test("operador no ve auditoria", () => {
  assert.equal(operadorHas("auditoria:view"), false);
});
