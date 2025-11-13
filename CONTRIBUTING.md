# Contributing Guidelines

Hvala što razmatraš doprinos Collector Dashboard projektu! Ovaj dokument sadrži smernice za doprinos projektu.

## Sadržaj

- [Code of Conduct](#code-of-conduct)
- [Pull Request Proces](#pull-request-proces)
- [Code Review Standards](#code-review-standards)
- [Commit Message Format](#commit-message-format)
- [Branch Naming Conventions](#branch-naming-conventions)
- [Coding Standards](#coding-standards)

## Code of Conduct

### Naša obaveza

Mi kao članovi, saradnici i lideri se obavezujemo da učinimo učešće u našoj zajednici iskustvom bez uznemiravanja za sve, bez obzira na starost, veličinu tela, vidljivu ili nevidljivu invalidnost, etničku pripadnost, polne karakteristike, identitet i izražavanje polne pripadnosti, nivo iskustva, obrazovanje, socio-ekonomski status, nacionalnost, lični izgled, rasu, religiju ili seksualni identitet i orijentaciju.

### Naši standardi

Primeri ponašanja koje doprinosi pozitivnom okruženju:

- Korišćenje prijateljskog i uključivog jezika
- Poštovanje različitih tačaka gledišta i iskustava
- Graciozno prihvatanje konstruktivne kritike
- Fokusiranje na ono što je najbolje za zajednicu
- Pokazivanje empatije prema drugim članovima zajednice

## Pull Request Proces

### 1. Pre nego što počneš

- Proveri da li već postoji issue ili PR za tvoj feature/bugfix
- Ako radiš na većem feature-u, prvo kreiraj issue za diskusiju
- Pročitaj [Developer Guide](./docs/DEVELOPER_GUIDE.md) i [API Development Guide](./docs/API_DEVELOPMENT.md)

### 2. Kreiramo Branch

```bash
# Kreiramo feature branch
git checkout -b feature/naziv-feature-a

# Ili bugfix branch
git checkout -b fix/naziv-bugfix-a
```

### 3. Razvoj

- Piši čist, čitljiv kod
- Dodaj testove za novi kod
- Ažuriraj dokumentaciju ako je potrebno
- Proveri da li kod prolazi lint i testove

### 4. Commit

- Koristi konvencionalne commit poruke (vidi ispod)
- Commit-uj često sa smislenim porukama
- Ne commit-uj velike fajlove ili build artefakte

### 5. Push i Pull Request

```bash
git push origin feature/naziv-feature-a
```

Kreiraj Pull Request na GitHub-u sa:

- **Jasan naslov** - Kratak opis promene
- **Opis** - Detaljniji opis šta i zašto
- **Link ka issue-u** - Ako postoji povezani issue
- **Screenshots** - Ako je UI promena
- **Checklist** - Proveri da li je sve urađeno

### 6. Code Review

- Odgovori na review komentare
- Ako ne slažeš sa nekim komentarom, diskutuj konstruktivno
- Ako je potrebno, napravi dodatne commit-e

### 7. Merge

- PR će biti merge-ovan nakon odobrenja od strane maintainer-a
- Maintainer će squash-ovati commit-e pre merge-a

## Code Review Standards

### Šta tražimo u review-u

1. **Funkcionalnost**
   - Da li kod radi kako treba?
   - Da li su pokriveni edge case-ovi?

2. **Kvalitet koda**
   - Da li je kod čitljiv i održiv?
   - Da li sledi coding standards?
   - Da li ima dupliran kod?

3. **Testovi**
   - Da li postoje testovi?
   - Da li testovi pokrivaju novi kod?
   - Da li testovi prolaze?

4. **Dokumentacija**
   - Da li je dokumentacija ažurirana?
   - Da li su JSDoc komentari dodati?
   - Da li su OpenAPI šeme ažurirane?

5. **Performance**
   - Da li postoje performance problemi?
   - Da li se koristi caching gde je potrebno?

### Review Checklist

- [ ] Kod prolazi lint (`bun run lint`)
- [ ] Testovi prolaze (`bun run test`)
- [ ] Dokumentacija je ažurirana
- [ ] Nema console.log ili debug koda
- [ ] Nema hardcoded vrednosti
- [ ] Error handling je implementiran
- [ ] Security je razmotren

## Commit Message Format

Koristimo [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - Nova funkcionalnost
- `fix` - Bug fix
- `docs` - Promene u dokumentaciji
- `style` - Formatiranje, nedostajući semicolon-i, itd.
- `refactor` - Refaktorisanje koda
- `perf` - Performance poboljšanja
- `test` - Dodavanje ili izmena testova
- `chore` - Maintenance zadaci

### Scope (opciono)

- `api` - Backend API promene
- `dashboard` - Frontend promene
- `db` - Database promene
- `docs` - Dokumentacija

### Primeri

```
feat(api): dodaj inventory modul

Dodaje novi inventory modul sa CRUD operacijama.
Implementira caching za poboljšanje performansi.

Closes #123
```

```
fix(dashboard): ispravi paginaciju na accounts stranici

Paginacija nije radila kada se menjao filter.
Sada se resetuje na prvu stranicu pri promeni filtera.

Fixes #456
```

```
docs: ažuriraj API development guide

Dodaje sekciju o caching strategiji i best practices.
```

## Branch Naming Conventions

### Format

```
<type>/<short-description>
```

### Types

- `feature/` - Nove funkcionalnosti
- `fix/` - Bug fix-ovi
- `docs/` - Dokumentacija
- `refactor/` - Refaktorisanje
- `test/` - Testovi
- `chore/` - Maintenance

### Primeri

```
feature/inventory-management
fix/accounts-pagination
docs/api-development-guide
refactor/sales-service
test/inventory-controller
chore/update-dependencies
```

## Coding Standards

### TypeScript

- Koristi striktne tipove, izbegavaj `any`
- Koristi `interface` za objekte, `type` za unije i intersection types
- Eksplicitno tipizuj funkcije

```typescript
// Dobro
interface User {
  id: string;
  name: string;
}

function getUser(id: string): Promise<User | null> {
  // ...
}

// Loše
function getUser(id: any): any {
  // ...
}
```

### Naming Conventions

- **Klase**: PascalCase (`InventoryService`)
- **Funkcije/Varijable**: camelCase (`listInventory`)
- **Konstante**: UPPER_SNAKE_CASE (`MAX_ITEMS`)
- **Fajlovi**: kebab-case (`inventory.service.ts`)

### Error Handling

Uvek koristi `createHttpError` za konzistentne greške:

```typescript
import { createHttpError } from "../../lib/errors";

if (!item) {
  return reply.status(404).send(
    createHttpError(404, "Item not found", { error: "Not Found" })
  );
}
```

### Logging

Koristi `request.log` za logovanje:

```typescript
request.log.info({ itemId: id }, "Fetching item");
request.log.error({ err: error }, "Failed to fetch item");
```

### Testing

- Piši testove za sve nove funkcionalnosti
- Testiraj i success i error slučajeve
- Koristi opisne test nazive

```typescript
test("GET /api/inventory returns list of items", async () => {
  // ...
});

test("GET /api/inventory/:id returns 404 for non-existent item", async () => {
  // ...
});
```

### Documentation

- Dodaj JSDoc komentare za javne funkcije
- Dokumentuj kompleksnu logiku
- Ažuriraj OpenAPI šeme za nove rute

```typescript
/**
 * Handler za listanje inventarskih stavki.
 * 
 * @route GET /api/inventory
 * @returns Lista svih inventarskih stavki
 */
export const listInventoryHandler: RouteHandler = async (request) => {
  // ...
};
```

## Dodatni Resursi

- [Developer Guide](./docs/DEVELOPER_GUIDE.md)
- [API Development Guide](./docs/API_DEVELOPMENT.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)

## Pitanja?

Ako imaš pitanja, slobodno kreiraj issue ili kontaktiraj maintainer-e.

Hvala na doprinosu! 🎉

