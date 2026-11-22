# RepairOps

Sistema POS multi-tenant para talleres de reparación. Monorepo con API REST (Node/TypeScript) y cliente web (React/Vite), orquestado con Docker/Podman Compose.

## Stack

**api/**
- Node 26, TypeScript 7, ESM (`type: module`)
- Express 5
- TypeORM 0.3 + PostgreSQL 17, migraciones versionadas (`synchronize` apagado)
- `tsyringe` para inyección de dependencias, `reflect-metadata`
- `class-validator` / `class-transformer` para DTOs
- `jsonwebtoken` + `bcryptjs` para auth
- `decimal.js` para cálculos monetarios
- `ioredis`
- `@react-pdf/renderer` + `sharp` para generación de PDFs/imágenes
- `vitest` (unit/integration), `dependency-cruiser` (arquitectura), `tsc --noEmit` (type-check)

**client/**
- React 19, Vite 6, TypeScript
- Tailwind CSS 4
- `react-router` 7
- `apexcharts` / `react-apexcharts` para gráficos
- `react-barcode` (código de barras del ticket térmico), `qrcode.react` (dependencia presente, aún sin integrar: QR de deep-link a WhatsApp en el ticket)
- ESLint, `vitest`

**Infraestructura** (`docker-compose.yaml`)
- `postgres` (17-alpine)
- `redis`
- `automation` (n8n, automatizaciones, comparte Postgres con la API)
- `nginx` (reverse proxy, enrutamiento por dominio)
- `api` y `client` (builds propios vía Dockerfile)

## Estructura

```
api/src/
  app_platform/   automation, human-mode, import-staging, integrations, local
  commerce/       cash, customers, inventory, payments, price-list, pricing,
                  quotes, repair-notes, revenue-attribution, service-types, suppliers
  core/           common, config, daos, database, di, http, security, tenancy, types
  identity/       auth, branches, settings
  messaging/      chats, message-templates, n8n, notifications,
                  whatsapp-admin, whatsapp-official
  reporting/      pdf, reports

client/src/
  app_platform/, commerce/, core/, identity/, messaging/, reporting/
  App.tsx, router.tsx, main.tsx
```

Cada bounded context de `api/src` se organiza internamente en `entities/`, `daos/`, `services/`, `controllers/`, `routes/`, `middlewares/` según aplique.

## Multi-tenancy

Aislamiento por `tenant_id` propagado con `AsyncLocalStorage` (`core/tenancy`): el JWT trae `tenantId`, un middleware hace `runWithTenant` y el resto del request lee el tenant actual con `getCurrentTenantId()`. Los Daos de entidades tenant-owned extienden `TenantScopedDao`, que filtra toda lectura/escritura por tenant automáticamente. Excepción documentada: filas de alcance plataforma con `tenant_id` nullable (p. ej. catálogo de plantillas de sistema), resueltas con métodos explícitos que nunca pasan por el filtro de tenant.

## Esquema de base de datos

Versionado por migraciones TypeORM en `api/src/core/database/migrations/`, sin `synchronize`. Scripts relevantes (`api/package.json`):

```bash
pnpm migration:generate   # genera diff entre entidades y última migración
pnpm migration:run        # aplica migraciones pendientes
pnpm schema:log           # muestra diff pendiente sin aplicar
pnpm schema:check         # falla si el esquema diverge de las entidades (gate de CI)
```

## Variables de entorno

- Raíz (`.env.example`): puertos publicados al host (`APP_PORT`, `N8N_PORT`, `POSTGRES_PORT`, `REDIS_PORT`); Compose no puede leerlos del `.env` de cada servicio para sustituir `${...}`).
- `api/.env.example`: credenciales de Postgres/Redis, `JWT_SECRET`, `N8N_INTERNAL_TOKEN`, `ENCRYPTION_KEY` (AES-256-GCM, cifrado de credenciales de WhatsApp), variables de la cuenta piloto de WhatsApp, `WHATSAPP_APP_SECRET`/`WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `STRIPE_PUBLIC_KEY`/`STRIPE_PRIVATE_KEY`.
- Cada servicio (`automation/`, `infra/database/`, `infra/redis/`, `infra/cloudflared/`) trae su propio `.env` inyectado vía `env_file`.
- `client/.env.production.example`: `VITE_API_BASE_URL` que `vite build` hornea en la imagen; `client/.env` es solo para `pnpm dev`.

## Desarrollo local

```bash
cp .env.example .env
cp api/.env.example api/.env
cp automation/.env.example automation/.env
cp infra/database/.env.example infra/database/.env
cp infra/redis/.env.example infra/redis/.env
cp infra/cloudflared/.env.example infra/cloudflared/.env
cp client/.env.example client/.env
cp client/.env.production.example client/.env.production
docker compose up --build -d   # o: podman compose up --build -d
```

El `api` corre siempre `dist/` compilado dentro del contenedor (`NODE_ENV=production` fijo en el servicio), nunca `src/` con `tsx`/`ts-node`. `nginx` enruta por dominio (ver `nginx/conf.d`), no por puerto.

Scripts de cada paquete:

```bash
# api/
pnpm dev          # tsc --watch + node --watch
pnpm test         # tsc --noEmit
pnpm test:unit    # vitest
pnpm test:arch    # dependency-cruiser contra .dependency-cruiser.cjs

# client/
pnpm dev          # vite
pnpm lint         # eslint
pnpm test         # vitest
```

## CI

`.github/workflows/ci.yml`, dos jobs sobre Node 26 + pnpm:

- **api**: type-check, build, `test:arch`, `schema:check`, `test:unit`, contra un Postgres de servicio.
- **client**: lint, test, build.
