# Collector Dashboard API

Fastify servis koji napaja Collector Dashboard aplikaciju. Projekat je pisan u TypeScript-u i koristi modularnu arhitekturu (`src/modules/**`) kako bi svaki domen bio izolovan i lako proširiv.

## Dokumentacija

- 📖 [Developer Guide](../../docs/DEVELOPER_GUIDE.md) - Kompletan vodič za developere
- 🔧 [API Development Guide](../../docs/API_DEVELOPMENT.md) - Detaljni vodič za razvoj API-ja
- 🏗️ [Architecture Overview](../../docs/ARCHITECTURE.md) - Pregled arhitekture sistema

## Pokretanje

```sh
bun install
bun run dev
```

Server se podiže na `http://localhost:4000` (možete promeniti preko `PORT` i `HOST` promenljivih okruženja).\
Ako `DATABASE_URL` nije definisan, koristi se in-memory `pg-mem` baza, tako da lokalni razvoj radi i bez PostgreSQL instance.

## Skripte

- `bun run dev` – pokretanje servera sa hot-reload podrškom.
- `bun run build` – transpajlovanje TypeScript koda u `dist` direktorijum.
- `bun run start` – start produkcijskog build-a.
- `bun run lint` – ESLint provera koda.
- `bun run test` / `bun run test:watch` – Vitest integracioni testovi.
- `bun run db:migrate` – izvršavanje Drizzle migracija nad bazom (zahteva `DATABASE_URL`).
- `bun run db:seed` – punjenje baze osnovnim CRM nalozima (posle migracija).

## OpenAPI dokumentacija

Nakon pokretanja servera, kompletna dokumentacija je dostupna na:

- Swagger UI: `GET http://localhost:4000/api/docs`
- JSON specifikacija: `GET http://localhost:4000/api/docs/json`

Dokumentacija se generiše iz Fastify šema, pa sve nove rute treba da definišu `schema` objekat (`summary`, `tags`, `response`, itd.).

## Accounts modul (Drizzle)

Accounts modul se nalazi u `src/modules/accounts` i koristi Drizzle ORM nad PostgreSQL bazom. Paket podrazumevano koristi bazu iz `DATABASE_URL`, dok test okruženje i dalje može da forsira in-memory repozitorijum preko `ACCOUNTS_REPOSITORY=memory`. Dostupne rute:

- `GET /api/accounts` – lista svih account-a
- `GET /api/accounts/:id` – detalji konkretnog account-a
- `POST /api/accounts` – kreiranje novog account-a (validacija preko JSON schema)
- `PUT /api/accounts/:id` – izmena postojećeg account-a
- `DELETE /api/accounts/:id` – brisanje account-a

Svaka ruta koristi standardizovani `createHttpError` helper i globalni error handler za konzistentan format grešaka. U produkciji se koristi Drizzle repozitorijum, dok je in-memory varijanta ostavljena za specijalne slučajeve (npr. unit testovi bez baze).

## Migracije i rad sa bazom

1. Definišite konekciju u `.env` fajlu:

   ```env
   DATABASE_URL=postgres://user:password@localhost:5432/collector_dashboard
   DB_SSL=false
   ```

2. Pokrenite migracije:

   ```sh
   bun run db:migrate
   ```

3. (Opcionalno) Napunite bazu demo podacima:

   ```sh
   bun run db:seed
   ```

   Seed ubacuje dva osnovna account-a (`Acme Manufacturing`, `Jane Doe`) sa determinističkim UUID vrednostima koje se mogu koristiti za demo i E2E tokove.

## Testiranje

Integracioni testovi se nalaze u `tests/accounts.routes.test.ts` i pokrivaju kompletan CRUD tok. Testovi koriste `fastify.inject`, tako da nije potrebno podizati server tokom izvršavanja.

> Napomena: Test suite se pokreće sa `ACCOUNTS_REPOSITORY=memory` kako bi scenario radio i bez realne PostgreSQL instance. Produkcijska konfiguracija (bez ove promenljive) uvek koristi Drizzle repozitorijum.

```sh
bun run test
```

## Arhitektura Modula

API koristi modularnu arhitekturu gde svaki modul predstavlja poslovni domen:

### Modul Struktura

Svaki modul sledi isti pattern:

```
module/
├── index.ts              # Fastify plugin export
├── module.routes.ts      # Route definitions
├── module.controller.ts  # Request handlers
├── module.service.ts     # Business logic
├── module.schema.ts      # OpenAPI schemas
└── module.types.ts       # TypeScript types
```

### Dostupni Moduli

- **Accounts** (`/api/accounts`) - Upravljanje klijentskim nalozima i kontaktima
- **Sales** (`/api/sales/*`) - Quotes, Orders, Invoices, Payments
- **CRM** (`/api/crm/*`) - Leads, Opportunities, Activities
- **Projects** (`/api/projects/*`) - Projekti, zadaci, timeline, tim, budžet
- **HR** (`/api/hr/*`) - Employees, Roles, Attendance
- **Settings** (`/api/settings/*`) - User management, Teams, Permissions
- **Search** (`/api/search`) - Globalna pretraga
- **Products** (`/api/products/*`) - Product i inventory management

### Primer: Dodavanje nove rute

```typescript
// inventory.routes.ts
import type { FastifyPluginAsync } from "fastify";
import { listInventoryHandler } from "./inventory.controller";
import { listInventorySchema } from "./inventory.schema";

const inventoryRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { schema: listInventorySchema }, listInventoryHandler);
};

export default inventoryRoutes;
```

Detaljniji vodič u [API Development Guide](../../docs/API_DEVELOPMENT.md).

## Alati i arhitektura

- **Fastify 4** sa plugin arhitekturom (`src/plugins/**`)
- **Pino logger** sa `pino-pretty` transportom u development okruženju (JSON logovi u produkciji)
- **Vitest** za testiranje
- **@crm/types** paket sa deljenim tipovima u monorepu
- **Standardizovani error helper** (`src/lib/errors.ts`)
- **Automatsko registrovanje modula** preko `src/server.ts`
- **Redis caching** za performance optimizaciju (`src/lib/cache.service.ts`)
- **Metrics collection** za monitoring (`src/lib/metrics.service.ts`)
- **Export funkcionalnosti** (CSV/PDF) (`src/lib/export.service.ts`, `src/lib/pdf.service.ts`)
- **Global search** preko svih modula (`src/modules/search/`)

## Environment Variables

```ini
# Server
HOST=0.0.0.0
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://collector:collector@localhost:5432/collector
DB_SSL=false
DB_MAX_CONNECTIONS=10

# Redis
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=debug
```

Za više informacija o environment varijablama, pogledaj [Developer Guide](../../docs/DEVELOPER_GUIDE.md#environment-configuration).

## Monitoring i Health Checks

### Health Check Endpoints

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health check sa database i Redis statusom
- `GET /api/health/ready` - Readiness probe (za Kubernetes/OpenShift)
- `GET /api/health/live` - Liveness probe (za Kubernetes/OpenShift)

### Metrics Endpoint

- `GET /api/metrics` - Get current metrics snapshot (response times, cache hit rates, database query times)
- `POST /api/metrics/reset` - Reset all collected metrics

## Export Funkcionalnosti

### CSV Export

- `GET /api/sales/orders/export` - Export orders to CSV
- `GET /api/sales/quotes/export` - Export quotes to CSV
- `GET /api/sales/invoices/export` - Export invoices to CSV
- `GET /api/projects/export` - Export projects to CSV
- `GET /api/hr/employees/export` - Export employees to CSV

### PDF Export

- `GET /api/sales/quotes/:id/pdf` - Export quote to PDF
- `GET /api/sales/invoices/:id/pdf` - Export invoice to PDF
- `GET /api/projects/:id/report/pdf` - Export project report to PDF

**Napomena**: PDF export zahteva instalaciju `pdfkit` biblioteke:
```bash
bun add pdfkit @types/pdfkit
```

## Global Search

- `GET /api/search?q=<query>` - Search across all modules (Accounts, Sales, CRM, Projects)
- `GET /api/search/suggestions?q=<query>` - Get search suggestions

Query parametri:
- `q` (required) - Search query (minimum 2 characters)
- `types` (optional) - Comma-separated list of types to search (company,contact,order,quote,invoice,project,lead)
- `limit` (optional) - Maximum number of results (default: 20)
- `offset` (optional) - Number of results to skip (default: 0)

