# Pokretanje Development Servera

## Problem
Server nije pokrenut, pa dobijate grešku `ERR_CONNECTION_REFUSED` kada pokušavate da pristupite `http://localhost:3000`.

## Rešenje

### Opcija 1: Pokreni dev skriptu (Preporučeno)

U novom terminalu, pokreni:

```bash
cd /Users/darioristic/Projects/Collector-Dashboard
bun scripts/dev.ts
```

Ova skripta će:
- Proveriti da li su portovi 3000 i 4000 slobodni
- Pokrenuti API server na portu 4000
- Pokrenuti Dashboard server na portu 3000
- Pokrenuti Socket.IO server na portu 3001

### Opcija 2: Ručno pokretanje

Ako želiš da pokreneš servere ručno:

#### Terminal 1 - API Server:
```bash
cd /Users/darioristic/Projects/Collector-Dashboard/apps/api
bun run dev
```

#### Terminal 2 - Dashboard Server:
```bash
cd /Users/darioristic/Projects/Collector-Dashboard/apps/dashboard
bun run dev
```

#### Terminal 3 - Socket.IO Server (opciono):
```bash
cd /Users/darioristic/Projects/Collector-Dashboard/apps/dashboard
bun run dev:socket
```

## Provera

Nakon što pokreneš servere, proveri da li rade:

1. **Dashboard**: Otvori `http://localhost:3000` u browseru
2. **API**: Otvori `http://localhost:4000/api/health` u browseru (trebalo bi da vidiš `{"status":"ok"}`)

## Troubleshooting

Ako i dalje dobijaš `ERR_CONNECTION_REFUSED`:

1. Proveri da li su portovi slobodni:
   ```bash
   lsof -ti:3000  # Proveri port 3000
   lsof -ti:4000  # Proveri port 4000
   ```

2. Ako su portovi zauzeti, ugasi procese:
   ```bash
   lsof -ti:3000 | xargs kill -9
   lsof -ti:4000 | xargs kill -9
   ```

3. Pokreni server ponovo.

## Login Stranica

Nakon što server radi, login stranica je dostupna na:
- `http://localhost:3000/auth/login`

