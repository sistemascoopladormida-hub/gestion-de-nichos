# Base de datos CEMENTERIO

## Orden de ejecución

1. `migrations/001_create_database.sql`
2. `migrations/002_create_tables.sql`
3. `migrations/003_indexes_and_constraints.sql`
4. `seeds/004_seed_pabellones.sql`
5. `seeds/005_seed_nichos.sql`
6. `seeds/006_seed_usuarios_iniciales.sql`
7. `migrations/004_etapa2_alter.sql` — columnas etapa 2 (finalización ocupación, docs)
8. `scripts/verify-seed.sql`

## Requisitos

- SQL Server 2016+ (índices únicos filtrados).
- Usuario con permisos `CREATE DATABASE` para el paso 001.
- Ajustar rutas de archivos `.mdf/.ldf` en 001 si el servidor no usa rutas por defecto.

## PR_DORM

Esta carpeta **no** modifica `PR_DORM`. La vista PFC se consultará desde la aplicación con usuario de solo lectura.
