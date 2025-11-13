# Infrastructure Setup Summary

Ovaj dokument daje pregled Docker i OpenShift konfiguracije za Collector Dashboard aplikaciju.

## Docker Compose Setup

### Poboljšanja

1. **Network konfiguracija** - Svi servisi su na `collector-network` network-u
2. **Health checks** - Svi servisi imaju health check endpoint-e
3. **Service dependencies** - Servisi čekaju da su dependencies healthy pre pokretanja
4. **Dashboard servis** - Dodat dashboard servis u docker-compose
5. **Container names** - Svi kontejneri imaju eksplicitne imene
6. **Redis persistence** - AOF (Append Only File) enabled za Redis

### Servisi

- **postgres** (5432) - PostgreSQL 17.2 Alpine
- **redis** (6379) - Redis 7 Alpine sa AOF
- **api** (4000) - Main API servis
- **chat-service** (4001) - WebSocket chat servis
- **notification-service** (4002) - Notification servis
- **dashboard** (3000) - Next.js frontend

### Pokretanje

```bash
# Build i start
docker-compose up -d --build

# Status
docker-compose ps

# Logovi
docker-compose logs -f

# Stop
docker-compose down
```

## OpenShift Setup

### Novi resursi

1. **Chat Service**
   - `deploymentconfig-chat-service.yaml`
   - `service-chat-service.yaml`
   - ImageStream u `imagestream.yaml`

2. **Notification Service**
   - `deploymentconfig-notification-service.yaml`
   - `service-notification-service.yaml`
   - ImageStream u `imagestream.yaml`

3. **Redis**
   - `redis.yaml` - Deployment sa Service

4. **Secrets i ConfigMaps**
   - Ažuriran `runtime-config.yaml` sa:
     - `collector-chat-service-secrets`
     - `collector-notification-service-secrets`
     - `dashboard-config` ConfigMap

### Deployment Order

1. PostgreSQL (StatefulSet)
2. Redis (Deployment)
3. API Service
4. Chat Service
5. Notification Service
6. Dashboard

### Resource Limits

Svi servisi imaju postavljene resource limits:

- **API**: 200m-1000m CPU, 512Mi-1Gi Memory
- **Dashboard**: 200m-1000m CPU, 512Mi-1Gi Memory
- **Chat Service**: 100m-500m CPU, 256Mi-512Mi Memory
- **Notification Service**: 100m-500m CPU, 256Mi-512Mi Memory
- **Redis**: 100m-500m CPU, 256Mi-512Mi Memory
- **PostgreSQL**: 250m-1 CPU, 512Mi-1Gi Memory

### Health Checks

Svi servisi imaju:
- **Readiness Probe** - Proverava da li je servis spreman za traffic
- **Liveness Probe** - Proverava da li je servis živ

## Deployment Fajlovi

### Docker
- `docker-compose.yml` - Kompletna Docker Compose konfiguracija
- `.dockerignore` - Ignore fajlovi za Docker build

### OpenShift
- `deploymentconfig.yaml` - API i Dashboard DeploymentConfig
- `deploymentconfig-chat-service.yaml` - Chat Service DeploymentConfig
- `deploymentconfig-notification-service.yaml` - Notification Service DeploymentConfig
- `service.yaml` - API i Dashboard Services
- `service-chat-service.yaml` - Chat Service Service
- `service-notification-service.yaml` - Notification Service Service
- `imagestream.yaml` - ImageStream za sve servise
- `postgresql.yaml` - PostgreSQL StatefulSet
- `redis.yaml` - Redis Deployment
- `runtime-config.yaml` - Secrets i ConfigMaps

## Dokumentacija

- `docs/DOCKER_DEPLOYMENT.md` - Detaljni vodič za Docker deployment
- `docs/OPENSHIFT_DEPLOYMENT.md` - Detaljni vodič za OpenShift deployment
- `docs/INFRASTRUCTURE_SUMMARY.md` - Ovaj dokument

## Next Steps

1. **Testirajte Docker setup lokalno**
   ```bash
   docker-compose up -d
   docker-compose ps
   ```

2. **Build Docker images za OpenShift**
   ```bash
   oc new-build --name=api --strategy=docker --binary --dockerfile=apps/api/Dockerfile.prod
   ```

3. **Deploy na OpenShift**
   ```bash
   oc apply -f openshift/
   ```

4. **Konfigurišite Secrets**
   - Promenite sve default vrednosti u `runtime-config.yaml`
   - Generiši JWT secrets
   - Postavi database passwords

5. **Postavite Routes**
   ```bash
   oc expose service api
   oc expose service dashboard
   ```

## Security Considerations

- [ ] Svi secrets su promenjeni sa default vrednosti
- [ ] JWT secrets su generisani
- [ ] Database passwords su promenjeni
- [ ] Network policies su konfigurisane (opciono)
- [ ] TLS sertifikati su postavljeni za Routes
- [ ] Resource limits su postavljeni
- [ ] Service accounts su kreirani (opciono)

