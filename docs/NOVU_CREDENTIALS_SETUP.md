# Novu Credentials Setup - Step by Step

## Šta vidite na screenshot-u

Na Novu dashboard-u u sekciji **API Keys** vidite:

1. **Application Identifier**: `p6qmMf55BRZ1` (ili slična vrednost)
2. **Secret Key**: Masked vrednost koja se završava sa `...a8b8`

## Koraci za setup

### Korak 1: Kopirajte Application Identifier

1. Na screenshot-u vidite polje **"Application Identifier"** sa vrednošću `p6qmMf55BRZ1`
2. Kliknite na **copy ikonu** (📋) pored te vrednosti
3. Ova vrednost je vaš `NOVU_APP_ID`

### Korak 2: Otkrijte i kopirajte Secret Key

1. Kliknite na **eye ikonu** (👁️) pored masked Secret Key vrednosti
2. Otkriće se puna vrednost API key-a
3. Kliknite na **copy ikonu** (📋) da kopirate
4. Ova vrednost je vaš `NOVU_API_KEY`

### Korak 3: Ažurirajte .env fajlove

**Za API (`apps/api/.env`):**
```bash
# Zamenite placeholder vrednosti sa pravim:
NOVU_API_KEY=p6qmMf55BRZ1_vaš_secret_key_ovde  # Secret Key koji ste kopirali
NOVU_APP_ID=p6qmMf55BRZ1  # Application Identifier koji ste kopirali
```

**Za Dashboard (`apps/dashboard/.env.local`):**
```bash
# Zamenite placeholder vrednost:
NEXT_PUBLIC_NOVU_APP_ID=p6qmMf55BRZ1  # Application Identifier (isti kao gore)
```

### Korak 4: Proverite da li su vrednosti postavljene

```bash
# Proverite API .env
cd apps/api
grep NOVU .env

# Proverite Dashboard .env.local
cd ../dashboard
grep NOVU .env.local
```

## Važno

- **Secret Key** je osetljiv - nikada ga ne commit-ujte u git
- **Application Identifier** se koristi i u backend-u i u frontend-u
- Nakon ažuriranja .env fajlova, **restart-ujte servere**

## Sledeći koraci

Nakon što postavite credentials:

1. ✅ Ažurirajte .env fajlove (gore)
2. ⏭️ Konfigurišite Resend integraciju (u Novu dashboard → Integrations)
3. ⏭️ Kreirajte workflows (u Novu dashboard → Workflows)
4. ⏭️ Testirajte sistem

