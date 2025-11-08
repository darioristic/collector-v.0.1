# Collector Dashboard API

Fastify servis koji napaja Collector Dashboard aplikaciju. Projekat je pisan u TypeScript-u i koristi modularnu arhitekturu (`src/modules/**`) kako bi svaki domen bio izolovan i lako proširiv.

## Pokretanje

```sh
bun install
bun run dev
```

Server se podiže na `http://localhost:4000` (možete promeniti preko `PORT` i `HOST` promenljivih okruženja).

## Skripte

- `bun run dev` – pokretanje servera sa hot-reload podrškom.
- `bun run build` – transpajlovanje TypeScript koda u `dist` direktorijum.
- `bun run start` – start produkcijskog build-a.
- `bun run lint` – ESLint provera koda.
- `bun run test` / `bun run test:watch` – Vitest integracioni testovi.

## OpenAPI dokumentacija

Nakon pokretanja servera, kompletna dokumentacija je dostupna na:

- Swagger UI: `GET http://localhost:4000/api/docs`
- JSON specifikacija: `GET http://localhost:4000/api/docs/json`

Dokumentacija se generiše iz Fastify šema, pa sve nove rute treba da definišu `schema` objekat (`summary`, `tags`, `response`, itd.).

## Accounts modul

Accounts modul se nalazi u `src/modules/accounts` i trenutno koristi in-memory repozitorijum (spreman za zamenu bazom podataka). Dostupne rute:

- `GET /api/accounts` – lista svih account-a
- `GET /api/accounts/:id` – detalji konkretnog account-a
- `POST /api/accounts` – kreiranje novog account-a (validacija preko JSON schema)
- `PUT /api/accounts/:id` – izmena postojećeg account-a
- `DELETE /api/accounts/:id` – brisanje account-a

Svaka ruta koristi standardizovani `createHttpError` helper i globalni error handler za konzistentan format grešaka.

## Testiranje

Integracioni testovi se nalaze u `tests/accounts.routes.test.ts` i pokrivaju kompletan CRUD tok. Testovi koriste `fastify.inject`, tako da nije potrebno podizati server tokom izvršavanja.

```sh
bun run test
```

## Alati i arhitektura

- Fastify 4 sa plugin arhitekturom (`src/plugins/**`)
- Vitest za testiranje
- `@crm/types` paket sa deljenim tipovima u monorepu
- Standardizovani error helper (`src/lib/errors.ts`)
- Automatsko registrovanje modula preko `src/server.ts`

