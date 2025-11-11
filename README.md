# Collector Dashboard Monorepo

This repository is organised as a Bun workspace that contains the existing Next.js dashboard together with new backend and shared packages.

## Structure

- `apps/dashboard` – existing Next.js + shadcn/ui application (left untouched apart from tsconfig inheritance).
- `apps/api` – Fastify server written in TypeScript, exposes `/api/health`.
- `packages/ui` – placeholder for shared shadcn/ui React components.
- `packages/types` – shared TypeScript types (currently exports a sample `User` type).
- `packages/config` – centralised ESLint, Tailwind and TypeScript configuration.

## Getting Started

1. **Install dependencies**

   ```sh
   bun install
   ```

2. **Pokreni razvojno okruženje jednom skriptom**

   ```sh
   bun scripts/dev.ts
   ```

   Podrazumevano se koristi lokalni (Bun) režim:
   - proverava da li su portovi `4000` (API) i `3000` (Next.js) slobodni i po potrebi gasi procese koji ih drže;
   - izvršava Drizzle migracije i seed (`bun run db:migrate`, `bun run db:seed` u `apps/api`);
   - startuje API (`bun run dev` u `apps/api`) i dashboard (`bun run dev` u `apps/dashboard`) uz stream oznake `[api]` i `[web]` u konzoli;
   - bezbedno gasi sve procese na `Ctrl+C`.

   **Docker režim (deterministična infrastruktura):**

   ```sh
   bun scripts/dev.ts --docker
   ```

   Skripta tada:
   - proverava dostupnost Docker Compose-a;
   - pokreće `postgres` i `redis` servise (`docker compose up -d postgres redis`), čeka da pređu u `running/healthy` stanje i ispisuje logove ako se neki servis ugasi;
   - gradi produkcijsku API sliku iz `apps/api/Dockerfile.prod` i podiže `api` servis (`docker compose up -d api`), što automatski pokreće migracije (`node dist/db/migrate.js`) pre starta servera;
   - prati logove svih servisa (`docker compose logs -f postgres redis api`) dok ne prekineš proces;
   - na `Ctrl+C` radi `docker compose down --remove-orphans` i zatvara sve kreirane procese.

   Opcija `--local` forsira lokalni režim čak i ako proslediš `--docker` (korisno kada želiš samo da startuješ procese bez gašenja infrastrukture).

3. **Ručno pokretanje (opciono)**

   Ako ti iz nekog razloga više odgovara ručna kontrola:

   ```sh
   docker compose up -d
   bun run dev
   ```

   Docker Compose pokreće:
   - `postgres:17.2-alpine` na portu `5432` (korisnik/lozinka/baza: `collector / collector / collector`);
   - `redis:7-alpine` na portu `6379`;
   - API kontejner koji sluša na `4000`, izvršava migracije pri startu i koristi prethodne servise.

4. **Build all workspaces**

   ```sh
   bun run build
   ```

5. **Lint using the shared configuration**

   ```sh
   bun run lint
   ```

## Notes

- The dashboard app keeps its original Tailwind and shadcn/ui setup.
- Workspace path aliases are defined in `tsconfig.base.json` for `@crm/ui/*` and `@crm/types/*`.
- The API server listens on port `4000` by default; override with the `PORT` environment variable if needed.

## Environment configuration

The API server loads variables from `.env` / `.env.local` at the repository root (or workspace-specific files). If `DATABASE_URL` is missing, the server automatically falls back to an in-memory `pg-mem` instance so local development works without a dedicated PostgreSQL instance.

```ini
# apps/api
HOST=0.0.0.0
PORT=4000
DATABASE_URL=postgresql://collector:collector@localhost:5432/collector
DB_MAX_CONNECTIONS=10
DB_SSL=false
REDIS_URL=redis://localhost:6379

# apps/dashboard
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_GA_ID=
```

Copy the snippet above into `.env.local` (in the repo root) or into the respective workspace `.env` files before running the applications.

### Database scripts

Additional helper scripts are available from the workspace root:

```sh
# Apply migrations to the configured database
bun run db:migrate

# Seed development data (optional)
bun run db:seed

# Generate SQL migrations from schema changes (advanced)
bun run --filter ./apps/api db:generate
```

## Deploying with Tekton on OpenShift

1. **Bootstrap OpenShift resources**

   ```sh
   oc apply -f openshift/runtime-config.yaml
   oc apply -f openshift/postgresql.yaml
   oc apply -f openshift/imagestream.yaml
   oc apply -f openshift/deploymentconfig.yaml
   oc apply -f openshift/service.yaml
   oc apply -R -f openshift/tekton/
   ```

2. **Trigger the Tekton pipeline**

   ```sh
   tkn pipeline start crm-monorepo-pipeline \
     -p git-repo-url=https://github.com/example/collector-dashboard.git \
     -p git-revision=main \
     -p registry=image-registry.openshift-image-registry.svc:5000 \
     -p namespace=crm-prod \
     -p image-tag=$(date +%Y%m%d%H%M%S) \
     -w name=shared-workspace,claimName=<existing-pvc> \
     --serviceaccount pipeline \
     --use-param-defaults
   ```

   Replace the repo URL, namespace, image tag, and persistent volume claim as needed.

3. **Monitor pipeline execution**

   ```sh
   tkn pipelinerun logs -f
   ```

The pipeline sada uključuje sledeće korake:

- Bun lint i test (`quality-check` task) pre same izgradnje.
- Izgradnja API i dashboard slika, zatim push na interni registry.
- Pokretanje Bun migracija (`run-migrations` task) korišćenjem `DATABASE_URL` tajne.
- Rollout API i dashboard DeploymentConfig objekata.
- Post-deploy health check (`post-deploy-health` task) koji proverava `http://api:4000/api/health`.

Na taj način se build ne nastavlja ukoliko lint/test padnu, migracije se izvršavaju pre puštanja nove verzije, a health check garantuje da je API spreman pre nego što se frontend osveži.

### Runtime konfiguracija i tajne

- `openshift/runtime-config.yaml` definiše:
  - `Secret` pod nazivom `collector-api-secrets` sa ključevima:
    - `DATABASE_URL` – konekcioni string za PostgreSQL (`postgresql://collector:<lozinka>@collector-postgres:5432/collector_dashboard`).
    - `CRM_API_KEY` i `ANALYTICS_API_KEY` – eksterni API ključevi (dodajte stvarne vrednosti pre deploy-a).
  - `Secret` `collector-postgres-credentials` sa креденцијалима (`POSTGRESQL_USER`, `POSTGRESQL_PASSWORD`, `POSTGRESQL_DATABASE`) које користи StatefulSet.
  - `ConfigMap` `dashboard-theme-config` sa вредностима cookie-ja који чувају корисничке теме (`THEME_PRESET_COOKIE`, `THEME_SCALE_COOKIE`, `THEME_RADIUS_COOKIE`, `THEME_CONTENT_LAYOUT_COOKIE`, `THEME_SIDEBAR_MODE_COOKIE`).
- `openshift/postgresql.yaml` креира сервисе (`collector-postgres` и headless варијанту) и StatefulSet базиран на `registry.redhat.io/rhel9/postgresql-15` са persistent storage-ом и препорукама за readiness/liveness probe.
- `openshift/deploymentconfig.yaml` користи наведене ресурсе кроз `envFrom`, тако да су променљиве доступне контејнерима без додатних измена.
- Tekton pipeline параметар `database-secret-name` подразумевано показује на `collector-api-secrets`. Уколико користите другачији назив тајне, проследите га кроз `tkn pipeline start`.

### Observability

- API logger koristi `pino-pretty` u razvojnom okruženju (`NODE_ENV !== "production"`) radi čitljivijeg izlaza, dok u produkciji šalje JSON logove spremne za agregaciju.
- Readiness probe (`/api/health`) je definisana na API DeploymentConfig-u, što omogućava OpenShift-u da blokira saobraćaj ka podu dok servis nije spreman.

### Automatsko pokretanje (CI/CD trigger)

1. **Kreiraj GitHub webhook secret**

   ```sh
   oc create secret generic github-webhook-secret \
     --from-literal=secret=<tvoj-github-secret> \
     -n crm-platform-prod
   ```

2. **Primeni TriggerTemplate, TriggerBinding i EventListener**

   ```sh
   oc apply -f openshift/tekton/triggertemplate.yaml
   oc apply -f openshift/tekton/triggerbinding.yaml
   oc apply -f openshift/tekton/eventlistener.yaml
   ```

3. **Izloži EventListener kao route**

   ```sh
   oc create route edge crm-monorepo-listener \
     --service=el-crm-monorepo-listener \
     --port=http-listener \
     -n crm-platform-prod
   ```

   Zapamti URL koji dobiješ (`oc get route crm-monorepo-listener -o jsonpath='{.spec.host}'`).

4. **Podesi GitHub webhook**

   - Repository → Settings → Webhooks → Add webhook
   - Payload URL: `https://<route-host>`
   - Content type: `application/json`
  - Secret: isti kao u koraku 1
   - Event: “Just the push event”

Sada će svaki push na `main` (ili granu definisanu u CEL filteru unutar `eventlistener.yaml`) automatski pokrenuti `crm-monorepo-pipeline` i odraditi build + rollout bez ručnog kucanja komandi.

# collector-new-2025
# collector-v.0.1
# collector-v.0.1
