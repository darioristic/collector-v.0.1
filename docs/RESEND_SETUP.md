# Resend Integration Setup - Quick Guide

## Vaš Resend API Key

```
re_bXynSumZ_NKgricb9pToDuLuYLYqDyH7q
```

## Koraci za Konfigurisanje u Novu Dashboard-u

### Step 1: Otvorite Novu Dashboard

1. Idite na [https://web.novu.co](https://web.novu.co)
2. Prijavite se na svoj nalog

### Step 2: Dodajte Resend Integraciju

1. U levom sidebar-u, kliknite na **"Integrations"**
2. Kliknite na **"Add Integration"** dugme
3. U listi integracija, pronađite i izaberite **"Resend"**

### Step 3: Unesite API Key

1. U polju **"API Key"**, unesite:
   ```
   re_bXynSumZ_NKgricb9pToDuLuYLYqDyH7q
   ```

2. U polju **"From Email Address"**, unesite email adresu koja je verified u Resend
   - Ova adresa će biti "From" adresa za sve email notifikacije
   - Primer: `noreply@yourdomain.com` ili `notifications@yourdomain.com`

3. (Opciono) Konfigurišite dodatne opcije ako su dostupne

4. Kliknite **"Save"** ili **"Add Integration"**

### Step 4: Verifikacija

1. Proverite da li je Resend integracija sada vidljiva u listi integracija
2. Status bi trebalo da bude **"Active"** ili **"Connected"**

## ⚠️ Važno

- **API Key je osetljiv** - ne delite ga javno
- **From Email** mora biti verified u Resend dashboard-u
- Ako nemate verified email, idite na [Resend Dashboard](https://resend.com/emails) da verifikujete domen ili email

## Sledeći Korak

Nakon što konfigurišete Resend integraciju, kreirajte workflows u Novu dashboard-u.

Pogledajte: `docs/NOVU_WORKFLOWS_SETUP.md`

## Troubleshooting

**"Invalid API Key"**
- Proverite da li ste kopirali ceo API key (uključujući `re_` prefix)
- Proverite da li ima razmaka na početku ili kraju

**"Email not verified"**
- Idite na Resend dashboard i verifikujte email adresu ili domen
- Možete koristiti test email za development

**"Integration not working"**
- Proverite da li je integracija "Active" u Novu dashboard-u
- Proverite Resend dashboard za error logs

