# Plan Optimizacije i Unapređenja Projekta

**Datum analize**: 11. novembar 2025
**Verzija**: 1.0

---

## 📋 Executive Summary

Analiza je otkrila nekoliko **kritičnih performance problema** i mogućnosti za optimizaciju:

- ❌ **N+1 Query Problem** - Svaki `getById()` poziv radi 2-5 dodatnih queries
- ❌ **Nema Caching Sistema** - Svi API pozivi idu direktno u bazu
- ❌ **Nedostaju Database Indeksi** - Značajno usporavanje upita
- ❌ **Nema Error Handling-a** - Rizik od data inconsistency
- ⚠️ **Duplicirani Count Queries** - 2 query-ja za pagination umesto 1

**Procenjeno ubrzanje nakon implementacije**: **5-10x brže** za česte operacije

---

## 🔴 KRITIČNI PROBLEMI (HITNO)

### 1. N+1 Query Problem

**Lokacije:**
- `apps/api/src/modules/sales/orders.service.ts:79-84`
- `apps/api/src/modules/sales/quotes.service.ts:115-119`
- `apps/api/src/modules/projects/projects.service.ts:288-293`

**Problem:**
```typescript
// LOŠE - 2 query-ja
const [order] = await db.select().from(orders).where(eq(orders.id, id));
const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
```

**Rešenje:**
```typescript
// DOBRO - 1 query sa JOIN-om
const result = await db
  .select({ order: orders, item: orderItems })
  .from(orders)
  .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
  .where(eq(orders.id, id));
```

**Impact**: Smanjuje broj database calls sa **2-5 na 1** po zahtevu.

---

### 2. Nedostaju Database Indeksi

**Problem**: Queries rade full table scan umesto index scan.

**Rešenje**: Već pripremljena SQL migracija.

**Kako primeniti:**
```bash
cd apps/api
psql $DATABASE_URL -f src/db/migrations/0008_performance_indexes.sql
```

**Impact**: **10-100x brže** queries, pogotovo sa velikim tabelama.

**Najvažniji indeksi:**
```sql
-- Fixes N+1 problem
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_project_tasks_project_id ON project_tasks(project_id);

-- Za filtering
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_company_id ON orders(company_id);

-- Za sorting
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

---

### 3. Nema Error Handling i Transakcija

**Problem:**
```typescript
// Ako items insert fails, order ostaje u bazi bez items!
const [newOrder] = await db.insert(orders).values({...}).returning();
await db.insert(orderItems).values(...); // Može da faila
```

**Rešenje:**
```typescript
await db.transaction(async (tx) => {
  const [newOrder] = await tx.insert(orders).values({...}).returning();
  await tx.insert(orderItems).values(...); // Rollback ako faila
  return newOrder;
});
```

**Impact**: Sprečava **data corruption** u production.

---

## 🟡 VISOK PRIORITET

### 4. Implementacija Redis Caching

**Trenutno**: Svaki API request ide u bazu.
**Cilj**: Keširovati često tražene podatke.

#### Šta Keširovati?

**A. Statički Podaci (TTL: 1-2h)**
```typescript
// Users, Products, Accounts - retko se menjaju
GET /api/settings/users/:id       // Cache 1h
GET /api/products/:id             // Cache 2h
GET /api/accounts/companies/:id   // Cache 1h
```

**B. Liste (TTL: 5-10min)**
```typescript
GET /api/sales/orders?limit=10    // Cache 5min
GET /api/sales/quotes?status=draft // Cache 10min
GET /api/projects/list            // Cache 10min
```

**C. Aggregacije (TTL: 15min)**
```typescript
// ProjectsService.list() aggregates task stats
GET /api/projects/list            // Cache 15min
```

#### Implementacija

**Fajlovi kreirani:**
- ✅ `apps/api/src/lib/cache.service.ts` - Redis cache service
- ✅ `apps/api/src/modules/sales/orders.service.optimized.example.ts` - Primer korišćenja

**Koraci za implementaciju:**

1. **Instalacija Redis-a**
```bash
# macOS
brew install redis
brew services start redis

# Docker
docker run -d -p 6379:6379 redis:7-alpine

# Linux
sudo apt-get install redis-server
sudo systemctl start redis
```

2. **Instalacija dependency-ja**
```bash
cd apps/api
bun add ioredis @types/ioredis
```

3. **Dodati u `.env`**
```bash
REDIS_URL=redis://localhost:6379
```

4. **Registrovati cache plugin u server.ts**
```typescript
import { cachePlugin } from './lib/cache.service';

// U buildServer funkciji, posle CORS-a
await app.register(cachePlugin);
```

5. **Koristiti u servisima**
```typescript
// U konstruktoru
constructor(
  private database: AppDatabase,
  private cache: CacheService
) {}

// Primer korišćenja
async getById(id: number): Promise<Order | null> {
  const cacheKey = `orders:${id}`;

  // Try cache first
  const cached = await this.cache.get<Order>(cacheKey);
  if (cached) return cached;

  // Cache miss - fetch from DB
  const order = await this.fetchFromDatabase(id);

  // Cache za 10 minuta
  await this.cache.set(cacheKey, order, { ttl: 600 });

  return order;
}
```

**Impact**: **50-90% manje** database calls za česte operacije.

---

### 5. Optimizovati Count Queries

**Problem:**
```typescript
// 2 query-ja sa istim WHERE clause
const [data, countResult] = await Promise.all([
  db.select().from(orders).where(whereClause).limit(10),
  db.select({ count: sql`count(*)` }).from(orders).where(whereClause)
]);
```

**Rešenje:**
```typescript
// 1 query sa window function
const data = await db
  .select({
    ...orders,
    totalCount: sql<number>`count(*) over()`
  })
  .from(orders)
  .where(whereClause)
  .limit(10);

const total = data[0]?.totalCount ?? 0;
```

**Lokacije za promenu:**
- `orders.service.ts:52-64`
- `quotes.service.ts:66-84`
- `projects.service.ts:141-158`

**Impact**: **50% manje** queries za paginated endpoints.

---

## 🟢 MEDIUM PRIORITET

### 6. Configuration Management

**Problem**: Tax rate je hardcoded na 20%
```typescript
// orders.service.ts:206
const tax = subtotal.times(0.2); // Hardcoded!
```

**Rešenje**: Pomeriti u config
```typescript
// .env
DEFAULT_TAX_RATE=0.20
EU_TAX_RATE=0.21
UK_TAX_RATE=0.20

// lib/config.ts
export const getTaxRate = (country?: string) => {
  const rates = {
    EU: parseFloat(process.env.EU_TAX_RATE || '0.21'),
    UK: parseFloat(process.env.UK_TAX_RATE || '0.20'),
    DEFAULT: parseFloat(process.env.DEFAULT_TAX_RATE || '0.20')
  };
  return rates[country as keyof typeof rates] || rates.DEFAULT;
};
```

---

### 7. Završiti TODO Tasks

**Lokacije:**
- `hr/employees.controller.ts:22` - Integrisati sa Settings
- `hr/employees.controller.ts:28` - Replace in-memory storage
- `hr/index.ts:6` - Inject Settings i Accounts services
- `hr/attendance.controller.ts:11` - Connect to presence tracking
- `hr/roles.controller.ts:11` - Sync sa Accounts permissions

---

### 8. Remove Console.logs

**Lokacije:**
```bash
apps/api/src/db/seed/index.ts
apps/api/src/db/index.ts
apps/api/src/db/migrate.ts
```

**Zamena**: Već koristite `pino` logger - koristite `fastify.log` umesto `console.log`.

---

## 📊 PERFORMANCE BENCHMARKS

### Pre Optimizacije (Trenutno)

```
GET /api/sales/orders?limit=10
- Database queries: 2 (list + count)
- Response time: ~150ms
- No caching

GET /api/sales/orders/:id
- Database queries: 2 (order + items)
- Response time: ~80ms
- No caching
```

### Posle Optimizacije (Očekivano)

```
GET /api/sales/orders?limit=10
- Database queries: 1 (window function)
- Response time: ~50ms (3x brže)
- Cache hit: ~5ms (30x brže)

GET /api/sales/orders/:id
- Database queries: 1 (JOIN)
- Response time: ~40ms (2x brže)
- Cache hit: ~3ms (27x brže)
```

---

## �� IMPLEMENTACIONI PLAN

### Nedelja 1: Kritični Problemi (40h)

**Dan 1-2: Database Indeksi (8h)**
- [ ] Run migration `0008_performance_indexes.sql`
- [ ] Test performance improvement
- [ ] Monitor slow query log

**Dan 3-4: Fix N+1 Queries (16h)**
- [ ] Refactor `orders.service.ts`
- [ ] Refactor `quotes.service.ts`
- [ ] Refactor `invoices.service.ts`
- [ ] Refactor `projects.service.ts`
- [ ] Write tests
- [ ] Deploy & monitor

**Dan 5: Error Handling & Transactions (8h)**
- [ ] Add transactions to create/update methods
- [ ] Add try-catch blocks
- [ ] Add proper error messages
- [ ] Test rollback scenarios

**Dan 6-7: Testing (8h)**
- [ ] Integration tests
- [ ] Load testing
- [ ] Fix bugs

---

### Nedelja 2: Redis Caching (40h)

**Dan 1: Setup (4h)**
- [ ] Install Redis server
- [ ] Add `ioredis` dependency
- [ ] Configure environment variables

**Dan 2-3: Implementacija Cache Service (16h)**
- [ ] Register cache plugin in server.ts
- [ ] Add cache to all services
- [ ] Implement cache invalidation logic
- [ ] Test cache hits/misses

**Dan 4: Optimizacija Count Queries (8h)**
- [ ] Replace dual queries with window functions
- [ ] Test across all list endpoints
- [ ] Verify pagination still works

**Dan 5: Testing & Monitoring (12h)**
- [ ] Load testing sa/bez cache
- [ ] Monitor Redis memory usage
- [ ] Set up cache hit rate monitoring
- [ ] Document cache TTL policies

---

### Nedelja 3: Medium Priority (40h)

**Dan 1-2: Configuration Management (8h)**
- [ ] Extract tax rates to config
- [ ] Add per-customer settings table
- [ ] Migration for customer-specific configs

**Dan 3-4: Complete TODO tasks (16h)**
- [ ] HR module integrations
- [ ] Settings/Accounts service connections

**Dan 5: Code Cleanup (8h)**
- [ ] Replace console.logs sa logger
- [ ] Remove commented code
- [ ] Update documentation

**Dan 6-7: Final Testing (8h)**
- [ ] End-to-end testing
- [ ] Performance benchmarking
- [ ] Production deployment

---

## 📈 OČEKIVANI REZULTATI

### Performance Improvement
- **API Response Time**: 3-5x brže (bez cache), 10-30x brže (sa cache)
- **Database Load**: 50-70% manji broj queries
- **Scalability**: Može da podrži 5-10x više korisnika

### Code Quality
- **Error Handling**: Značajno smanjen rizik od data corruption
- **Maintainability**: Bolja struktura, lakše za debug
- **Monitoring**: Bolji insights u performance

### Cost Savings
- **Database**: Manje compute zbog indeksa i caching
- **Redis**: Minimalan cost (~$10-20/mesec za starter)
- **ROI**: Okup investicije za 1-2 meseca

---

## 📚 DODATNI RESURSI

### Fajlovi Kreirani

1. **`apps/api/src/lib/cache.service.ts`**
   - Redis cache service sa error handling
   - Fastify plugin integration
   - Cache-aside pattern implementation

2. **`apps/api/src/modules/sales/orders.service.optimized.example.ts`**
   - Kompletno optimizovan primer servisa
   - Prikazuje sve best practices
   - Ready-to-use implementacija

3. **`apps/api/src/db/migrations/0008_performance_indexes.sql`**
   - Svi potrebni database indeksi
   - Detaljni komentari šta svaki index radi
   - pg_trgm extension za text search

4. **`OPTIMIZATION_PLAN.md`** (ovaj dokument)
   - Kompletna dokumentacija
   - Step-by-step plan
   - Benchmark expectations

### Kako Primeniti

**1. Odmah (5 minuta):**
```bash
# Apply database indexes
cd apps/api
psql $DATABASE_URL -f src/db/migrations/0008_performance_indexes.sql
```

**2. Brzo (1-2 sata):**
```bash
# Setup Redis caching
brew install redis  # ili docker run
bun add ioredis @types/ioredis

# Dodati REDIS_URL=redis://localhost:6379 u .env
# Registrovati cache plugin u server.ts
```

**3. Postepeno (1-3 nedelje):**
- Refactor servise jedan po jedan
- Primeni optimized patterns iz `orders.service.optimized.example.ts`
- Test nakon svake promene

---

## ✅ CHECKLIST ZA PRODUCTION

Pre deploy-a u production, proveriti:

- [ ] Svi database indeksi primenjeni
- [ ] Redis server podignut i radi
- [ ] Cache invalidation logika testirana
- [ ] Error handling svuda gde treba
- [ ] Transactions za kritične operacije
- [ ] Performance testing completed
- [ ] Slow query monitoring setup
- [ ] Redis memory limits konfigurisani
- [ ] Backup strategy za Redis (opciono)
- [ ] Documentation ažurirana

---

## 📦 Status Implementacije (novembar 2025)

- ✅ Migracije `0007_project_budget.sql` i `0008_performance_indexes.sql` su prilagođene da budu idempotentne (DO blokovi + helper funkcije) i primenjene na lokalnoj bazi radi validacije.
- ✅ `ProjectsService` sada koristi jedan agregirani upit sa window funkcijama, čuva listu i detalje u Redis cache-u (`projects:list:default`, `projects:detail:{id}`) i briše keš pri svakoj mutaciji (taskovi, timeline, članovi tima, budžet).
- ✅ Fastify modul registruje `ProjectsService` sa globalnim `CacheService`, pa se isti Redis konektor koristi širom aplikacije.
- ✅ Postoji integracioni test (`apps/api/tests/projects.service.test.ts`) koji na realnoj bazi proverava cache hit/miss i invalidaciju nakon insert/update/delete operacija.
- ✅ Orders/Quotes/Invoices servisi već su na novom JOIN + transaction + cache obrascu (commitovi 7a3aad7, d1f8a41).

## 🚀 Koraci za produkciju

1. **Pokreni migracije**  
   ```bash
   cd apps/api
   psql $DATABASE_URL -f src/db/migrations/0007_project_budget.sql
   psql $DATABASE_URL -f src/db/migrations/0008_performance_indexes.sql
   ```
2. **Redis / konfiguracija**  
   - Proveri da je produkcioni Redis dostupan и da `REDIS_URL` (env/secret) pokazuje na ispravnu instancu.
3. **Deploy**  
   - Standardni build/deploy API-a (kontinuirani delivery posle migracija).
4. **Monitoring nakon deploy-a**  
   - Redis hit rate (`projects:list:*`, `projects:detail:*`), logovi za `CacheService`.
   - Postgres slow-query log (`pg_trgm`, indeksi) – očekuje se pad broja full scan upita.
5. **Test / fallback**  
   - Po potrebi pokreni integracioni test lokalno:  
     `bunx vitest run tests/projects.service.test.ts` (zahteva `TEST_DATABASE_URL` prema izolovanoj bazi).

Napomena: obavezno zadrži migracione helper funkcije u repo-u – omogućavaju bezbolnu primenu čak i kada deo šeme već postoji (tipično na stage/prod bazama).

---

## 🤝 PITANJA?

Za dodatna pitanja ili pomoć pri implementaciji:
- Pogledaj primer servise u `*.optimized.example.ts` fajlovima
- Testuj na development environment prvo
- Monitor logs za greške i warnings
- Proveri Redis memory usage nakon deploy-a

**Uspešnu optimizaciju! 🚀**