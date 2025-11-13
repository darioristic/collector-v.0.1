# OpenShift Deployment Guide

Ovaj vodič objašnjava kako da deploy-ujete Collector Dashboard aplikaciju na OpenShift platformu.

## Preduslovi

- OpenShift CLI (`oc`) instaliran i konfigurisan
- Pristup OpenShift klasteru
- Docker/Container registry pristup
- Minimum 2GB RAM po pod-u
- Minimum 10GB storage za PostgreSQL

## Arhitektura

Aplikacija se sastoji od:

1. **API Service** - Glavni backend API
2. **Dashboard** - Next.js frontend aplikacija
3. **Chat Service** - WebSocket chat servis
4. **Notification Service** - Notification servis
5. **PostgreSQL** - Baza podataka (StatefulSet)
6. **Redis** - Cache i message broker (Deployment)

## Korak 1: Kreiranje Projekta

```bash
# Login u OpenShift
oc login <openshift-url>

# Kreirajte novi projekat
oc new-project collector-dashboard

# Ili koristite postojeći
oc project collector-dashboard
```

## Korak 2: Build i Push Docker Images

### Opcija A: Koristeći OpenShift Build

```bash
# Build API image
oc new-build --name=api --strategy=docker --binary \
  --dockerfile=apps/api/Dockerfile.prod

oc start-build api --from-dir=. --follow

# Build Dashboard image
oc new-build --name=dashboard --strategy=docker --binary \
  --dockerfile=apps/dashboard/Dockerfile.prod

oc start-build dashboard --from-dir=. --follow

# Build Chat Service image
oc new-build --name=chat-service --strategy=docker --binary \
  --dockerfile=services/chat-service/Dockerfile

oc start-build chat-service --from-dir=. --follow

# Build Notification Service image
oc new-build --name=notification-service --strategy=docker --binary \
  --dockerfile=services/notification-service/Dockerfile

oc start-build notification-service --from-dir=. --follow
```

### Opcija B: Koristeći Tekton Pipeline

```bash
# Apply Tekton pipeline
oc apply -f openshift/tekton/

# Start pipeline run
oc create -f openshift/tekton/pipeline-run.yaml
```

## Korak 3: Kreiranje Secrets i ConfigMaps

```bash
# Apply runtime configuration (secrets i configmaps)
oc apply -f openshift/runtime-config.yaml

# ⚠️ OBAVEZNO: Promenite sve default vrednosti u secrets!
oc edit secret collector-api-secrets
oc edit secret collector-chat-service-secrets
oc edit secret collector-notification-service-secrets
oc edit secret collector-postgres-credentials
```

### Generisanje JWT Secret

```bash
# Generiši siguran JWT secret
openssl rand -base64 32

# Dodaj u sve servise
oc set env secret/collector-api-secrets JWT_SECRET=<generated-secret>
oc set env secret/collector-chat-service-secrets JWT_SECRET=<generated-secret>
oc set env secret/collector-notification-service-secrets JWT_SECRET=<generated-secret>
```

## Korak 4: Deploy PostgreSQL

```bash
# Deploy PostgreSQL StatefulSet
oc apply -f openshift/postgresql.yaml

# Čekajte da bude ready
oc wait --for=condition=ready pod -l app=collector-postgres --timeout=300s
```

## Korak 5: Deploy Redis

```bash
# Deploy Redis
oc apply -f openshift/redis.yaml

# Čekajte da bude ready
oc wait --for=condition=ready pod -l app=collector-redis --timeout=300s
```

## Korak 6: Deploy API Service

```bash
# Apply ImageStream
oc apply -f openshift/imagestream.yaml

# Apply Service
oc apply -f openshift/service.yaml

# Apply DeploymentConfig
oc apply -f openshift/deploymentconfig.yaml

# Čekajte da bude ready
oc wait --for=condition=available deploymentconfig/api --timeout=300s
```

## Korak 7: Deploy Chat Service

```bash
# Apply Service
oc apply -f openshift/service-chat-service.yaml

# Apply DeploymentConfig
oc apply -f openshift/deploymentconfig-chat-service.yaml

# Čekajte da bude ready
oc wait --for=condition=available deploymentconfig/chat-service --timeout=300s
```

## Korak 8: Deploy Notification Service

```bash
# Apply Service
oc apply -f openshift/service-notification-service.yaml

# Apply DeploymentConfig
oc apply -f openshift/deploymentconfig-notification-service.yaml

# Čekajte da bude ready
oc wait --for=condition=available deploymentconfig/notification-service --timeout=300s
```

## Korak 9: Deploy Dashboard

```bash
# Dashboard je već konfigurisan u deploymentconfig.yaml
# Proverite da li je ready
oc wait --for=condition=available deploymentconfig/dashboard --timeout=300s
```

## Korak 10: Database Migracije

```bash
# Pokrenite migracije kroz API pod
oc exec -it deployment/api -- bun run db:migrate

# (Opciono) Pokrenite seed
oc exec -it deployment/api -- bun run db:seed
```

## Korak 11: Expose Services

### Opcija A: Route (OpenShift Router)

```bash
# Expose API
oc expose service api --port=4000

# Expose Dashboard
oc expose service dashboard --port=3000

# Expose Chat Service (opciono, ako treba eksterni pristup)
oc expose service chat-service --port=4001

# Expose Notification Service (opciono, ako treba eksterni pristup)
oc expose service notification-service --port=4002
```

### Opcija B: Ingress Controller

Kreirajte Ingress resource sa proper TLS sertifikatima.

## Verifikacija

### Proverite status svih pod-ova

```bash
oc get pods
```

Svi pod-ovi treba da budu u `Running` statusu.

### Proverite health checks

```bash
# API
oc exec deployment/api -- wget -qO- http://localhost:4000/api/health

# Chat Service
oc exec deployment/chat-service -- wget -qO- http://localhost:4001/health

# Notification Service
oc exec deployment/notification-service -- wget -qO- http://localhost:4002/health
```

### Proverite logove

```bash
# API
oc logs -f deployment/api

# Chat Service
oc logs -f deployment/chat-service

# Notification Service
oc logs -f deployment/notification-service

# Dashboard
oc logs -f deployment/dashboard
```

## Scaling

### Horizontal Scaling

```bash
# Scale API
oc scale deploymentconfig/api --replicas=3

# Scale Dashboard
oc scale deploymentconfig/dashboard --replicas=2

# Scale Chat Service
oc scale deploymentconfig/chat-service --replicas=2

# Scale Notification Service
oc scale deploymentconfig/notification-service --replicas=2
```

### Vertical Scaling (Resource Limits)

Uredite DeploymentConfig fajlove i promenite resource limits:

```yaml
resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 2000m
    memory: 2Gi
```

## Monitoring

### OpenShift Metrics

```bash
# Pregled resource usage
oc adm top pods
oc adm top nodes
```

### Health Checks

Svi servisi imaju automatske health checks konfigurisane u DeploymentConfig-ima.

## Backup i Restore

### PostgreSQL Backup

```bash
# Backup
oc exec statefulset/collector-postgres -- pg_dump -U collector collector_dashboard > backup.sql

# Restore
oc exec -i statefulset/collector-postgres -- psql -U collector collector_dashboard < backup.sql
```

### Redis Backup

Redis podaci su u emptyDir volumenu. Za persistent storage, promenite u PersistentVolumeClaim.

## Troubleshooting

### Pod se ne pokreće

```bash
# Proverite events
oc get events --sort-by='.lastTimestamp'

# Proverite pod status
oc describe pod <pod-name>

# Proverite logove
oc logs <pod-name>
```

### Image Pull Errors

```bash
# Proverite ImageStream
oc get imagestream

# Proverite build status
oc get builds
```

### Database Connection Issues

```bash
# Proverite PostgreSQL service
oc get svc collector-postgres

# Testirajte konekciju
oc exec deployment/api -- psql $DATABASE_URL -c "SELECT 1;"
```

### Redis Connection Issues

```bash
# Proverite Redis service
oc get svc collector-redis

# Testirajte Redis
oc exec deployment/collector-redis -- redis-cli ping
```

## Security Best Practices

1. **Koristite Secrets za sensitive podatke** - nikad ne commit-ujte secrets u git
2. **Rotirajte JWT secrets** - redovno menjajte JWT secrets
3. **Koristite Network Policies** - ograničite network pristup između pod-ova
4. **Koristite Service Accounts** - koristite dedicated service accounts za svaki servis
5. **Enable TLS** - koristite TLS za sve eksterne komunikacije
6. **Resource Limits** - postavite resource limits da sprečite DoS napade
7. **Security Context** - koristite non-root user-e u kontejnerima

## Production Checklist

- [ ] Svi secrets su promenjeni sa default vrednosti
- [ ] JWT secret je generisan i postavljen
- [ ] Database password je promenjen
- [ ] Resource limits su postavljeni
- [ ] Health checks su konfigurisani
- [ ] Routes su postavljeni sa TLS
- [ ] Backup strategija je implementirana
- [ ] Monitoring je konfigurisan
- [ ] Log aggregation je postavljen
- [ ] Network policies su konfigurisane
- [ ] Service accounts su kreirani
- [ ] Database migracije su izvršene
- [ ] Seed podaci su dodati (ako treba)

## Rollback

```bash
# Rollback na prethodnu verziju
oc rollout undo deploymentconfig/api
oc rollout undo deploymentconfig/dashboard
oc rollout undo deploymentconfig/chat-service
oc rollout undo deploymentconfig/notification-service
```

## Cleanup

```bash
# Obriši sve resurse
oc delete all --all
oc delete pvc --all
oc delete secrets --all
oc delete configmaps --all
oc delete imagestreams --all
```

