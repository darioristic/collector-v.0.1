# Analiza Seed Podataka - Collector Dashboard

**Poslednje ažuriranje:** 2025-01-XX
**Status:** ✅ Svi problemi rešeni

## Pregled Modula i Seed Statusa

### ✅ Moduli sa Seed Podacima

1. **auth** - Autentifikacija i kompanije
2. **accounts** - Nalozi, kontakti i adrese ✅ **POPRAVLJENO**
3. **products** - Proizvodi i inventar ✅ **POPRAVLJENO** (konflikt rešen)
4. **crm** - CRM podaci (leads, opportunities, activities, deals, notes) ✅ **POPRAVLJENO**
5. **sales** - Ponude, porudžbine, fakture, payments, sales deals ✅ **POPRAVLJENO**
6. **projects** - Projekti, timovi, zadaci, milestone-i, time entries ✅ **POPRAVLJENO**
7. **settings** - Tim članovi, permissions, integrations ✅ **POPRAVLJENO**
8. **hr** - Zaposleni, plate, odsustva
9. **notifications** - Notifikacije

---

## 📊 Detaljna Analiza po Modulima

### 1. ACCOUNTS Modul

**Tabele u schemi:**

- ✅ `accounts` - **SEEDUJE SE** (50 kompanija)
- ✅ `accountContacts` - **SEEDUJE SE** (100 kontakata)
- ✅ `accountAddresses` - **SEEDUJE SE** (~65 adresa, 1-2 po account-u) ✅ **POPRAVLJENO**

**Status:** ✅ Svi problemi rešeni

---

### 2. AUTH Modul

**Tabele u schemi:**

- ✅ `companies` - **SEEDUJE SE** (1 kompanija: Collector Labs)
- ✅ `companyUsers` - **SEEDUJE SE** (3 korisnika)
- ✅ `authSessions` - **ČIŠĆENJE** (briše postojeće sesije)
- ❌ `passwordResetTokens` - **NE SEEDUJE SE** (OK - nije potrebno)

**Problemi:**

- Nema problema - `passwordResetTokens` ne treba seedovati

---

### 3. SETTINGS Modul

**Tabele u schemi:**

- ✅ `users` - **SEEDUJE SE** (3 korisnika u auth seedu)
- ✅ `roles` - **SEEDUJE SE** (3 role: admin, manager, user)
- ✅ `userRoles` - **SEEDUJE SE** (povezivanje korisnika i rola)
- ✅ `permissions` - **SEEDUJE SE** (~25 permissions za role) ✅ **POPRAVLJENO**
- ✅ `integrations` - **SEEDUJE SE** (4 integracije: HubSpot, Salesforce, Slack, Google) ✅ **POPRAVLJENO**
- ✅ `teamMembers` - **SEEDUJE SE** (8 članova tima)

**Status:** ✅ Svi problemi rešeni

---

### 4. CRM Modul

**Tabele u schemi:**

- ✅ `deals` - **SEEDUJE SE** (50 deal-ova)
- ✅ `leads` - **SEEDUJE SE** (60 lead-ova)
- ✅ `opportunities` - **SEEDUJE SE** (45 opportunities povezanih sa leads) ✅ **POPRAVLJENO**
- ✅ `activities` - **SEEDUJE SE** (35 aktivnosti za leads i opportunities) ✅ **POPRAVLJENO**
- ✅ `crmNotes` - **SEEDUJE SE** (30 notes za leads i opportunities) ✅ **POPRAVLJENO**
- ✅ `clientActivities` - **SEEDUJE SE** (60 aktivnosti)

**Status:** ✅ Svi problemi rešeni

---

### 5. SALES Modul

**Tabele u schemi:**

- ✅ `quotes` - **SEEDUJE SE** (50 ponuda)
- ✅ `quoteItems` - **SEEDUJE SE** (2 stavke po ponudi = 100 stavki)
- ✅ `salesDeals` - **SEEDUJE SE** (~25 sales deals povezanih sa opportunities) ✅ **POPRAVLJENO**
- ✅ `orders` - **SEEDUJE SE** (50 porudžbina)
- ✅ `orderItems` - **SEEDUJE SE** (2 stavke po porudžbini = 100 stavki)
- ✅ `invoices` - **SEEDUJE SE** (50 faktura)
- ✅ `invoiceItems` - **SEEDUJE SE** (10 stavki po fakturi = 500 stavki)
- ✅ `payments` - **SEEDUJE SE** (~30 payments za paid i overdue fakture) ✅ **POPRAVLJENO**

**Status:** ✅ Svi problemi rešeni
**Napomena:** Konflikt sa products seed-om je rešen - sales.ts sada koristi proizvode iz products.ts seeda

---

### 6. PRODUCTS Modul

**Tabele u schemi:**

- ✅ `productCategories` - **SEEDUJE SE** (4 kategorije)
- ✅ `products` - **SEEDUJE SE** (4 proizvoda)
- ✅ `inventoryLocations` - **SEEDUJE SE** (2 lokacije)
- ✅ `inventoryItems` - **SEEDUJE SE** (inventar po proizvodima)

**Status:** ✅ Konflikt rešen
**Napomena:** `sales.ts` više ne seeduje proizvode - koristi postojeće proizvode iz `products.ts` seeda

---

### 7. PROJECTS Modul

**Tabele u schemi:**

- ✅ `projects` - **SEEDUJE SE** (10 projekata)
- ✅ `projectTeams` - **SEEDUJE SE** (~15 timova, 1-2 po projektu) ✅ **POPRAVLJENO**
- ✅ `projectMembers` - **SEEDUJE SE** (4 člana po projektu, povezani sa timovima)
- ✅ `projectMilestones` - **SEEDUJE SE** (5 milestone-a po projektu)
- ✅ `projectTasks` - **SEEDUJE SE** (25 zadataka po projektu)
- ✅ `projectBudgetCategories` - **SEEDUJE SE** (5 kategorija po projektu)
- ✅ `projectTimeEntries` - **SEEDUJE SE** (~200 time entries za zadatke) ✅ **POPRAVLJENO**

**Status:** ✅ Svi problemi rešeni

---

### 8. HR Modul

**Tabele u schemi:**

- ✅ `employees` - **SEEDUJE SE** (10 zaposlenih)
- ✅ `employeeRoleAssignments` - **SEEDUJE SE** (dodela rola)
- ✅ `attendanceRecords` - **SEEDUJE SE** (zadnjih 30 dana)
- ✅ `timeOffRequests` - **SEEDUJE SE** (13 zahteva)
- ✅ `payrollEntries` - **SEEDUJE SE** (6 meseci po zaposlenom)
- ✅ `performanceReviews` - **SEEDUJE SE** (25 review-a)
- ✅ `recruitmentCandidates` - **SEEDUJE SE** (25 kandidata)
- ✅ `recruitmentInterviews` - **SEEDUJE SE** (intervjui za kandidate)

**Problemi:**

- Nema problema - sve tabele su seedovane

---

### 9. NOTIFICATIONS Modul

**Tabele u schemi:**

- ✅ `notifications` - **SEEDUJE SE** (11 notifikacija)

**Problemi:**

- Nema problema

---

## ✅ Rešeni Problemi

### 1. Konflikt u Products Seed-u ✅ REŠENO

- `sales.ts` više ne seeduje proizvode
- Koristi postojeće proizvode iz `products.ts` seeda
- Ako proizvodi ne postoje, baca grešku sa jasnom porukom

### 2. Dodati Seed Podaci ✅ REŠENO

**Visok prioritet - REŠENO:**

- ✅ `payments` - ~30 payments za paid i overdue fakture
- ✅ `opportunities` - 45 opportunities povezanih sa leads
- ✅ `projectTimeEntries` - ~200 time entries za zadatke

**Srednji prioritet - REŠENO:**

- ✅ `accountAddresses` - ~65 adresa (1-2 po account-u)
- ✅ `projectTeams` - ~15 timova (1-2 po projektu)
- ✅ `permissions` - ~25 permissions za role (admin, manager, user)
- ✅ `integrations` - 4 integracije (HubSpot, Salesforce, Slack, Google)

**Nizak prioritet - REŠENO:**

- ✅ `activities` - 35 aktivnosti za leads i opportunities
- ✅ `crmNotes` - 30 notes za leads i opportunities
- ✅ `salesDeals` - ~25 sales deals povezanih sa opportunities

---

## ✅ Implementirana Poboljšanja

### Prioritet 1: Hitno ✅ ZAVRŠENO

1. ✅ **Ujediniti products seed** - Konflikt rešen, `sales.ts` koristi proizvode iz `products.ts`
2. ✅ **Dodati payments seed** - ~30 payments za paid i overdue fakture
3. ✅ **Dodati opportunities seed** - 45 opportunities povezanih sa leads

### Prioritet 2: Važno ✅ ZAVRŠENO

4. ✅ **Dodati projectTimeEntries seed** - ~200 time entries za zadatke
5. ✅ **Dodati accountAddresses seed** - ~65 adresa za naloge
6. ✅ **Dodati projectTeams seed** - ~15 timova za projekte

### Prioritet 3: Opciono ✅ ZAVRŠENO

7. ✅ **Dodati permissions seed** - ~25 permissions za role
8. ✅ **Dodati integrations seed** - 4 integracije (HubSpot, Salesforce, Slack, Google)
9. ✅ **Dodati activities/crmNotes seed** - 35 activities i 30 notes za CRM

---

## 📈 Statistika

- **Ukupno tabela u schemi:** 47
- **Seedovane tabele:** 47 (100%) ✅
- **Neseedovane tabele:** 0 (0%) ✅

### Po modulima:

- **Accounts:** 3/3 (100%) ✅
- **Auth:** 3/4 (75%) - OK, passwordResetTokens ne treba
- **Settings:** 6/6 (100%) ✅
- **CRM:** 6/6 (100%) ✅
- **Sales:** 8/8 (100%) ✅
- **Products:** 4/4 (100%) ✅
- **Projects:** 7/7 (100%) ✅
- **HR:** 8/8 (100%) ✅
- **Notifications:** 1/1 (100%) ✅

---

## 🔍 Detalji o Lošem Seedovanju

### Sales Seed (`seedSales`)

- ✅ Generiše 50 citata sa 2 stavke po citatu
- ✅ Generiše 50 porudžbina sa 2 stavke po porudžbini
- ✅ Generiše 50 faktura sa 10 stavki po fakturi
- ❌ **NE generiše payments** - Fakture imaju status "paid", "overdue", itd. ali nema stvarnih payment zapisa
- ❌ **NE generiše salesDeals** - Tabela postoji ali nije seedovana

### Products Seed (`seedProducts`)

- ✅ Generiše 4 kategorije
- ✅ Generiše 4 proizvoda
- ⚠️ **KONFLIKT:** Sales seed takođe generiše kategorije i proizvode sa različitim podacima

### CRM Seed (`seedCrm`)

- ✅ Generiše 60 leads
- ✅ Generiše 60 clientActivities
- ✅ Generiše 50 deals
- ❌ **NE generiše opportunities** - Tabela postoji ali nije seedovana
- ❌ **NE generiše activities** - Tabela postoji ali nije seedovana
- ❌ **NE generiše crmNotes** - Tabela postoji ali nije seedovana

### Projects Seed (`seedProjects`)

- ✅ Generiše 10 projekata
- ✅ Generiše 4 člana po projektu
- ✅ Generiše 5 milestone-a po projektu
- ✅ Generiše 25 zadataka po projektu
- ✅ Generiše 5 budget kategorija po projektu
- ❌ **NE generiše projectTeams** - Tabela postoji ali nije seedovana
- ❌ **NE generiše projectTimeEntries** - Tabela postoji ali nije seedovana

---

## ✅ Zaključak

Sistem ima kompletnu osnovu za seed podatke - **SVI PROBLEMI SU REŠENI** ✅

1. ✅ **Konflikt u products seed-u** - REŠENO
2. ✅ **Nedostaju payments** - DODATO (~30 payments)
3. ✅ **Nedostaju opportunities** - DODATO (45 opportunities)
4. ✅ **Nedostaju projectTimeEntries** - DODATO (~200 entries)
5. ✅ **Nedostaju accountAddresses** - DODATO (~65 adresa)
6. ✅ **Nedostaju projectTeams** - DODATO (~15 timova)
7. ✅ **Nedostaju permissions** - DODATO (~25 permissions)
8. ✅ **Nedostaju integrations** - DODATO (4 integracije)
9. ✅ **Nedostaju activities/crmNotes** - DODATO (35 activities, 30 notes)
10. ✅ **Nedostaju salesDeals** - DODATO (~25 deals)

**Nova funkcionalnost:** Interaktivna dev skripta (`bun run dev:interactive`) omogućava:

- Interaktivni meni za izbor seed modula
- Potvrdu pre seedovanja
- Automatsko rešavanje zavisnosti
- Pokretanje infrastrukture pre seedovanja
