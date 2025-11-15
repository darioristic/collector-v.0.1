# TeamChat Integracija

## Pregled

TeamChat je nova interna aplikacija za razmenu poruka koja zamenjuje stari `/apps/chat` modul. Implementacija uvodi real-time komunikaciju pomoću Socket.io, višekompanijsku izolaciju (svaki korisnik vidi samo kanale i poruke svoje kompanije), kao i administraciju članova tima kroz postojeću stranicu `Settings → Teams`.

## Struktura projektnog koda

```
apps/dashboard/
 ├─ app/
 │   ├─ (protected)/
 │   │   ├─ apps/teamchat/
 │   │   │   ├─ page.tsx
 │   │   │   ├─ team-chat-client.tsx
 │   │   │   └─ components/
 │   │   │       ├─ ChatSidebar.tsx
 │   │   │       ├─ ChatHeader.tsx
 │   │   │       ├─ ChatWindow.tsx
 │   │   │       ├─ MessageBubble.tsx
 │   │   │       └─ MessageInput.tsx
 │   │   └─ settings/teams/... (osveženi timetable API pozivi)
 │   └─ api/
 │       ├─ teamchat/
 │       │   ├─ channels/route.ts
 │       │   ├─ messages/route.ts
 │       │   ├─ direct-messages/route.ts
 │       │   └─ upload/route.ts
 │       └─ settings/team-members/...
 ├─ lib/
 │   ├─ teamchat/
 │   │   ├─ repository.ts
 │   │   ├─ socket-client.ts
 │   │   └─ socket-server.ts
 │   ├─ db/schema/teamchat.ts
 │   └─ validations/teamchat.ts
 ├─ pages/api/teamchat/socket.ts
 └─ components/layout/sidebar/nav-main.tsx
```

## Backend sloj

### Šema i migracije
- `lib/db/schema/teamchat.ts` uvodi sledeće tabele:
  - `companies`, `users`, `channels`, `channel_members`, `messages`.
  - Svi zapisi referenciraju `companyId`, čime se obezbeđuje izolacija po kompaniji.
- Migracije (`lib/db/migrations`):
  - `0005_create_teamchat.sql` kreira nove tabele.
  - `0006_update_vault_foreign_keys.sql` povezuje `vault_folders` i `vault_files` sa tabelom `users`.

### Repozitorijum (`lib/teamchat/repository.ts`)
- `bootstrapTeamChat`: upsert kompanije i korisnika iz sesije, obezbeđuje postojanje `general` kanala i vraća podatke potrebne UI-ju (kanali, korisnik, dostupni DM targeti).
- `listChannels` / `listDirectMessageTargets`: vraćaju listu kanala i korisnika ograničenu na `companyId` korisnika.
- `getChannelMessages`: validira pristup kanalu (privatni vs. javni) i vraća poruke sa podacima o autoru.
- `createMessage`: insertuje novu poruku, ažurira `channels.updatedAt`, emituje Socket.io događaje `message:new` i `channel:updated`.
- `upsertDirectMessageChannel`: pronalazi ili kreira privatni kanal između dva korisnika.

### API rute
- `/api/teamchat/channels` (`GET`, `POST`) – listanje i kreiranje DM kanala.
- `/api/teamchat/messages` (`GET`, `POST`) – čitanje i slanje poruka.
- `/api/teamchat/direct-messages` (`GET`) – lista dostupnih članova za DM.
- `/api/teamchat/upload` (`POST`) – upload fajlova (limit 15 MB) u `public/uploads/teamchat`.
- `pages/api/teamchat/socket.ts` – inicijalizuje Socket.io server sa putanjom `/api/teamchat/socket`.

### Settings → Team Management
- `/api/settings/team-members` i `/api/settings/team-members/[id]` sada rade nad tabelom `users`.
- POST operacija loguje placeholder poruku za slanje pozivnice (`console.info`).

### Vault integracija
- `lib/db/schema/vault.ts` + `app/api/vault/*` referenciraju `users` za vlasnike foldera/fajlova.
- Ažurirani upiti vraćaju ime i avatar kroz `users` odnos.

## Frontend sloj

### Server i klijent
- `app/(protected)/apps/teamchat/page.tsx`: server komponenta koja poziva `bootstrapTeamChat` i prosleđuje rezultat klijent komponenti.
- `team-chat-client.tsx`: klijent (React Query) koji upravlja stanjima:
  - učitavanje kanala, poruka, DM targeta;
  - slanje poruke i upload attachment-a;
  - slušanje Socket.io događaja (`message:new`, `channel:updated`);
  - lokalno praćenje `selectedChannelId`.

### UI komponente
- `ChatSidebar`: lista kanala i DM targeta, pretraga i placeholder CTA za kreiranje kanala.
- `ChatHeader`: naziv kanala, broj članova, indikator privatnosti.
- `ChatWindow`: prikaz poruka sa automatskim skrolovanjem na najnoviju poruku.
- `MessageBubble`: avatar, ime pošiljaoca, vreme, suporta image preview i link.
- `MessageInput`: tekst + upload (15 MB), validacija pre slanja.

### Navigacija i redirect
- `nav-main.tsx`: stavka “TeamChat” zamenjuje “Chats”.
- `app/(protected)/apps/chat/page.tsx`: odmah redirektuje na `/apps/teamchat`.

## Socket sloj
- `pages/api/teamchat/socket.ts` registruje Socket.io server i događaj `channel:join`.
- `lib/teamchat/socket-client.ts` kreira klijentsku konekciju (transports: `websocket`).
- Repozitorijum emituje događaje nakon `createMessage`, UI ih sluša i optimistički osvežava.

## Validacija i tipovi
- `lib/validations/teamchat.ts`: Zod šeme (`channelSummarySchema`, `messageResponseSchema`...) sa podrazumevanim `metadata: null`.
- `lib/teamchat/types.ts`: DTO tipovi (`TeamChatBootstrap`, `ChannelSummary`, `MessageWithAuthor`...).

## Podešavanje i pokretanje
1. Instalirati zavisnosti: `bun install`.
2. Generisati migracije (ako je potrebno): `bunx drizzle-kit generate`.
3. Primena migracija: `bun db:migrate`.
4. Pokrenuti razvojni server: `bun run dev`.

> Napomena: Potrebno je imati setovan `DATABASE_URL` i validnu auth sesiju (`auth_session` cookie) jer se `getCurrentAuth` poziva server-side.

## API Quick Reference
- `GET /api/teamchat/channels`
- `POST /api/teamchat/channels` `{ targetUserId }`
- `GET /api/teamchat/messages?channelId=…`
- `POST /api/teamchat/messages` `{ channelId, content?, fileUrl? }`
- `POST /api/teamchat/upload` (form-data, polje `file`)
- `GET /api/teamchat/direct-messages`
- `GET/POST/PATCH/DELETE /api/settings/team-members…`

## Testiranje i budući rad
- Preporuka: pokrenuti `bun lint` i `bun test` (nema novih testova, ali validacija integracije).
- Real-time proveriti u dva prozora pregledača (slanje poruka, update sidebar-a).
- Sledeći koraci:
  - stvarni email/pozivni sistem (umesto placeholder logova);
  - badge-ovi za unread poruke koristeći `channel_members.lastReadAt`;
  - dodatna validacija i logika upload-a (virus scan, višestruki fajlovi);
  - CI skripte za migracije i lint/test pre deploy-a.

## E2E i performanse
- `apps/dashboard/__tests__/teamchat.test.ts` proverava:
  - bootstrap šemu i inicijalizaciju;
  - kreiranje DM kanala i članstva;
  - slanje poruka i čitanje istorije;
  - performanse za 500 poruka sa vremenskim pragom.
- Pokretanje: `cd apps/dashboard && bun test __tests__/teamchat.test.ts`

## Dev setup za više korisnika
- Otvorite 3 prozora pregledača: Dario, Miha, Tara.
- Ulogujte se u Dashboard, otvorite `Apps → TeamChat`.
- Kreirajte DM kanale parova i proverite real-time tok poruka.
- Status online/offline se menja pri konekciji/dis-konekciji socket klijenta.

---
Za sva dodatna pitanja u vezi sa implementacijom ili proširenjem TeamChat funkcionalnosti, obratite se Core Frontend timu.
