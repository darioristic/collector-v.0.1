# Seed podaci

Planirano je da svaki modul dobije svoj `*.seed.ts` fajl sa osnovnim mock podacima. Ovi fajlovi koriste Drizzle ORM i `db` instancu iz `src/db/index.ts` kako bi popunili bazu za razvoj i testiranje.

## Implementirano

- `accounts.ts` – kreira demonstracione naloge i kontakte
- `sales.ts` – generiše proizvode, ponude, porudžbine, fakture i stavke (50 orders, 50 invoices, 500 invoice items)

## TODO

- Dodati seed skripte za ostale domene (CRM, HR, Projects...)
- Dodati CLI wrapper za selektivno pokretanje (npr. `bun run seed --module=sales`)
- Razmotriti punjenje payments / inventory podataka kada budu potrebni


