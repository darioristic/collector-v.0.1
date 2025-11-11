# Collector Dashboard Frontend

Next.js 16 aplikacija koja prikazuje prodajne, CRM, projekatske i HR panele za Collector platformu. UI je zasnovan na shadcn/ui komponentama, sa temama podešenim da prate smernice brenda (hladne palete, narandžasta rezervisana za CTA elemente).

## Pokretanje

U korenu monorepa:

```sh
bun install
bun run dev
```

Dashboard je dostupan na `http://localhost:3000`, a API servis na `http://localhost:4000`.

### Promenljive okruženja

Dashboard čita konfiguraciju iz `.env.local` (root) ili `apps/dashboard/.env`. Najvažnije vrednosti:

```ini
COLLECTOR_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GA_ID=
```

`COLLECTOR_API_URL` je baza za server-side pozive prema API-ju (npr. `/api/accounts`). `NEXT_PUBLIC_APP_URL` se koristi za generisanje canonical meta podatka i OpenGraph linkova. Ako nije definisan, koristi se `http://localhost:3000`.

## Navigacija

Glavne sekcije su fokusirane na domen aplikacije:

- **Sales** – prodajni KPI, nalozi, fakture i plaćanja.
- **CRM** – accounts, leads i sales pipeline.
- **Projects** – portfelj projekata i radni board.
- **People / HR** – nova stranica `HR › Employees` za kompletno upravljanje zaposlenima (liste, filteri, drawer, modal) + legacy HR pregled i planiranje prisutnosti.
- **Settings** – podešavanja radnog prostora i profil korisnika.

Sekundarne demonstracione stranice iz originalnog template-a više nisu prikazane u glavnom meniju, ali su i dalje dostupne direktno ukoliko zatrebaju tokom razvoja.

## Teme i brending

Default tema je `lake-view` (hladna plava paleta). Ostale teme su i dalje dostupne u Theme panelu, ali narandžaste varijacije su uklonjene iz podrazumevanog izgleda.

Logotip i meta podaci su prilagođeni Collector brendu (`Collector Dashboard`), a fallback ikone/metapodaci iz template-a su obrisani.

## Struktura

- `app/` – Next.js App Router stranice
- `components/` – layout, sidebar, UI helperi i shadcn wrapper-i
- `lib/` – teme, util funkcije, fontovi

Za deljeni kod koristimo `packages/ui` i `packages/types` pakete iz monorepa.

## HR Employees stranica

- Server komponenta živi na `app/(protected)/hr/employees/page.tsx` i prosleđuje inicijalni query klijentskom delu (`employees-page-client.tsx`).
- Klijentska logika koristi React Query (`useInfiniteQuery`) za cursor-based paginaciju i optimistične mutacije (`create/update/delete`).
- UI je podeljen u module (`components/` folder) – toolbar sa pretragom/filterima, TanStack tabela, responsive kartice za mobile, side drawer sa framer-motion animacijama, modal (react-hook-form + zod), delete alert.
- API rute (`app/api/employees/`) rade CRUD operacije (Next.js route handlers + Drizzle ORM), a testski fajl (`__tests__/employees-api.test.ts`) mockuje data sloj da bismo validirali happy/invalid tokove bez pravog DB-a.
- UI test (`__tests__/employees-ui.test.tsx`) pokriva modal validaciju, empty state i paginaciju ("Load more" dugme).
- Navigacija/sidebar imaju novu stavku `HR › Employees`.

## E2E tok (lokalno)

1. In `apps/api` run:
   ```sh
   bun install
   bun run db:migrate
   bun run db:seed
   bun run dev
   ```
2. In `apps/dashboard` create `.env.local` with `COLLECTOR_API_URL=http://localhost:4000` and launch the frontend:
   ```sh
   bun install
   bun run dev
   ```
3. Open `http://localhost:3000/accounts/companies` and confirm that 50 seeded companies (each with two related contacts) are listed. Optionally visit `http://localhost:3000/accounts/contacts` to review all 100 contacts.

Seed data acts as a mock scenario for demos and QA, and you can refresh it at any time by running `bun run db:seed` again.

## Vault migracije i seed

- Drizzle konfiguracija se nalazi u `drizzle.config.ts`, a šeme u `lib/db/schema`.
- Generisanje nove migracije:
  ```sh
  bun run db:generate -- --name naziv_migracije
  ```
- Primena migracija nad PostgreSQL bazom (koristi `lib/db/migrate.ts`):
  ```sh
  bun run db:migrate
  ```
- Pokretanje lokalnog seeda za Vault root foldere:
  ```sh
  bun run db:seed
  ```
- U CI okruženju pokreti `bun run db:migrate` i `bun run db:seed` iz korena monorepa – skripte će izvršiti i API i dashboard migracije/seed u ispravnom redosledu.