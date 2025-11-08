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

2. **Run the apps in development**

   ```sh
   bun run dev
   ```

   This starts the dashboard and the API in parallel.

3. **Build all workspaces**

   ```sh
   bun run build
   ```

4. **Lint using the shared configuration**

   ```sh
   bun run lint
   ```

## Notes

- The dashboard app keeps its original Tailwind and shadcn/ui setup.
- Workspace path aliases are defined in `tsconfig.base.json` for `@crm/ui/*` and `@crm/types/*`.
- The API server listens on port `4000` by default; override with the `PORT` environment variable if needed.

## Deploying with Tekton on OpenShift

1. **Bootstrap OpenShift resources**

   ```sh
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

The pipeline builds both applications with Node 20 + pnpm, produces container images via `buildah` inside Tekton, pushes them to the OpenShift internal registry, and then rolls out the corresponding `DeploymentConfig` objects. The frontend build keeps the existing Tailwind and shadcn configuration intact—no additional customisation is performed during the CI/CD process.

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
