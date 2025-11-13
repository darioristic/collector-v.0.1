# Pregled baza podataka po modulima

## 📊 Trenutno stanje baza

### 🔵 API Baza (`collector`)

#### Moduli sa migracijama i seed podacima:

1. **Auth** (`auth`)
   - ✅ Migracije: `0010_auth_setup.sql`, `0011_auth_setup.sql`
   - ✅ Seed: `seedAuth` - roles, companies, users
   - 📦 Tabele: `users`, `roles`, `user_roles`, `companies`, `company_users`, `auth_sessions`, `password_reset_tokens`

2. **Accounts** (`accounts`)
   - ✅ Migracije: `0002_accounts_seed.sql`, `0003_account_contacts_seed.sql`
   - ✅ Seed: `seedAccounts` - 50 companies, 100 contacts
   - 📦 Tabele: `accounts`, `account_contacts`, `account_addresses`
   - 🔗 Zavisi od: `auth`

3. **Products** (`products`)
   - ✅ Migracije: `0010_products_inventory_indexes.sql`
   - ✅ Seed: `seedProducts` - categories, locations, products, inventory
   - 📦 Tabele: `product_categories`, `products`, `inventory_locations`, `inventory_items`
   - 🔗 Zavisi od: `auth`

4. **CRM** (`crm`)
   - ✅ Migracije: `0005_crm_tables.sql`, `0006_crm_tables.sql`
   - ✅ Seed: `seedCrm` - 60 leads, 60 activities, 50 deals
   - 📦 Tabele: `leads`, `client_activities`, `deals`
   - 🔗 Zavisi od: `auth`, `accounts`

5. **Sales** (`sales`)
   - ✅ Migracije: `0004_sales_status_updates.sql`
   - ✅ Seed: `seedSales` - 50 quotes, 50 orders, 50 invoices (sa po 10 stavki)
   - 📦 Tabele: `quotes`, `quote_items`, `orders`, `order_items`, `invoices`, `invoice_items`, `payments`
   - 🔗 Zavisi od: `accounts`, `products`

6. **Projects** (`projects`)
   - ✅ Migracije: `0007_project_budget.sql`
   - ✅ Seed: `seedProjects` - 10 projects sa tasks, milestones, budget
   - 📦 Tabele: `projects`, `project_tasks`, `project_milestones`, `project_budget_entries`
   - 🔗 Zavisi od: `auth`, `accounts`

7. **Settings** (`settings`)
   - ✅ Migracije: `0009_settings_team_members.sql`, `0013_fix_company_users_unique_index.sql`, `0014_add_company_to_team_members.sql`
   - ✅ Seed: `seedSettings` - 8 team members
   - 📦 Tabele: `team_members` (u API bazi)
   - 🔗 Zavisi od: `auth`

#### Moduli sa migracijama ali BEZ seed podataka:

8. **HR** (`hr`)
   - ✅ Migracije: Postoje u shemi
   - ❌ Seed: **NEDOSTAJE** - nema seed skripte
   - 📦 Tabele: `employees`, `employee_role_assignments`, `attendance_records`, `time_off_requests`, `payroll_entries`
   - ⚠️ **PROBLEM**: API ima HR shemu ali nema seed podataka

---

### 🟢 Dashboard Baza (`collector_dashboard`)

#### Moduli sa migracijama i seed podacima:

1. **Employees** (`employees`)
   - ✅ Migracije: `0001_create_employees.sql`, `0010_add_hashed_password_to_employees.sql`
   - ✅ Seed: `seedEmployees` - 24 zaposlena sa lozinkama
   - 📦 Tabele: `employees` (sa `hashed_password` kolonom)
   - 🔗 Zavisi od: ništa (standalone)

2. **Vault** (`vault`)
   - ✅ Migracije: `0003_create_vault.sql`, `0006_update_vault_foreign_keys.sql`
   - ✅ Seed: `seedVault` - osnovni root folderi
   - 📦 Tabele: `vault_folders`, `vault_files`
   - 🔗 Zavisi od: `teamchat_users` (foreign key)

#### Moduli sa migracijama ali BEZ seed podataka:

3. **Team Members** (`team_members`)
   - ✅ Migracije: `0002_create_team_members.sql`, `0008_add_company_to_team_members.sql`
   - ❌ Seed: **NEDOSTAJE**
   - 📦 Tabele: `team_members`
   - ⚠️ **PROBLEM**: Tabela postoji ali nema seed podataka

4. **Notifications** (`notifications`)
   - ✅ Migracije: `0004_create_notifications.sql`
   - ❌ Seed: **NEDOSTAJE**
   - 📦 Tabele: `notifications`
   - ⚠️ **PROBLEM**: Tabela postoji ali nema seed podataka

5. **TeamChat** (`teamchat`)
   - ✅ Migracije: `0005_create_teamchat.sql`
   - ❌ Seed: **NEDOSTAJE**
   - 📦 Tabele: `teamchat_users`, `teamchat_channels`, `teamchat_channel_members`, `teamchat_messages`
   - ⚠️ **PROBLEM**: Tabele postoje ali nema seed podataka
   - 💡 **NAPOMENA**: `teamchat_users` se automatski kreira pri login-u zaposlenih

6. **Chat** (`chat`)
   - ✅ Migracije: `0009_create_chat.sql`
   - ❌ Seed: **NEDOSTAJE**
   - 📦 Tabele: `chat_conversations`, `chat_messages`
   - ⚠️ **PROBLEM**: Tabele postoje ali nema seed podataka

7. **Company** (`company`)
   - ✅ Migracije: `0007_create_company.sql`
   - ❌ Seed: **NEDOSTAJE**
   - 📦 Tabele: `company`
   - ⚠️ **PROBLEM**: Tabela postoji ali nema seed podataka
   - 💡 **NAPOMENA**: Company se automatski kreira pri login-u zaposlenih

---

## 🔄 Šta dev skripta trenutno radi

### Migracije:
1. ✅ Pokreće API migracije (`bun run db:push` u `apps/api`)
2. ✅ Pokreće Dashboard migracije (`bun run db:migrate` u `apps/dashboard`)

### Seed:
1. ✅ Pokreće API seed (`bun run db:seed` u `apps/api`) - svi moduli:
   - `auth` → `accounts` → `products` → `crm` → `sales` → `projects` → `settings`
2. ✅ Pokreće Dashboard seed (`bun run db:seed` u `apps/dashboard`) - samo:
   - `employees`
   - `vault`

---

## ❌ Šta nedostaje

### API Baza:
- ❌ **HR seed** - Tabele postoje ali nema seed podataka
- ❌ **Notifications seed** - Tabela postoji ali nema seed podataka

### Dashboard Baza:

#### Nedostaju migracije:
- ✅ **Users migracija** - ✅ **REŠENO** - Kreirana `0000_create_users_and_companies.sql`
- ✅ **Companies migracija** - ✅ **REŠENO** - Kreirana `0000_create_users_and_companies.sql`
- ✅ **Deals migracija** - ✅ **REŠENO** - Kreirana `0012_create_deals.sql`

#### Nedostaju seed podaci:
- ❌ **Team Members seed** - Tabela postoji ali nema seed podataka
- ❌ **Notifications seed** - Tabela postoji ali nema seed podataka
- ❌ **TeamChat seed** - Tabele postoje ali nema seed podataka (ali se automatski kreira pri login-u)
- ❌ **Chat seed** - Tabele postoje ali nema seed podataka
- ❌ **Company seed** - Tabela postoji ali nema seed podataka (ali se automatski kreira pri login-u)
- ❌ **Deals seed** - Tabela postoji ali nema seed podataka
- ❌ **Users seed** - Tabela postoji ali nema seed podataka (ali se koriste iz `employees` preko login-a)
- ❌ **Companies seed** - Tabela postoji ali nema seed podataka (ali se automatski kreira pri login-u)

---

## 🎯 Preporuke

### Prioritet 1 (Kritično):
1. ✅ **Employees seed** - ✅ **REŠENO** - Dodata `hashed_password` kolona i seed podaci
2. ⚠️ **TeamChat seed** - Možda nije potrebno jer se automatski kreira pri login-u
3. ⚠️ **Company seed** - Možda nije potrebno jer se automatski kreira pri login-u

### Prioritet 2 (Korisno):
4. 📝 **Team Members seed** - Možda nije potrebno ako se koriste `employees` umesto `team_members`
5. 📝 **Notifications seed** - Možda nije potrebno jer se notifikacije kreiraju dinamički
6. 📝 **Chat seed** - Možda nije potrebno jer se chat kreira dinamički

### Prioritet 3 (Opciono):
7. 📝 **HR seed u API bazi** - Možda nije potrebno ako se koristi Dashboard `employees` tabela

---

## 📋 Rezime

### ✅ Potpuno funkcionalni moduli (migracije + seed):
- **API**: auth, accounts, products, crm, sales, projects, settings
- **Dashboard**: employees, vault

### ⚠️ Delimično funkcionalni moduli (samo migracije):
- **API**: hr, notifications
- **Dashboard**: team_members, notifications, teamchat, chat, company

### ✅ Moduli sa shemom i migracijama (ali bez seed podataka):
- **Dashboard**: users, companies, deals, team_members, notifications, teamchat, chat, company

### 🔧 Dev skripta:
- ✅ Pokreće sve migracije (koje postoje)
- ✅ Pokreće seed za funkcionalne module
- ⚠️ Ne pokreće seed za delimično funkcionalne module (jer ne postoje)
- ✅ **REŠENO**: Kreirane migracije za `users`, `companies` i `deals` u dashboard bazi

