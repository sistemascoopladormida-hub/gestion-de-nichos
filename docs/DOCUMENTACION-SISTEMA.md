# Documentación del sistema — Gestión de Cementerio, Nichos y Servicios

**Organización:** Cooperativa Eléctrica Ltda. San José de la Dormida  
**Estado:** MVP funcional — cierre operativo (etapa 2)  
**Última actualización:** 6 de octubre de 2026  

Este documento describe **en detalle** todo lo desarrollado hasta el momento: objetivos, arquitectura, base de datos, backend, frontend, reglas de negocio, configuración y límites del alcance.

---

## Etapa 2 — Cierre funcional (resumen)

### Nuevo en esta etapa

| Área | Qué se agregó |
|------|----------------|
| **Ocupaciones** | Finalizar ocupación activa (solo ADMIN), liberar nicho a `DISPONIBLE`, conservar historial |
| **Préstamos** | Resolución con modal; **TRASLADADO** finaliza ocupación; vencido **no** libera nicho |
| **Permisos** | Matriz ADMINISTRADOR / OPERADOR en API (`src/lib/auth/permissions.ts`) |
| **Wizard servicio** | Mapa visual real (`NichoMapaWizard` + `NichoGrid` modo selección) |
| **Auditoría** | Pantalla `/auditoria` + `GET /api/auditoria` con filtros y diff legible |
| **Documentos** | Tarjetas, descarga, baja lógica (ADMIN), metadatos con usuario/tamaño |
| **Reportes** | 5 reportes + export CSV (`GET /api/reportes/[tipo]?format=csv`) |
| **UI** | Detalle de nicho ampliado, dashboard operativo, búsqueda enriquecida |

### Migración SQL obligatoria (etapa 2)

Ejecutar en el servidor: `database/migrations/004_etapa2_alter.sql`  
(columnas de finalización en ocupaciones y baja lógica en documentos).

### Endpoints nuevos o modificados

- `POST /api/ocupaciones/[id]/finalizar` — ADMIN
- `PATCH /api/prestamos` — ADMIN; integración con ocupación en traslado
- `GET /api/auditoria` — ADMIN
- `GET /api/reportes/[tipo]` — JSON o CSV
- `GET /api/documentos/[id]/download`
- `DELETE /api/documentos/[id]` — ADMIN

---

## 1. Propósito del sistema

Aplicación web **interna** para que la administradora del cementerio pueda:

- Ver los **5 pabellones** y los **292 nichos** de la Cooperativa.
- Conocer el **estado** de cada nicho (disponible, ocupado, préstamo, etc.).
- Registrar **fallecidos**, **servicios de sepelio**, **ocupaciones**, **préstamos con garante PFC** y **documentación**.
- Consultar socios **PFC** en la base **PR_DORM** (solo lectura), conservando **snapshots históricos**.
- Recibir **alertas** (préstamos vencidos/próximos, 10 años desde sepultura, documentación pendiente).
- Mantener **historial** por nicho y trazabilidad vía **auditoría**.

El diseño conceptual prioriza el **nicho** y la **ocupación histórica**, no una simple tabla de fallecidos.

### Fuera de alcance (explícito en el MVP)

- Facturación e integración con **PROCOOP** / aranceles automáticos.
- Importación del Excel histórico.
- Notificaciones externas (email, WhatsApp).
- Portal público, pagos online, app móvil.
- Venta o transferencia de “propiedad” de nichos (los pabellones son de la Cooperativa).

---

## 2. Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | **Next.js 15** (App Router) |
| Lenguaje | **TypeScript** |
| Base principal | **SQL Server** — base `CEMENTERIO` |
| Consulta PFC | **SQL Server** — base `PR_DORM` (solo lectura) |
| Driver SQL | **`mssql`** (pools de conexión) |
| Validación API | **Zod** |
| Contraseñas | **bcryptjs** |
| Estilos | **Tailwind CSS 4** (`@tailwindcss/postcss`) |
| UI | Componentes propios (estilo institucional, logo en `public/`) |

No se introdujeron ORM ni librerías de UI externas pesadas: las consultas son **SQL parametrizadas** en repositorios y servicios.

---

## 3. Estructura del repositorio

```
Gestion de nichos/
├── database/
│   ├── migrations/          # DDL: BD, tablas, índices
│   ├── seeds/               # Pabellones, nichos, usuarios iniciales
│   ├── scripts/             # verify-seed.sql
│   └── README.md
├── docs/                      # Diagnóstico, modelo, esta documentación
├── public/
│   └── logocooptransparente.png
├── scripts/
│   └── set-password.mjs       # Alta segura de contraseñas
├── src/
│   ├── app/                   # Rutas y API (App Router)
│   ├── components/            # UI reutilizable
│   ├── lib/                   # DB, auth, PFC, repos, servicios, auditoría
│   └── types/                 # Tipos de dominio
├── .env.example               # Plantilla de variables (sin secretos reales)
├── package.json
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── src/middleware.ts          # Protección de rutas
```

Documentos auxiliares previos:

- `docs/ETAPA-1-DIAGNOSTICO.md` — arranque desde carpeta vacía.
- `docs/ETAPA-2-MODELO-DATOS.md` — diagrama y reglas SQL.
- `docs/ESTRUCTURA-PROYECTO-PROPUESTA.md` — convenciones de carpetas.

---

## 4. Base de datos `CEMENTERIO`

### 4.1 Orden de ejecución de scripts

1. `database/migrations/001_create_database.sql`
2. `database/migrations/002_create_tables.sql`
3. `database/migrations/003_indexes_and_constraints.sql`
4. `database/seeds/004_seed_pabellones.sql`
5. `database/seeds/005_seed_nichos.sql`
6. `database/seeds/006_seed_usuarios_iniciales.sql`
7. `database/scripts/verify-seed.sql` — debe dar **5 pabellones** y **292 nichos**.

### 4.2 Tablas principales

| Tabla | Rol |
|-------|-----|
| `PABELLONES` | Catálogo de los 5 pabellones (código, ubicación, grid del mapa) |
| `NICHOS` | 292 nichos con número, fila, columna, estado administrativo |
| `FALLECIDOS` | Personas fallecidas registradas |
| `OCUPACIONES_NICHO` | **Historial y ocupación activa** nicho ↔ fallecido |
| `SERVICIOS_CEMENTERIO` | Servicios de sepelio + snapshots PFC |
| `GARANTES` | Snapshot del garante PFC al momento del préstamo |
| `PRESTAMOS_NICHO` | Préstamo de nicho (6 meses desde sepultura) |
| `UBICACIONES_EXTERNAS` | Sepultura fuera de los 5 pabellones (no usa `NICHOS`) |
| `DOCUMENTOS_CEMENTERIO` | Metadatos de archivos (ruta en disco) |
| `USUARIOS` | Acceso interno (roles ADMINISTRADOR / OPERADOR) |
| `AUDITORIA_CEMENTERIO` | Trazabilidad de acciones |

### 4.3 Reglas implementadas en SQL

- **Unicidad:** `(ID_PABELLON, NUMERO)` en `NICHOS`.
- **Una ocupación activa por nicho:** índice único filtrado `UX_OCUP_NICHO_ACTIVA` (`ESTADO = 'ACTIVO'`).
- **Una ocupación activa por fallecido:** `UX_OCUP_FALLECIDO_ACTIVA`.
- **10 años desde sepultura:** columna calculada persistida `FECHA_CUMPLIMIENTO_10_ANIOS = FECHA_INICIO + 10 años` en `OCUPACIONES_NICHO`.
- **Arancel futuro:** campos `ESTADO_ARANCEL`, `FECHA_ARANCEL_DESDE` preparados; **sin facturación**.
- **Tipos de ocupación:** solo `OCUPACION_PFC` y `OCUPACION_PRESTAMO` (no “propiedad” del nicho).

### 4.4 Seed físico de pabellones y nichos

| Código | Nombre | Nichos | Numeración | Mapa |
|--------|--------|--------|------------|------|
| P1 | Pabellón 1 | 68 | 1–68 | 17×4 |
| P2 | Pabellón 2 | 68 | **69–136** (sin renumerar) | 17×4 |
| P3 | Pabellón 3 | 52 | 1–52 | 13×4 |
| P4 | Pabellón 4 | 52 | 53–104 | 13×4 |
| P5 | Pabellón 5 | 52 | 1–52 | 13×4 |

**Total: 292 nichos**, estado inicial `DISPONIBLE`.

Campos en `PABELLONES`: `COLUMNAS_MAPA`, `FILAS_MAPA`, `ORDEN_VISUAL` para el mapa visual.

### 4.5 Usuarios iniciales (seed)

| Usuario | Rol | Contraseña en seed |
|---------|-----|-------------------|
| `alejandra.valdez` | ADMINISTRADOR | **NULL** — definir con script |
| `nahuel.ponce` | OPERADOR | **NULL** — definir con script |

---

## 5. Integración con PR_DORM (PFC)

- La aplicación **no escribe** en `PR_DORM` ni en tablas PROCOOP.
- Vista configurada: **`PFC_VIEW_NAME=vw_socios_adherentes`** (variable de entorno).
- Conexión separada: variables `PROCOOP_DB_*` con usuario de **solo lectura** recomendado en el servidor SQL.
- Función central: `src/lib/pfc/buscarSocioPFC.ts` — búsqueda parametrizada por DNI, código de socio, número de cuenta y apellido.
- **Snapshot histórico:** al registrar un servicio o un garante se guardan campos `*_SNAPSHOT` y `FECHA_CONSULTA_PFC` en `SERVICIOS_CEMENTERIO` / `GARANTES`.

---

## 6. Capa de conexión y configuración

### 6.1 Archivos

- `src/lib/db/config.ts` — lectura de env con Zod; validación de `PFC_VIEW_NAME`.
- `src/lib/db/pool.ts` — pools reutilizables por clave (`cementerio`, `procoop_readonly`).
- `src/lib/db/cementerio.ts` — pool principal.
- `src/lib/db/procoop-readonly.ts` — pool PR_DORM.

### 6.2 Variables de entorno (`.env.local`)

Ver `.env.example`. Grupos:

- **CEMENTERIO_DB_*** — base principal.
- **PROCOOP_DB_*** — PR_DORM solo lectura.
- **PFC_VIEW_NAME** — nombre de la vista PFC.
- **DOCUMENTOS_STORAGE_PATH** — carpeta en disco para archivos subidos.
- **AUTH_SECRET** — firma de sesión (mínimo 16 caracteres).
- **SESSION_COOKIE_NAME** — nombre de cookie (default `cementerio_session`).

**Importante:** los secretos deben vivir solo en `.env.local` (no commitear). La plantilla `.env.example` debe usar valores de ejemplo, no credenciales reales.

### 6.3 Health check

- `GET /api/health/db` — devuelve conteo de pabellones y nichos; esperado `{ pabellones: 5, nichos: 292 }`.

---

## 7. Autenticación y autorización

### 7.1 Mecanismo

- Login: `POST /api/auth/login` con usuario/contraseña.
- Hash: **bcrypt** almacenado en `USUARIOS.PASSWORD_HASH` (VARBINARY).
- Sesión: cookie **httpOnly** con payload JSON + **HMAC-SHA256** (`AUTH_SECRET`), expiración **12 horas**.
- Logout: `POST /api/auth/logout`.
- Middleware (`src/middleware.ts`): redirige a `/login` si no hay cookie; APIs devuelven 401.

### 7.2 Establecer contraseñas

```bash
npm run auth:set-password -- --usuario=alejandra.valdez --password=SuClaveSegura
```

Script: `scripts/set-password.mjs` (lee `.env.local` / `.env`).

### 7.3 Roles

- **ADMINISTRADOR** — acceso completo en el MVP (Alejandra Valdez).
- **OPERADOR** — usuario creado (Nahuel Ponce); **aún no hay restricción fina por pantalla** en el código (preparado para endurecer permisos después).

---

## 8. Backend — repositorios y servicios

Los repositorios encapsulan SQL parametrizado. El **estado visual** del nicho se calcula en consultas (`src/lib/repositories/nichoEstadoVisual.ts`):

1. Si el nicho está `INHABILITADO`, `MANTENIMIENTO` o `RESERVADO` → ese estado.
2. Si hay ocupación activa tipo `OCUPACION_PRESTAMO` → **PRESTAMO**.
3. Si hay ocupación activa → **OCUPADO**.
4. Si no → estado del nicho (típicamente **DISPONIBLE**).

| Módulo | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Dashboard | `dashboard.ts` | Contadores globales |
| Alertas | `alertas.ts` | Préstamos vencidos/próximos, 10 años, docs pendientes |
| Pabellones | `pabellones.ts` | Listado resumen y nichos por pabellón |
| Nichos | `nichos.ts` | Detalle, historial, validación disponibilidad |
| Fallecidos | `fallecidos.ts` | CRUD y contexto (ubicación, préstamo) |
| Búsqueda | `buscar.ts` | Búsqueda global + PFC |
| Préstamos | `prestamos.ts` | Listados y resolución administrativa |
| Servicio transaccional | `services/registrarServicio.ts` | Alta completa de servicio en una transacción |
| Auditoría | `audit/logAudit.ts` | Insert en `AUDITORIA_CEMENTERIO` |
| PFC | `pfc/buscarSocioPFC.ts` | Consulta vista PR_DORM |

### 8.1 `registrarServicio` (flujo crítico)

En una **transacción SQL**:

1. Inserta **fallecido**.
2. Si ubicación **PABELLÓN:** valida nicho disponible, crea **ocupación**, marca nicho `OCUPADO`, opcionalmente **garante + préstamo** (+6 meses).
3. Si ubicación **EXTERNA:** inserta `UBICACIONES_EXTERNAS` (sin tocar nichos).
4. Inserta **SERVICIOS_CEMENTERIO** con snapshot PFC si corresponde.

Validaciones API adicionales en `POST /api/servicios` (Zod): PFC obligatorio si `esPfc`; préstamo/garante si no PFC y pide nicho; garante con PFC activo.

---

## 9. API REST (Route Handlers)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health/db` | Salud BD (público) |
| POST | `/api/auth/login` | Inicio de sesión |
| POST | `/api/auth/logout` | Cierre de sesión |
| GET | `/api/pfc/buscar` | Búsqueda socios PFC |
| GET | `/api/pabellones` | Resumen de pabellones |
| GET | `/api/pabellones/[codigo]/nichos` | Nichos para mapa/selector |
| GET/POST | `/api/fallecidos` | Listado / alta |
| GET/PUT | `/api/fallecidos/[id]` | Detalle / actualización |
| POST | `/api/servicios` | Registro wizard servicio |
| GET/PATCH | `/api/prestamos` | Listado / registrar resolución |
| GET | `/api/buscar?q=` | Búsqueda global |
| GET/POST | `/api/documentos` | Listar / subir documentos |

Todas las rutas operativas (excepto health y login) exigen sesión vía `requireSessionApi()`.

---

## 10. Frontend — pantallas

### 10.1 Rutas públicas

| Ruta | Descripción |
|------|-------------|
| `/` | Redirige a `/dashboard` o `/login` |
| `/login` | Formulario de acceso con logo cooperativa |

### 10.2 Rutas autenticadas (layout `AppShell`)

| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Panel: totales, buscador, alertas, accesos rápidos |
| `/cementerio` | Tarjetas de los 5 pabellones |
| `/cementerio/pabellon/[codigo]` | Mapa visual por filas (grid) |
| `/cementerio/nicho/[id]` | Detalle, ocupante, préstamo, 10 años, historial |
| `/fallecidos` | Tabla con filtro |
| `/fallecidos/nuevo` | Alta manual |
| `/fallecidos/[id]` | Ficha con pestañas: Datos, Ubicación, Servicio, Documentos |
| `/servicios/nuevo` | Wizard: PFC → datos → ubicación → confirmar |
| `/prestamos` | Listado (todos / vencidos / próximos 30 días) |
| `/buscar` | Resultados agrupados: fallecidos, nichos, PFC |
| `/reportes` | Enlaces MVP a listados (sin export Excel aún) |

### 10.3 Componentes destacados

- **Mapa:** `NichoGrid`, `NichoTile`, `MapaLeyenda` — colores institucionales por estado.
- **Dashboard:** `StatCard`, `GlobalSearch`, `AlertList`.
- **PFC:** `PfcSearchPanel` — buscar y seleccionar socio/garante.
- **Servicio:** `ServicioWizard`, `NichoSelector` — elige pabellón y nicho disponible.
- **Fallecidos:** `FallecidoForm`, `FallecidoTabs`, `DocumentUpload`.
- **Préstamos:** `PrestamosTable` — marca “PRÉSTAMO VENCIDO” y registra resolución (sin automatizar destino).

### 10.4 UX / diseño

- Tipografía system-ui, colores en `src/app/globals.css` (`coop-primary`, estados de nicho).
- Navegación superior fija con logo y menú.
- Mensajes de error orientados al usuario (`mapErrorMessage` — no expone errores SQL crudos).

---

## 11. Reglas de negocio reflejadas en el MVP

| Regla | Dónde |
|-------|--------|
| Cooperativa no vende nichos | Modelo solo PFC / préstamo; sin “propiedad” transferible |
| Un fallecido, un nicho activo | Índice único + validación backend |
| Un nicho, un ocupante activo | Índice único + `assertNichoDisponible` |
| Préstamo 6 meses desde sepultura | Cálculo en `registrarServicio` |
| Garante debe ser PFC activo | Validación API + UI |
| Snapshot PFC al registrar | Campos snapshot en servicio/garante |
| Ubicación externa no consume nichos | Tabla `UBICACIONES_EXTERNAS` |
| 10 años desde fecha de sepultura | Columna calculada + alertas + texto en detalle nicho |
| Préstamo vencido: no decisión automática | Solo alerta y registro manual de resolución |
| Sin import Excel | No hay módulo de importación |
| Sin facturación PROCOOP | Campos arancel preparatorios únicamente |

---

## 12. Documentos

- Archivos en **`DOCUMENTOS_STORAGE_PATH`** (filesystem).
- Metadatos en `DOCUMENTOS_CEMENTERIO`.
- Tipos permitidos: `CERTIFICADO_DEFUNCION`, `DNI`, `AUTORIZACION`, `DOCUMENTACION_NICHO`, `DOCUMENTACION_GARANTE`, `COMPROBANTE`, `OTRO`.
- Subida desde pestaña **Documentos** en la ficha del fallecido (`POST /api/documentos` multipart).

Los backups deben incluir **BD + carpeta de documentos**.

---

## 13. Auditoría

Se registran acciones (entre otras): `LOGIN`, `CONSULTAR_PFC`, `CREAR`, `MODIFICAR`, `REGISTRAR_SERVICIO`, `REGISTRAR_PRESTAMO`, `CARGAR_DOCUMENTO`.

Tabla: `AUDITORIA_CEMENTERIO` (usuario, fecha, acción, entidad, id registro, JSON anterior/nuevo, IP opcional).

---

## 14. Alertas automáticas (in-app)

Calculadas en `getAlertas()` — **no** envían email/WhatsApp:

| Tipo | Criterio |
|------|----------|
| Préstamo vencido | `FECHA_VENCIMIENTO < hoy` |
| Préstamo próximo | vence en los próximos **30 días** |
| 10 años cumplidos | `FECHA_CUMPLIMIENTO_10_ANIOS <= hoy` y ocupación activa |
| Documentación pendiente | servicios recientes sin ningún documento en el fallecido |

Visibles en **dashboard** y enlazadas a préstamos, nichos o fichas.

---

## 15. Comandos npm

| Comando | Uso |
|---------|-----|
| `npm run dev` | Servidor desarrollo |
| `npm run build` | Build producción |
| `npm run start` | Servidor producción |
| `npm run typecheck` | Verificación TypeScript |
| `npm run lint` | ESLint (Next) |
| `npm run auth:set-password` | Definir contraseña de usuario |

---

## 16. Pruebas realizadas

- Compilación TypeScript sin errores.
- `next build` exitoso (rutas app + API + middleware).
- Conexión a `CEMENTERIO` verificada vía `/api/health/db` (5 pabellones, 292 nichos) en entorno del usuario.

---

## 17. Permisos por rol (etapa 2 + CRUD fallecidos)

Definidos en `src/lib/auth/permissions.ts`. Resumen:

- **ADMINISTRADOR:** editar fallecidos, archivar/restaurar, modificar fecha de sepultura, editar servicios, finalizar ocupaciones, resolver préstamos, eliminar documentos, auditoría, exportar reportes.
- **OPERADOR:** consultar, **editar datos del fallecido**, registrar servicios, cargar documentos, ver préstamos (sin resolver, archivar ni cambiar fecha de sepultura).

Todas las APIs sensibles validan permiso en backend (403 si no corresponde).

---

## 17.1 CRUD de fallecidos y fecha de sepultura

### Modelo (sin cambios de tablas)

| Concepto en UI | Almacenamiento |
|----------------|----------------|
| Datos personales del fallecido | `FALLECIDOS` |
| Fecha de sepultura (nicho Cooperativa) | `OCUPACIONES_NICHO.FECHA_INICIO` |
| Cumplimiento 10 años | columna calculada `FECHA_CUMPLIMIENTO_10_ANIOS` (= inicio + 10 años) |
| Vencimiento préstamo (6 meses) | `PRESTAMOS_NICHO.FECHA_VENCIMIENTO` y `OCUPACIONES_NICHO.FECHA_VENCIMIENTO` |
| Fecha de sepultura (ubicación externa) | `UBICACIONES_EXTERNAS.FECHA_SEPULTURA` |
| Fecha del servicio administrativo | `SERVICIOS_CEMENTERIO.FECHA_SERVICIO` |

### APIs

| Método | Ruta | Uso |
|--------|------|-----|
| GET/POST | `/api/fallecidos` | Listado (`?archivados=1`) / alta |
| GET/PUT/DELETE | `/api/fallecidos/[id]` | Detalle / edición / archivar o eliminar físico |
| POST | `/api/fallecidos/[id]/restore` | Restaurar archivado (ADMIN) |
| PATCH | `/api/ocupaciones/[id]/fecha-sepultura` | Corregir sepultura en nicho (ADMIN) |
| PATCH | `/api/ubicaciones-externas/[id]/fecha-sepultura` | Corregir sepultura externa (ADMIN) |
| PATCH | `/api/servicios/[id]` | Corregir datos del servicio (ADMIN) |

### Reglas de eliminación

- Si existen servicios, ocupaciones, préstamos, documentos o ubicaciones externas → **archivado** (`FALLECIDOS.ACTIVO = 0`).
- Si no hay relaciones → **DELETE** físico permitido.
- Archivados: ocultos en listados/búsqueda habituales; visibles con filtro «Mostrar archivados».

### UI principal

- Ficha `/fallecidos/[id]`: secciones visibles (personal, fallecimiento, **sepultura**, servicio, préstamo, documentos, historial).
- Edición `/fallecidos/[id]/editar` reutiliza `FallecidoForm`.
- Wizard `/servicios/nuevo`: **fecha de servicio** y **fecha de sepultura** independientes + resumen antes de guardar.

---

## 18. Pendientes reales (post etapa 2)

- Cambio de estado administrativo de nicho (INHABILITADO/RESERVADO) desde UI dedicada.
- Job opcional para persistir estados `PROXIMO_VENCIMIENTO` / `VENCIDO` (hoy se calculan al listar).
- Gestión de usuarios desde UI (hoy solo seed + `auth:set-password`).
- Integración **arancel 10 años** con PROCOOP (fuera de alcance).
- Endurecer **`.env.example`** (solo placeholders, sin credenciales reales).

---

## 18. Criterios de éxito del MVP (checklist funcional)

Con migraciones aplicadas, `.env` configurado y contraseña de administradora definida, el sistema permite:

1. Iniciar sesión.  
2. Ver dashboard con totales y alertas.  
3. Recorrer mapa de 5 pabellones y 292 nichos.  
4. Ver detalle e historial de un nicho.  
5. Registrar fallecidos manualmente.  
6. Buscar socios PFC en PR_DORM.  
7. Registrar un servicio (PFC o préstamo con garante).  
8. Asignar nicho y calcular vencimiento a 6 meses.  
9. Listar préstamos vencidos/próximos y anotar resolución.  
10. Ver indicación de 10 años desde sepultura.  
11. Subir documentación.  
12. Consultar ficha del fallecido y búsqueda global.  

---

## 19. Contacto técnico interno

Para ampliaciones, mantener:

- Una sola forma de conexión SQL (`lib/db`).
- Ocupaciones siempre vía `OCUPACIONES_NICHO`.
- Consultas parametrizadas (especialmente PFC y búsquedas).
- Decisiones de negocio no definidas **parametrizadas o documentadas**, no inventadas en código.

---

*Documento generado para acompañar el repositorio del MVP. Actualizar este archivo cuando se agreguen módulos o cambien reglas de negocio.*
