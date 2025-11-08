# Seed podaci

Planirano je da svaki modul dobije svoj `*.seed.ts` fajl sa osnovnim mock podacima. Ovi fajlovi će koristiti Drizzle ORM i `db` instancu iz `src/db/index.ts` kako bi popunili bazu za razvoj i testiranje.

# Seed podaci

Ovde možemo držati skripte za inicijalno punjenje baze podataka po modulima (Accounts, CRM, Sales, Products, Projects, HR, Settings).

TODO:

- Kreirati TypeScript skripte koje koriste `db` instancu iz `apps/api/src/db`
- Podeliti seed podatke po domenima (npr. `accounts.seed.ts`, `crm.seed.ts`)
- Dodati npm/pnpm skriptu za pokretanje kompletnog seeda (npr. `pnpm --filter api seed`)


