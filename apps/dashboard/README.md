# Collector Dashboard Frontend

Next.js 16 aplikacija koja prikazuje prodajne, CRM, projekatske i HR panele za Collector platformu. UI je zasnovan na shadcn/ui komponentama, sa temama podešenim da prate smernice brenda (hladne palete, narandžasta rezervisana za CTA elemente).

## Dokumentacija

- 📖 [Developer Guide](../../docs/DEVELOPER_GUIDE.md) - Kompletan vodič za developere
- 🏗️ [Architecture Overview](../../docs/ARCHITECTURE.md) - Pregled arhitekture sistema

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

### App Router Struktura

- `app/(protected)/` – Zaštićene rute koje zahtevaju autentifikaciju
  - `accounts/` – Accounts stranice
  - `sales/` – Sales stranice (quotes, orders, invoices)
  - `crm/` – CRM stranice (leads, opportunities)
  - `projects/` – Projects stranice
  - `hr/` – HR stranice (employees, attendance)
  - `settings/` – Settings stranice
- `app/(public)/` – Javne rute (login, register)
- `app/api/` – Next.js API rute (route handlers)

### Komponente

- `components/ui/` – shadcn/ui komponente
- `components/layout/` – Layout komponente (sidebar, header, navigation)
- `components/projects/` – Project-specifične komponente
- `components/quotes/` – Quote komponente
- `components/invoices/` – Invoice komponente
- `components/orders/` – Order komponente
- `components/payments/` – Payment komponente

### State Management

- **React Query** (`@tanstack/react-query`) – Server state management
- **React Hook Form** – Form state management
- **Zod** – Schema validacija

Za deljeni kod koristimo `packages/ui` i `packages/types` pakete iz monorepa.

## Best Practices

### React Komponente

1. **Server vs Client Components**
   - Koristi Server Components gde je moguće (default u Next.js 13+)
   - Koristi `"use client"` samo kada je potrebno (hooks, event handlers, browser APIs)

2. **Component Organization**
   - Jedna komponenta po fajlu
   - Ime fajla = ime komponente (PascalCase)
   - Eksportuj default komponentu

3. **Props Typing**
   - Uvek tipizuj props sa TypeScript interfejsima
   - Koristi `React.FC` ili eksplicitno tipizuj funkciju

```typescript
// Dobro
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export default function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

### Data Fetching

1. **Server Components**
   - Fetch podatke direktno u Server Components
   - Koristi `fetch` sa Next.js caching opcijama

2. **Client Components**
   - Koristi React Query za server state
   - Koristi `useInfiniteQuery` za paginaciju
   - Implementiraj optimistične mutacije

```typescript
// Primer sa React Query
import { useQuery } from "@tanstack/react-query";

function AccountsList() {
  const { data, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch("/api/accounts");
      return res.json();
    }
  });
  
  if (isLoading) return <div>Loading...</div>;
  return <div>{/* render data */}</div>;
}
```

### Form Handling

- Koristi React Hook Form za form state
- Validacija sa Zod schemas
- Error handling i display

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email")
});

function AccountForm() {
  const form = useForm({
    resolver: zodResolver(schema)
  });
  
  // ...
}
```

### Styling

- Koristi Tailwind CSS utility classes
- Koristi shadcn/ui komponente kao bazu
- Custom komponente u `components/ui/`
- Teme se definišu u `lib/themes/`

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

## Testing

### Unit Testovi

Testovi se nalaze u `__tests__/` folderu:

```bash
bun run test
```

### Testiranje Komponenti

Koristi Vitest i React Testing Library:

```typescript
import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";
import Button from "./Button";

test("renders button with label", () => {
  render(<Button label="Click me" onClick={() => {}} />);
  expect(screen.getByText("Click me")).toBeInTheDocument();
});
```

## Troubleshooting

### Build greške

Ako build pada:

```bash
# Očisti Next.js cache
rm -rf .next
bun run build
```

### Styling problemi

Ako Tailwind stilovi ne rade:

1. Proveri `tailwind.config.js`
2. Proveri da li su klase u `globals.css`
3. Restartuj dev server

### API konekcija

Ako dashboard ne može da se poveže sa API-jem:

1. Proveri `COLLECTOR_API_URL` u `.env.local`
2. Proveri da li je API server pokrenut
3. Proveri CORS podešavanja u API-ju