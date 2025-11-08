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
- **People** – HR pregled i planiranje prisutnosti.
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

## Accounts stranica

- Nova stranica se nalazi na `app/dashboard/(auth)/accounts/page.tsx`.
- Fetch se izvršava serverski (`COLLECTOR_API_URL + /api/accounts`) i koristi deljene tipove iz `@crm/types`.
- Tabela je izgrađena preko shadcn/ui komponenti i prikazuje osnovne informacije (naziv, tip, email, telefon, datumi).
- U slučaju greške API-ja, korisnik dobija destruktivni alert i može ručno da pokuša ponovo.

Test pokriva renderovanje tabele i empty state-a (`apps/dashboard/__tests__/accounts-table.test.tsx`) koristeći Vitest i React Testing Library:

```sh
bun run test
```

## E2E tok (lokalno)

1. U `apps/api` izvršite:
   ```sh
   bun install
   bun run db:migrate
   bun run db:seed
   bun run dev
   ```
2. U `apps/dashboard` podesite `.env.local` sa `COLLECTOR_API_URL=http://localhost:4000` i startujte frontend:
   ```sh
   bun install
   bun run dev
   ```
3. Otvorite `http://localhost:3000/dashboard/accounts` i proverite da li su se prikazala seedovana dva naloga.

Seed podaci služe kao mock scenario za demo i QA, pa se lako mogu proširiti ili osvežiti ponovnim pokretanjem `bun run db:seed`.