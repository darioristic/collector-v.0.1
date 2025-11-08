# Drizzle migracije

Ovaj direktorijum sadrži generisane migracione fajlove. Nakon što definišemo početnu šemu, pokreni `pnpm --filter api drizzle-kit generate` (ili odgovarajući script) i commituј izlaz kako bi svi servisi delili istu strukturu baze.

# Drizzle migracije

Ovaj direktorijum čuva generisane migracije. Nakon što konfigurišemo Drizzle migracioni CLI, ovde će se pojavljivati SQL fajlovi koje primenjujemo na PostgreSQL bazu.

TODO:

- Dodati `drizzle.config.ts` u korenu monorepo-a sa putanjama ka `apps/api/src/db`
- Podesiti skripte u `package.json` za generisanje i primenu migracija (`drizzle-kit generate`, `drizzle-kit push`)
- Razmotriti verzionisanje migracija kroz CI/CD korak


