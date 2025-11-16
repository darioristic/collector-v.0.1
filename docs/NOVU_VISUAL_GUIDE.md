# Novu Setup - Vizuelni Vodič

## Šta vidite na Novu Dashboard-u

Kada otvorite **Developer → API Keys** u Novu dashboard-u, vidite 3 sekcije:

### 1. `<Inbox />` Sekcija

**Application Identifier**: `p6qmMf55BRZ1` (ili vaša vrednost)

- Ovo je vaš **NOVU_APP_ID**
- Koristi se i u backend-u i u frontend-u
- Kliknite na **copy ikonu** (📋) da kopirate

### 2. Secret Keys Sekcija

**Secret Key**: Masked vrednost (npr. `****...a8b8`)

- Ovo je vaš **NOVU_API_KEY**
- Kliknite na **eye ikonu** (👁️) da otkrijete punu vrednost
- Zatim kliknite na **copy ikonu** (📋) da kopirate
- ⚠️ **VAŽNO**: Ovo je osetljiva vrednost - nikada je ne delite javno!

### 3. API URLs Sekcija

- Ovo vam trenutno nije potrebno za setup
- Koristi se za custom integracije

## Kako ažurirati .env fajlove

### Opcija 1: Koristite skriptu (preporučeno)

```bash
cd /Users/darioristic/Projects/Collector-Dashboard
./scripts/update-novu-credentials.sh
```

Skripta će vas pitati za:
1. Application Identifier (kopirajte sa dashboard-a)
2. Secret Key (otkrijte i kopirajte sa dashboard-a)

### Opcija 2: Ručno ažuriranje

**1. Otvorite `apps/api/.env` i zamenite:**

```env
# Zamenite ove linije:
NOVU_API_KEY=your_novu_api_key_here
NOVU_APP_ID=your_novu_app_id_here

# Sa pravim vrednostima:
NOVU_API_KEY=p6qmMf55BRZ1_vaš_secret_key_ovde
NOVU_APP_ID=p6qmMf55BRZ1
```

**2. Otvorite `apps/dashboard/.env.local` i zamenite:**

```env
# Zamenite ovu liniju:
NEXT_PUBLIC_NOVU_APP_ID=your_novu_app_id_here

# Sa pravom vrednošću:
NEXT_PUBLIC_NOVU_APP_ID=p6qmMf55BRZ1
```

## Provera

Nakon ažuriranja, proverite:

```bash
# Proverite API .env
cat apps/api/.env | grep NOVU

# Proverite Dashboard .env.local  
cat apps/dashboard/.env.local | grep NOVU
```

Trebalo bi da vidite prave vrednosti umesto `your_novu_*_here`.

## Sledeći koraci

1. ✅ Ažurirajte credentials (gore)
2. ⏭️ Restart-ujte servere
3. ⏭️ Konfigurišite Resend integraciju
4. ⏭️ Kreirajte workflows
5. ⏭️ Testirajte

## Troubleshooting

**"NOVU_API_KEY is not set"**
- Proverite da li ste zamenili `your_novu_api_key_here` sa pravom vrednošću
- Proverite da li je Secret Key otkriven (kliknite eye ikonu)
- Restart-ujte API server

**"NOVU_APP_ID is not set"**
- Proverite da li ste zamenili `your_novu_app_id_here` sa Application Identifier
- Proverite da li je ista vrednost u oba .env fajla (API i Dashboard)

