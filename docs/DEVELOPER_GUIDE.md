# Developer Guide

Vodič za developere koji rade na Collector Dashboard projektu.

## Sadržaj

- [Uvod](#uvod)
- [Setup](#setup)
- [Arhitektura](#arhitektura)
- [Dodavanje novog modula](#dodavanje-novog-modula)
- [Best Practices](#best-practices)
- [Testing](#testing)
- [Database](#database)
- [API Development](#api-development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Uvod

Collector Dashboard je monorepo projekat koji se sastoji od:

- **API** (`apps/api`) - Fastify backend server sa modularnom arhitekturom
- **Dashboard** (`apps/dashboard`) - Next.js 16 frontend aplikacija
- **Shared Packages** (`packages/`) - Deljeni tipovi i konfiguracije

Projekat koristi:
- **Bun** kao runtime i package manager
- **TypeScript** za tipizaciju
- **Drizzle ORM** za rad sa bazom podataka
- **Fastify** za backend API
- **Next.js** za frontend
- **shadcn/ui** za UI komponente

## Setup

### Preduslovi

- **Bun** (najnovija verzija) - [Instalacija](https://bun.sh/docs/installation)
- **Docker** i **Docker Compose** (opciono, za Docker režim)
- **PostgreSQL** (opciono, za lokalni razvoj bez Docker-a)

### Instalacija

1. Kloniraj repozitorijum:
   ```bash
   git clone <repository-url>
   cd Collector-Dashboard
   ```

2. Instaliraj zavisnosti:
   ```bash
   bun install
   ```

3. Konfiguriši environment varijable:
   
   Kreiraj `.env.local` fajl u korenu projekta:
   ```ini
   # Database
   DATABASE_URL=postgresql://collector:collector@localhost:5432/collector
   DB_SSL=false
   DB_MAX_CONNECTIONS=10
   
   # Redis (opciono)
   REDIS_URL=redis://localhost:6379
   
   # API
   HOST=0.0.0.0
   PORT=4000
   
   # Dashboard
   NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
   NEXT_PUBLIC_GA_ID=
   ```

4. Pokreni razvojno okruženje:
   ```bash
   bun scripts/dev.ts
   ```

   Ovo će automatski:
   - Pokrenuti migracije
   - Seed-ovati bazu podataka
   - Startovati API server na `http://localhost:4000`
   - Startovati Dashboard na `http://localhost:3000`

### Docker Setup

Za determinističko okruženje koristi Docker režim:

```bash
bun scripts/dev.ts --docker
```

Ovo pokreće PostgreSQL i Redis u Docker kontejnerima.

## Arhitektura

### Monorepo Struktura

```
Collector-Dashboard/
├── apps/
│   ├── api/              # Backend API server
│   └── dashboard/        # Frontend Next.js aplikacija
├── packages/
│   ├── types/            # Deljeni TypeScript tipovi
│   ├── ui/               # Deljene UI komponente
│   └── config/           # Deljene konfiguracije (ESLint, Tailwind, TypeScript)
├── services/             # Mikroservisi (chat, notifications)
└── docs/                 # Dokumentacija
```

### API Arhitektura

API koristi modularnu arhitekturu:

```
apps/api/src/
├── modules/              # Poslovni moduli
│   ├── accounts/         # Accounts modul
│   ├── sales/            # Sales modul (quotes, orders, invoices, payments)
│   ├── crm/              # CRM modul (leads, opportunities, activities)
│   ├── projects/         # Projects modul
│   ├── hr/               # HR modul
│   └── ...
├── plugins/              # Fastify plugin-i
├── routes/               # Globalne rute (health, metrics)
├── lib/                  # Utility funkcije
└── db/                   # Database šeme i migracije
```

Svaki modul ima sledeću strukturu:
- `*.routes.ts` - Definicija ruta
- `*.controller.ts` - Request handler-i
- `*.service.ts` - Poslovna logika
- `*.schema.ts` - OpenAPI šeme za validaciju
- `*.types.ts` - TypeScript tipovi
- `index.ts` - Export modula kao Fastify plugin

### Dashboard Arhitektura

Dashboard koristi Next.js App Router:

```
apps/dashboard/
├── app/                  # Next.js App Router
│   ├── (protected)/      # Zaštićene rute
│   ├── (public)/         # Javne rute
│   └── api/              # Next.js API rute
├── components/           # React komponente
│   ├── ui/               # shadcn/ui komponente
│   └── ...               # Custom komponente
└── lib/                  # Utility funkcije
```

## Dodavanje novog modula

### 1. Kreiraj modul strukturu

U `apps/api/src/modules/` kreiraj novi folder, npr. `inventory/`:

```
inventory/
├── index.ts              # Fastify plugin export
├── inventory.routes.ts   # Rute
├── inventory.controller.ts  # Handler-i
├── inventory.service.ts  # Business logika
├── inventory.schema.ts   # OpenAPI šeme
└── inventory.types.ts    # TypeScript tipovi
```

### 2. Implementiraj servis

```typescript
// inventory.service.ts
import type { AppDatabase } from "../../db";

export class InventoryService {
  constructor(private readonly database: AppDatabase) {}
  
  async list() {
    // Implementacija
  }
}
```

### 3. Kreiraj kontrolere

```typescript
// inventory.controller.ts
import type { RouteHandler } from "fastify";

export const listInventoryHandler: RouteHandler = async (request) => {
  const service = new InventoryService(request.db);
  return service.list();
};
```

### 4. Definiši šeme

```typescript
// inventory.schema.ts
import type { FastifySchema } from "fastify";

export const listInventorySchema: FastifySchema = {
  tags: ["inventory"],
  summary: "List inventory items",
  description: "Vraća listu svih inventarskih stavki",
  response: {
    200: {
      type: "array",
      items: { /* schema */ }
    }
  }
};
```

### 5. Registruj rute

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

### 6. Exportuj modul

```typescript
// index.ts
import inventoryRoutes from "./inventory.routes";

export default inventoryRoutes;
```

### 7. Dodaj tag u OpenAPI

U `apps/api/src/plugins/openapi.ts` dodaj novi tag:

```typescript
tags: [
  // ...
  {
    name: "inventory",
    description: "Inventory management"
  }
]
```

## Best Practices

### Coding Standards

1. **TypeScript**: Uvek koristi striktne tipove, izbegavaj `any`
2. **Naming**: 
   - Klase: PascalCase (`InventoryService`)
   - Funkcije/varijable: camelCase (`listInventory`)
   - Konstante: UPPER_SNAKE_CASE (`MAX_ITEMS`)
   - Fajlovi: kebab-case (`inventory.service.ts`)

3. **Error Handling**: Koristi `createHttpError` helper za konzistentne greške
4. **Logging**: Koristi `request.log` za logovanje u handler-ima
5. **Validation**: Uvek validiraj input preko OpenAPI šema

### Code Organization

- **Separation of Concerns**: Controller → Service → Repository
- **Single Responsibility**: Svaka funkcija treba da radi jednu stvar
- **DRY**: Izbegavaj dupliranje koda, ekstraktuj u utility funkcije
- **JSDoc**: Dokumentuj javne funkcije i klase

### Git Workflow

1. Kreiramo feature branch: `git checkout -b feature/naziv-feature-a`
2. Commit poruke: `feat: dodaj inventory modul`
3. Push i kreiramo Pull Request
4. Code review pre merge-a

## Testing

### API Testovi

Testovi se nalaze u `apps/api/tests/`:

```bash
# Pokreni sve testove
bun run test

# Watch mode
bun run test:watch
```

Primer testa:

```typescript
import { test } from "vitest";
import { buildServer } from "../src/server";

test("GET /api/accounts", async () => {
  const app = await buildServer();
  const response = await app.inject({
    method: "GET",
    url: "/api/accounts"
  });
  
  expect(response.statusCode).toBe(200);
});
```

### Dashboard Testovi

```bash
cd apps/dashboard
bun run test
```

## Database

### Migracije

1. **Generiši migraciju**:
   ```bash
   bun run db:generate -- --name naziv_migracije
   ```

2. **Primeni migracije**:
   ```bash
   bun run db:migrate
   ```

3. **Seed podaci**:
   ```bash
   bun run db:seed
   ```

### Database Schema

Šeme se definišu u `apps/api/src/db/schema/` koristeći Drizzle ORM.

Primer:

```typescript
import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const inventory = pgTable("inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
```

## API Development

Detaljniji vodič za API development se nalazi u [API_DEVELOPMENT.md](./API_DEVELOPMENT.md).

Ključni koncepti:
- OpenAPI dokumentacija za sve rute
- Validacija preko JSON Schema
- Standardizovani error handling
- Caching za performanse
- Metrics za monitoring

## Deployment

### OpenShift Deployment

Projekat se deploy-uje na OpenShift koristeći Tekton pipeline.

1. **Bootstrap resurse**:
   ```bash
   oc apply -f openshift/runtime-config.yaml
   oc apply -f openshift/postgresql.yaml
   oc apply -f openshift/imagestream.yaml
   oc apply -f openshift/deploymentconfig.yaml
   oc apply -f openshift/service.yaml
   oc apply -R -f openshift/tekton/
   ```

2. **Trigger pipeline**:
   ```bash
   tkn pipeline start crm-monorepo-pipeline \
     -p git-repo-url=<repo-url> \
     -p git-revision=main \
     --serviceaccount pipeline
   ```

Detaljnije u [README.md](../README.md#deploying-with-tekton-on-openshift).

## Troubleshooting

### Port već zauzet

```bash
# Proveri koji proces koristi port
lsof -ti:4000 | xargs kill -9
```

### Database konekcija

Proveri `DATABASE_URL` u `.env.local` fajlu. Ako koristiš Docker:

```bash
docker compose ps
docker compose logs postgres
```

### Module nije registrovan

Proveri da li modul ima `index.ts` sa default export-om Fastify plugin-a.

### OpenAPI dokumentacija ne prikazuje rute

Proveri da li rute imaju definisane `schema` objekte sa `tags`, `summary` i `description`.

### Cache problemi

Ako imaš probleme sa cache-om, možeš ga resetovati:

```bash
# Redis CLI
redis-cli FLUSHALL
```

Ili u kodu:

```typescript
await request.cache?.deletePattern("pattern:*");
```

## Dodatni Resursi

- [API Development Guide](./API_DEVELOPMENT.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [API README](../apps/api/README.md)
- [Dashboard README](../apps/dashboard/README.md)

