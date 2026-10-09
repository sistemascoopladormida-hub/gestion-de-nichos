# Estructura de archivos propuesta (Next.js + TypeScript)

```
Gestion de nichos/
├── database/
│   ├── migrations/          # DDL ordenado
│   ├── seeds/               # Datos iniciales
│   └── scripts/             # Verificación, utilidades
├── docs/
├── public/
│   └── logocooptransparente.png
├── src/
│   ├── app/                 # App Router
│   │   ├── (auth)/login/
│   │   ├── (app)/           # Layout autenticado
│   │   │   ├── dashboard/
│   │   │   ├── cementerio/
│   │   │   ├── fallecidos/
│   │   │   ├── servicios/
│   │   │   └── ...
│   │   └── api/             # Route handlers
│   ├── components/
│   ├── lib/
│   │   ├── db/
│   │   │   ├── cementerio.ts
│   │   │   └── procoop-readonly.ts
│   │   ├── pfc/
│   │   │   └── buscarSocioPFC.ts
│   │   ├── auth/
│   │   └── audit/
│   └── types/
├── .env.example
├── package.json
└── tsconfig.json
```

Convenciones:

- Una sola forma de conectar a `CEMENTERIO` y otra de solo lectura a `PR_DORM`.
- APIs con validación (Zod) y SQL parametrizado.
- Estados de nicho alineados al dominio; ocupación real en `OCUPACIONES_NICHO`.
