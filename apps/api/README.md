# Collector Dashboard API

Fastify servis koji napaja Collector Dashboard aplikaciju. Projekat je pisan u TypeScript-u i koristi modularnu arhitekturu (`src/modules/**`) kako bi svaki domen bio izolovan i lako proširiv.

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

## Alati i arhitektura

- Fastify 4 sa plugin arhitekturom (`src/plugins/**`)
- Pino logger sa `pino-pretty` transportom u development okruženju (JSON logovi u produkciji)
- Vitest za testiranje
- `@crm/types` paket sa deljenim tipovima u monorepu
- Standardizovani error helper (`src/lib/errors.ts`)
- Automatsko registrovanje modula preko `src/server.ts`

