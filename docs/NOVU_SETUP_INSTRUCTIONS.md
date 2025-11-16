# Novu Setup - Brza Instrukcija

## Korak 1: Uzmite vrednosti sa Novu Dashboard-a

Na screenshot-u vidite:

1. **Application Identifier**: `p6qmMf55BRZ1` (ili vaša vrednost)
   - Kliknite na **copy ikonu** (📋) da kopirate

2. **Secret Key**: Masked vrednost
   - Kliknite na **eye ikonu** (👁️) da otkrijete
   - Kliknite na **copy ikonu** (📋) da kopirate

## Korak 2: Ažurirajte .env fajlove

### Opcija A: Koristite skriptu (preporučeno)

```bash
cd /Users/darioristic/Projects/Collector-Dashboard
./scripts/set-novu-credentials.sh <APPLICATION_IDENTIFIER> <SECRET_KEY>
```

**Primer:**
```bash
./scripts/set-novu-credentials.sh p6qmMf55BRZ1 sk_live_abc123xyz...
```

### Opcija B: Ručno ažuriranje

**1. Otvorite `apps/api/.env` i zamenite:**

```env
NOVU_API_KEY=<secret_key_koji_ste_kopirali>
NOVU_APP_ID=<application_identifier_koji_ste_kopirali>
```

**2. Otvorite `apps/dashboard/.env.local` i zamenite:**

```env
NEXT_PUBLIC_NOVU_APP_ID=<isti_application_identifier>
```

## Korak 3: Proverite

```bash
# Proverite da li su vrednosti postavljene
cat apps/api/.env | grep NOVU
cat apps/dashboard/.env.local | grep NOVU
```

## Korak 4: Restart servere

```bash
# Restart API
cd apps/api && bun run dev

# Restart Dashboard (u drugom terminalu)
cd apps/dashboard && bun run dev
```

## Sledeći koraci

1. ✅ Postavite credentials (gore)
2. ⏭️ Konfigurišite Resend integraciju u Novu dashboard-u
3. ⏭️ Kreirajte workflows u Novu dashboard-u
4. ⏭️ Testirajte sistem

Za detaljna uputstva, pogledajte `docs/NOVU_QUICK_START.md`.

