# Architecture Overview

Detaljan pregled arhitekture Collector Dashboard sistema.

## Sadržaj

- [Monorepo Struktura](#monorepo-struktura)
- [Modulna Arhitektura](#modulna-arhitektura)
- [Database Schema](#database-schema)
- [Integracije](#integracije)
- [Deployment Arhitektura](#deployment-arhitektura)

## Monorepo Struktura

Projekat je organizovan kao Bun workspace monorepo:

```
Collector-Dashboard/
├── apps/
│   ├── api/                    # Backend API server (Fastify)
│   └── dashboard/              # Frontend aplikacija (Next.js)
├── packages/
│   ├── types/                  # Deljeni TypeScript tipovi
│   ├── ui/                     # Deljene UI komponente
│   └── config/                 # Deljene konfiguracije
├── services/                   # Mikroservisi
│   ├── chat-service/           # Chat servis
│   └── notification-service/   # Notification servis
└── docs/                       # Dokumentacija
```

### Workspace Packages

- **@crm/types** - Deljeni tipovi između frontend-a i backend-a
- **@crm/ui** - Deljene React komponente
- **@crm/config** - Deljene ESLint, Tailwind i TypeScript konfiguracije

## Modulna Arhitektura

### API Moduli

API koristi modularnu arhitekturu gde svaki modul predstavlja poslovni domen:

#### Accounts Modul
- **Svrha**: Upravljanje klijentskim nalozima i kontaktima
- **Rute**: `/api/accounts`
- **Komponente**:
  - `AccountsRepository` - Data access layer
  - `AccountsController` - Request handlers
  - `AccountsService` - Business logic

#### Sales Modul
- **Svrha**: Upravljanje prodajnim procesima
- **Rute**: `/api/sales/*`
- **Podmoduli**:
  - Quotes (Ponude)
  - Orders (Porudžbine)
  - Invoices (Fakture)
  - Payments (Plaćanja)
- **Komponente**:
  - `SalesService` - Centralni servis
  - `QuotesService`, `OrdersService`, `InvoicesService`, `PaymentsService`
  - Export funkcionalnosti (CSV, PDF)

#### CRM Modul
- **Svrha**: Customer Relationship Management
- **Rute**: `/api/crm/*`
- **Entiteti**:
  - Leads (Potencijalni klijenti)
  - Opportunities (Prodajne prilike)
  - Activities (Aktivnosti)
- **Komponente**:
  - `CRMService` - Business logic
  - `LeadsController`, `OpportunitiesController`, `ActivitiesController`

#### Projects Modul
- **Svrha**: Upravljanje projektima
- **Rute**: `/api/projects/*`
- **Funkcionalnosti**:
  - Projekti sa zadacima
  - Timeline i milještoci
  - Tim upravljanje
  - Budžet praćenje
- **Komponente**:
  - `ProjectsService` - Business logic sa caching-om
  - `TasksController`, `MilestonesController`, `TeamController`, `BudgetController`

#### HR Modul
- **Svrha**: Human Resources upravljanje
- **Rute**: `/api/hr/*`
- **Entiteti**:
  - Employees (Zaposleni)
  - Roles (Uloge)
  - Attendance (Prisutnost)
- **Komponente**:
  - `EmployeesController`, `RolesController`, `AttendanceController`

#### Settings Modul
- **Svrha**: Podešavanja sistema
- **Rute**: `/api/settings/*`
- **Funkcionalnosti**:
  - User management
  - Team management
  - Permissions
  - Integrations

#### Search Modul
- **Svrha**: Globalna pretraga kroz sve module
- **Rute**: `/api/search`
- **Funkcionalnosti**:
  - Cross-module search
  - Search suggestions

### Modul Pattern

Svaki modul sledi isti pattern:

```
module/
├── index.ts              # Fastify plugin export
├── module.routes.ts      # Route definitions
├── module.controller.ts  # Request handlers
├── module.service.ts     # Business logic
├── module.schema.ts      # OpenAPI schemas
└── module.types.ts       # TypeScript types
```

### Plugin System

Fastify plugin-i omogućavaju modularnost:

- **CORS Plugin** - Cross-origin resource sharing
- **Error Handler Plugin** - Globalni error handling
- **OpenAPI Plugin** - API dokumentacija
- **Metrics Plugin** - Performance monitoring
- **Cache Plugin** - Redis caching

## Database Schema

### Glavne Tabele

#### Accounts
- `accounts` - Klijentski nalozi
- `account_contacts` - Kontakti povezani sa nalozima

#### Sales
- `quotes` - Ponude
- `quote_items` - Stavke ponuda
- `orders` - Porudžbine
- `order_items` - Stavke porudžbina
- `invoices` - Fakture
- `invoice_items` - Stavke faktura
- `payments` - Plaćanja

#### CRM
- `leads` - Potencijalni klijenti
- `opportunities` - Prodajne prilike
- `client_activities` - Aktivnosti povezane sa klijentima

#### Projects
- `projects` - Projekti
- `project_tasks` - Zadaci unutar projekata
- `project_milestones` - Milještoci
- `project_members` - Članovi tima
- `project_budget_categories` - Budžet kategorije

#### HR
- `employees` - Zaposleni
- `roles` - HR uloge
- `attendance` - Evidencija prisutnosti

#### Settings
- `users` - Korisnici sistema
- `teams` - Timovi
- `permissions` - Dozvole

### Database Migracije

Migracije se upravljaju kroz Drizzle ORM:

- Migracije se generišu: `bun run db:generate`
- Primena migracija: `bun run db:migrate`
- Seed podaci: `bun run db:seed`

## Integracije

### Redis

Koristi se za:
- Caching API response-ova
- Session storage
- Rate limiting

### PostgreSQL

Glavna baza podataka za:
- Svi poslovni podaci
- User management
- Audit logs

### Mikroservisi

#### Chat Service
- WebSocket komunikacija
- Real-time messaging
- Room management

#### Notification Service
- Push notifikacije
- Email notifikacije
- In-app notifikacije

## Deployment Arhitektura

### OpenShift Deployment

Sistem se deploy-uje na OpenShift koristeći:

1. **StatefulSet** - PostgreSQL baza podataka
2. **DeploymentConfig** - API i Dashboard aplikacije
3. **Service** - Load balancer
4. **Route** - External access
5. **ConfigMap** - Konfiguracije
6. **Secret** - Tajne (database credentials, API keys)

### Tekton Pipeline

CI/CD pipeline koristi Tekton:

1. **Quality Check** - Lint i testovi
2. **Build** - Docker image build
3. **Push** - Push na registry
4. **Migrate** - Database migracije
5. **Deploy** - Rollout novih verzija
6. **Health Check** - Post-deploy verifikacija

### Environment Variables

#### API
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `PORT` - Server port (default: 4000)
- `HOST` - Server host (default: 0.0.0.0)

#### Dashboard
- `NEXT_PUBLIC_API_BASE_URL` - API base URL
- `NEXT_PUBLIC_GA_ID` - Google Analytics ID

## Performance Optimizacije

### Caching Strategy

- **Redis Cache** - API response caching (TTL: 15 minuta)
- **Cache Invalidation** - Automatsko invalidiranje pri mutacijama
- **Cache Patterns** - List caching, detail caching

### Database Optimizacije

- **Indexes** - Na često query-ovane kolone
- **Aggregated Queries** - Window functions za statistike
- **Connection Pooling** - Drizzle connection pool

### Frontend Optimizacije

- **Next.js SSR/SSG** - Server-side rendering
- **React Query** - Client-side caching
- **Code Splitting** - Lazy loading komponenti

## Security

### Autentifikacija

- JWT tokeni za API autentifikaciju
- Session management za web aplikaciju

### Autorizacija

- Role-based access control (RBAC)
- Permission system

### Data Validation

- OpenAPI schema validacija
- Input sanitization
- SQL injection prevention (Drizzle ORM)

## Monitoring

### Health Checks

- `/api/health` - Basic health check
- `/api/health/detailed` - Detailed health sa database i Redis statusom
- `/api/health/ready` - Readiness probe
- `/api/health/live` - Liveness probe

### Metrics

- `/api/metrics` - Performance metrics
  - Response times
  - Cache hit rates
  - Database query times

### Logging

- **Pino Logger** - Structured logging
- **Development** - Pretty printing
- **Production** - JSON format za agregaciju

## Dodatni Resursi

- [Developer Guide](./DEVELOPER_GUIDE.md)
- [API Development Guide](./API_DEVELOPMENT.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

