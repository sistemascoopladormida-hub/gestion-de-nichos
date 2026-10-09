# ETAPA 1 — Diagnóstico del proyecto existente

**Fecha:** 2025-10-05  
**Workspace:** `Gestion de nichos`

## Hallazgos

| Aspecto | Estado |
|--------|--------|
| Proyecto Next.js | **No existe** — carpeta vacía salvo `logocooptransparente.png` |
| `package.json` / dependencias | **No hay** |
| Conexión SQL Server | **No configurada** |
| PR_DORM / PROCOOP | **No documentada** en el repo |
| VIEW PFC | **No documentada** en el repo — usar `vw_socios_adherentes` vía `PFC_VIEW_NAME` en `.env` |
| Autenticación / UI / ORM | **Sin base previa** — se definirán en etapas posteriores reutilizando stack estándar Cooperativa (Next.js + TypeScript + `mssql`) |

## Decisiones para no bloquear el MVP

1. **Base nueva `CEMENTERIO`** en SQL Server, independiente de `PR_DORM` (solo lectura).
2. **Scripts SQL versionados** en `database/migrations/` y `database/seeds/` (ejecutables con SSMS o `sqlcmd`).
3. **Tabla auxiliar `UBICACIONES_EXTERNAS`** para sepulturas fuera de los 292 nichos (no ocupa fila en `NICHOS`).
4. **Campos de arancel 10 años** en `OCUPACIONES_NICHO` (`ESTADO_ARANCEL`, fechas) sin integración PROCOOP.
5. **Usuarios iniciales** sin contraseña en seed: `PASSWORD_HASH` NULL hasta ejecutar script de alta segura (etapa backend).

## Próximo paso inmediato

Ejecutar migraciones **001 → 005** y verificar con `database/scripts/verify-seed.sql` (5 pabellones, 292 nichos, restricciones activas).
