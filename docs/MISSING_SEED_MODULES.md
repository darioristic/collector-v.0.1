# Nedostaju seed podaci po modulima

## 📋 Kompletan pregled šta nedostaje za sve module

### 🔵 API Baza (`collector`)

#### Moduli sa migracijama ali BEZ seed podataka:

1. **HR** (`hr`)
   - ✅ Migracije: Postoje u shemi
   - ❌ Seed: **NEDOSTAJE**
   - 📦 Tabele: `employees`, `employee_role_assignments`, `attendance_records`, `time_off_requests`, `payroll_entries`
   - 💡 **NAPOMENA**: Dashboard baza ima `employees` tabelu sa seed podacima, možda nije potrebno

2. **Notifications** (`notifications`)
   - ✅ Migracije: `0012_add_notifications.sql`
   - ❌ Seed: **NEDOSTAJE**
   - 📦 Tabele: `notifications`
   - 💡 **NAPOMENA**: Notifikacije se kreiraju dinamički, možda nije potrebno

---

### 🟢 Dashboard Baza (`collector_dashboard`)

#### Moduli sa migracijama ali BEZ seed podataka:

1. **Team Members** (`team_members`)
   - ✅ Migracije: `0002_create_team_members.sql`, `0008_add_company_to_team_members.sql`
   - ❌ Seed: **NEDOSTAJE**
   - 📦 Tabele: `team_members`
   - 💡 **NAPOMENA**: Možda se koriste `employees` umesto `team_members`, proveriti

2. **Notifications** (`notifications`)
   - ✅ Migracije: `0004_create_notifications.sql`
   - ❌ Seed: **NEDOSTAJE**
   - 📦 Tabele: `notifications`
   - 💡 **NAPOMENA**: Notifikacije se kreiraju dinamički, možda nije potrebno

3. **TeamChat** (`teamchat`)
   - ✅ Migracije: `0005_create_teamchat.sql`
   - ❌ Seed: **NEDOSTAJE**
   - 📦 Tabele: `teamchat_users`, `teamchat_channels`, `teamchat_channel_members`, `teamchat_messages`
   - 💡 **NAPOMENA**: `teamchat_users` se automatski kreira pri login-u zaposlenih

4. **Chat** (`chat`)
   - ✅ Migracije: `0009_create_chat.sql`
   - ❌ Seed: **NEDOSTAJE**
   - 📦 Tabele: `chat_conversations`, `chat_messages`
   - 💡 **NAPOMENA**: Chat se kreira dinamički, možda nije potrebno

5. **Company** (`company`)
   - ✅ Migracije: `0007_create_company.sql`
   - ❌ Seed: **NEDOSTAJE**
   - 📦 Tabele: `company`
   - 💡 **NAPOMENA**: Company se automatski kreira pri login-u zaposlenih

6. **Deals** (`deals`)
   - ✅ Migracije: `0012_create_deals.sql` (novo kreirana)
   - ❌ Seed: **NEDOSTAJE**
   - 📦 Tabele: `deals`
   - 💡 **NAPOMENA**: Deals se mogu dodati kroz CRM modul

7. **Users** (`users`)
   - ✅ Migracije: `0000_create_users_and_companies.sql` (novo kreirana)
   - ❌ Seed: **NEDOSTAJE**
   - 📦 Tabele: `users`
   - 💡 **NAPOMENA**: Users se koriste iz `employees` preko login-a, možda nije potrebno

8. **Companies** (`companies`)
   - ✅ Migracije: `0000_create_users_and_companies.sql` (novo kreirana)
   - ❌ Seed: **NEDOSTAJE**
   - 📦 Tabele: `companies`
   - 💡 **NAPOMENA**: Companies se automatski kreira pri login-u zaposlenih

---

## 🎯 Prioriteti za dodavanje seed podataka

### Prioritet 1 (Kritično - ako se koriste):
- ❌ **Deals seed** - Ako se deals koriste u dashboard-u, treba seed podaci

### Prioritet 2 (Korisno - ako se koriste):
- ❌ **Team Members seed** - Ako se koriste `team_members` umesto `employees`
- ❌ **HR seed u API bazi** - Ako se koristi API HR modul umesto Dashboard employees

### Prioritet 3 (Opciono - dinamički se kreiraju):
- ⚠️ **TeamChat seed** - Automatski se kreira pri login-u
- ⚠️ **Company seed** - Automatski se kreira pri login-u
- ⚠️ **Companies seed** - Automatski se kreira pri login-u
- ⚠️ **Users seed** - Koriste se iz `employees` preko login-a
- ⚠️ **Notifications seed** - Kreiraju se dinamički
- ⚠️ **Chat seed** - Kreira se dinamički

---

## 📝 Rezime

### ✅ Potpuno funkcionalni moduli (migracije + seed):
- **API**: auth, accounts, products, crm, sales, projects, settings
- **Dashboard**: employees, vault

### ✅ Moduli sa migracijama (ali bez seed podataka):
- **API**: hr, notifications
- **Dashboard**: users, companies, deals, team_members, notifications, teamchat, chat, company

### 🔧 Dev skripta:
- ✅ Pokreće sve migracije (sada uključujući `users`, `companies`, `deals`)
- ✅ Pokreće seed za funkcionalne module
- ⚠️ Ne pokreće seed za module koji nemaju seed skripte (jer ne postoje)

