# Docker Deployment Guide

Ovaj vodič objašnjava kako da pokrenete Collector Dashboard aplikaciju koristeći Docker i Docker Compose.

## Preduslovi

- Docker Engine 20.10+
- Docker Compose 2.0+
- Minimum 4GB RAM
- Minimum 10GB disk prostora

## Brzo Pokretanje

```bash
# Klonirajte repozitorijum
git clone <repository-url>
cd Collector-Dashboard

# Pokrenite sve servise
docker-compose up -d

# Proverite status
docker-compose ps

# Pregledajte logove
docker-compose logs -f
```

## Servisi

Aplikacija se sastoji od sledećih servisa:

### 1. PostgreSQL Database
- **Port**: 5432
- **Database**: collector
- **User**: collector
- **Password**: collector (promenite u produkciji!)
- **Volume**: `postgres_data` (persistent storage)

### 2. Redis Cache
- **Port**: 6379
- **Volume**: `redis_data` (persistent storage)
- **Persistence**: AOF (Append Only File) enabled

### 3. API Service
- **Port**: 4000
- **Health Check**: `http://localhost:4000/api/health`
- **Dependencies**: PostgreSQL, Redis

### 4. Chat Service
- **Port**: 4001
- **Health Check**: `http://localhost:4001/health`
- **Dependencies**: PostgreSQL, Redis

### 5. Notification Service
- **Port**: 4002
- **Health Check**: `http://localhost:4002/health`
- **Dependencies**: PostgreSQL, Redis

### 6. Dashboard (Next.js)
- **Port**: 3000
- **Health Check**: `http://localhost:3000/api/health`
- **Dependencies**: API, Chat Service, Notification Service

## Environment Variables

Kreirajte `.env` fajl u root direktorijumu:

```env
# JWT Secret (obavezno promenite u produkciji!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS Origins (za produkciju)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Dashboard API URLs (za produkciju)
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_CHAT_SERVICE_URL=http://localhost:4001
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:4002
```

## Build i Deploy

### Build svih servisa

```bash
docker-compose build
```

### Build pojedinačnog servisa

```bash
docker-compose build api
docker-compose build dashboard
docker-compose build chat-service
docker-compose build notification-service
```

### Pokretanje sa rebuild-om

```bash
docker-compose up -d --build
```

## Database Migracije

Migracije se automatski izvršavaju pri pokretanju API servisa. Ako treba ručno:

```bash
# Pristupite API kontejneru
docker-compose exec api sh

# Pokrenite migracije
bun run db:migrate

# Pokrenite seed (opciono)
bun run db:seed
```

## Health Checks

Svi servisi imaju health check endpoint-e:

```bash
# API
curl http://localhost:4000/api/health

# Chat Service
curl http://localhost:4001/health

# Notification Service
curl http://localhost:4002/health

# Dashboard
curl http://localhost:3000/api/health
```

## Logovi

### Pregled svih logova

```bash
docker-compose logs -f
```

### Pregled logova po servisu

```bash
docker-compose logs -f api
docker-compose logs -f dashboard
docker-compose logs -f chat-service
docker-compose logs -f notification-service
docker-compose logs -f postgres
docker-compose logs -f redis
```

## Zaustavljanje i Čišćenje

### Zaustavi sve servise

```bash
docker-compose down
```

### Zaustavi i obriši volumene (⚠️ briše podatke!)

```bash
docker-compose down -v
```

### Zaustavi i obriši sve (volumes + images)

```bash
docker-compose down -v --rmi all
```

## Troubleshooting

### Servisi se ne pokreću

1. Proverite da li su portovi slobodni:
```bash
netstat -tulpn | grep -E '3000|4000|4001|4002|5432|6379'
```

2. Proverite logove:
```bash
docker-compose logs <service-name>
```

3. Proverite health checks:
```bash
docker-compose ps
```

### Database connection errors

1. Proverite da li je PostgreSQL pokrenut:
```bash
docker-compose ps postgres
```

2. Proverite konekciju:
```bash
docker-compose exec postgres psql -U collector -d collector -c "SELECT 1;"
```

### Redis connection errors

1. Proverite da li je Redis pokrenut:
```bash
docker-compose ps redis
```

2. Testirajte Redis:
```bash
docker-compose exec redis redis-cli ping
```

### Port conflicts

Ako portovi nisu slobodni, promenite ih u `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Promenite 3000 u 3001
```

## Produkcija

Za produkciju, obavezno:

1. **Promenite sve default lozinke i secret-e**
2. **Koristite environment variables za sensitive podatke**
3. **Postavite proper CORS origins**
4. **Koristite reverse proxy (nginx/traefik)**
5. **Postavite SSL/TLS sertifikate**
6. **Konfigurišite backup za PostgreSQL i Redis**
7. **Postavite resource limits u docker-compose.yml**
8. **Koristite Docker secrets za sensitive podatke**

### Primer produkcijskog docker-compose.yml

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    restart: always
```

## Monitoring

Za monitoring možete koristiti:

- **Docker stats**: `docker stats`
- **Health checks**: Automatski u docker-compose.yml
- **Log aggregation**: ELK stack ili Loki

## Backup i Restore

### PostgreSQL Backup

```bash
docker-compose exec postgres pg_dump -U collector collector > backup.sql
```

### PostgreSQL Restore

```bash
docker-compose exec -T postgres psql -U collector collector < backup.sql
```

### Redis Backup

Redis podaci su automatski sačuvani u `redis_data` volumenu. Za ručni backup:

```bash
docker-compose exec redis redis-cli BGSAVE
```

