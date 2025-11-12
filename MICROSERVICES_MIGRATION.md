# Migracija Chat & Notification Sistema u Mikroservise

## 📋 Pregled

Ovaj dokument opisuje kompletnu migraciju chat i notification sistema iz monolitne Next.js aplikacije u mikroservisnu arhitekturu. Migracija je dizajnirana da zadrži postojeći UI i korisničko iskustvo, fokusirajući se isključivo na backend refaktor.

## 🏗️ Arhitektura

### Pre Migracije (Monolitna)

```
┌─────────────────────────────────────┐
│      Next.js Dashboard App          │
│  ┌───────────────────────────────┐ │
│  │  Next.js API Routes            │ │
│  │  - /api/chat/*                 │ │
│  │  - /api/teamchat/*              │ │
│  │  - /api/notifications/*         │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │  Socket Server (socket-server) │ │
│  │  - /socket/notifications       │ │
│  │  - /socket/teamchat            │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │  Drizzle ORM                  │ │
│  │  - Direct DB Access           │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
           │
           ▼
    ┌─────────────┐
    │  PostgreSQL │
    └─────────────┘
```

### Posle Migracije (Mikroservisi)

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Dashboard App                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Frontend Components (UI ostaje isti)                 │  │
│  │  - Socket.IO Clients → Chat/Notification Services     │  │
│  │  - API Calls → Chat/Notification Services             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           │                          │
           │                          │
    ┌──────▼──────┐          ┌────────▼────────┐
    │ Chat Service │          │Notification    │
    │  Port: 4001  │          │Service         │
    │              │          │Port: 4002      │
    │ ┌──────────┐ │          │                │
    │ │Fastify  │ │          │ ┌────────────┐ │
    │ │API      │ │          │ │Fastify API │ │
    │ └──────────┘ │          │ └────────────┘ │
    │ ┌──────────┐ │          │ ┌────────────┐ │
    │ │Socket.IO │ │          │ │Socket.IO   │ │
    │ │+ Redis   │ │          │ │+ Redis     │ │
    │ └──────────┘ │          │ └────────────┘ │
    │ ┌──────────┐ │          │ ┌────────────┐ │
    │ │Drizzle   │ │          │ │Drizzle    │ │
    │ │ORM       │ │          │ │ORM        │ │
    │ └──────────┘ │          │ └────────────┘ │
    └──────┬───────┘          └────────┬───────┘
           │                          │
           │  Redis Pub/Sub           │
           │  (events:new_message)    │
           │                          │
           └──────────┬───────────────┘
                      │
           ┌──────────▼──────────┐
           │   PostgreSQL        │
           │   (Shared DB)       │
           └─────────────────────┘
                      │
           ┌──────────▼──────────┐
           │   Redis             │
           │   - Pub/Sub         │
           │   - Socket Adapter   │
           └─────────────────────┘
```

## 📁 Struktura Projekta

```
Collector-Dashboard/
├── services/
│   ├── chat-service/
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── schema/
│   │   │   │   │   ├── core.ts          # Companies schema
│   │   │   │   │   ├── chat.ts          # Chat conversations & messages
│   │   │   │   │   └── teamchat.ts      # Team chat channels & messages
│   │   │   │   └── index.ts             # DB connection
│   │   │   ├── lib/
│   │   │   │   ├── auth.ts              # JWT middleware
│   │   │   │   ├── repository.ts        # Chat repository functions
│   │   │   │   └── teamchat-repository.ts # Team chat repository
│   │   │   ├── routes/
│   │   │   │   ├── conversations.ts     # Chat conversations API
│   │   │   │   ├── messages.ts          # Chat messages API
│   │   │   │   ├── channels.ts          # Team chat channels API
│   │   │   │   ├── channel-messages.ts  # Team chat messages API
│   │   │   │   ├── bootstrap.ts         # Team chat bootstrap
│   │   │   │   └── direct-messages.ts   # Direct message targets
│   │   │   ├── socket/
│   │   │   │   └── handler.ts           # Socket.IO handlers
│   │   │   └── server.ts                # Main server file
│   │   ├── drizzle/
│   │   │   └── schema.ts                # Drizzle schema exports
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   └── notification-service/
│       ├── src/
│       │   ├── db/
│       │   │   ├── schema/
│       │   │   │   ├── core.ts          # Companies schema
│       │   │   │   ├── users.ts         # Users schema
│       │   │   │   └── notifications.ts # Notifications schema
│       │   │   └── index.ts             # DB connection
│       │   ├── lib/
│       │   │   ├── auth.ts              # JWT middleware
│       │   │   ├── repository.ts        # Notification repository
│       │   │   └── event-listener.ts     # Redis pub/sub listener
│       │   ├── routes/
│       │   │   └── notifications.ts     # Notifications API
│       │   ├── socket/
│       │   │   └── handler.ts           # Socket.IO handlers
│       │   └── server.ts                # Main server file
│       ├── drizzle/
│       │   └── schema.ts                # Drizzle schema exports
│       ├── package.json
│       ├── tsconfig.json
│       ├── Dockerfile
│       └── README.md
│
├── shared/
│   └── lib/
│       └── auth.ts                      # Shared JWT validation
│
└── docker-compose.yml                   # Updated with new services
```

## 🔌 API Reference

### Chat Service (Port 4001)

#### Chat Conversations

**GET `/api/conversations`**

- Lista svih konverzacija za trenutnog korisnika
- Headers: `Authorization: Bearer <token>`
- Response: `{ conversations: ChatConversation[] }`

**POST `/api/conversations`**

- Kreiranje nove konverzacije
- Body: `{ targetUserId: string }`
- Response: `{ conversation: ChatConversation }`

**GET `/api/conversations/:id/messages`**

- Poruke konverzacije
- Query: `?limit=50` (default: 50, max: 100)
- Response: `{ messages: ChatMessage[] }`

**POST `/api/conversations/:id/messages`**

- Slanje poruke u konverzaciju
- Body: `{ content?: string, type?: string, fileUrl?: string, fileMetadata?: string }`
- Response: `{ message: ChatMessage }`

#### Team Chat Channels

**GET `/api/channels`**

- Lista kanala za trenutnog korisnika
- Response: `{ channels: ChannelSummary[] }`

**POST `/api/channels`**

- Kreiranje direktnog message kanala
- Body: `{ targetUserId: string }`
- Response: `{ channelId: string, channel?: ChannelSummary }`

**GET `/api/messages`**

- Poruke kanala
- Query: `?channelId=<uuid>&limit=50`
- Response: `{ messages: MessageWithAuthor[] }`

**POST `/api/messages`**

- Slanje poruke u kanal
- Body: `{ channelId: string, content?: string, fileUrl?: string }`
- Response: `{ message: MessageWithAuthor }`

#### Team Chat Bootstrap

**GET `/api/teamchat/bootstrap`**

- Inicijalizacija team chat-a (kreira korisnika, company, general channel)
- Response: `{ currentUser, channels, directMessageTargets }`

**GET `/api/teamchat/direct-messages`**

- Lista korisnika za direktne poruke
- Response: `{ members: ChannelMemberSummary[] }`

### Notification Service (Port 4002)

**GET `/api/notifications`**

- Lista notifikacija
- Query: `?limit=50&offset=0&unreadOnly=false`
- Response: `{ notifications: Notification[], total: number, unreadCount: number }`

**GET `/api/notifications/unread-count`**

- Broj nepročitanih notifikacija
- Response: `{ count: number }`

**POST `/api/notifications`**

- Kreiranje notifikacije
- Body: `{ title: string, message: string, type?: "info"|"success"|"warning"|"error", link?: string, recipientId: string }`
- Response: `Notification`

**PATCH `/api/notifications/mark-read`**

- Označavanje notifikacija kao pročitanih
- Body: `{ ids: string[] }`
- Response: `{ success: boolean, updated: number, updatedIds: string[], unreadCount: number }`

## 🔌 Socket.IO Events

### Chat Service Socket (`/socket/teamchat`)

**Client → Server:**

- `join` - Pridruživanje kanalu/konverzaciji
  - Payload: `{ channelId?: string, conversationId?: string }`

**Server → Client:**

- `message:new` - Nova poruka u kanalu
- `channel:updated` - Kanal ažuriran
- `chat:message:new` - Nova poruka u chat konverzaciji
- `chat:conversation:updated` - Chat konverzacija ažurirana

### Notification Service Socket (`/socket/notifications`)

**Client → Server:**

- `join` - Pridruživanje user room-u
  - Payload: `{ userId?: string }`

**Server → Client:**

- `notification:new` - Nova notifikacija
- `notification:read` - Notifikacija pročitana
  - Payload: `{ updatedIds: string[], unreadCount: number }`

## 🔄 Redis Pub/Sub

### Kanali

**`events:new_message`**

- Publikuje: Chat Service
- Sluša: Notification Service
- Payload:

```json
{
  "channelId": "uuid",
  "conversationId": "uuid", // opciono
  "message": {
    "id": "uuid",
    "content": "string",
    "senderId": "uuid",
    ...
  },
  "memberIds": ["uuid1", "uuid2"],
  "companyId": "uuid"
}
```

Notification service automatski kreira notifikacije za sve članove osim pošiljaoca.

## 🔐 Autentifikacija

Svi servisi koriste JWT autentifikaciju preko shared biblioteke.

### JWT Payload Format

```typescript
{
  userId: string;
  companyId: string;
  email: string;
  [key: string]: unknown;
}
```

### Middleware

Svaki servis ima `authMiddleware` koji:

1. Ekstraktuje token iz `Authorization: Bearer <token>` headera
2. Validira token koristeći `JWT_SECRET`
3. Dodaje `user` objekat na `request` objekat

### Socket.IO Autentifikacija

Socket.IO koristi middleware za autentifikaciju:

- Token se prosleđuje kroz `Authorization` header ili `query.userId` (backward compatibility)

## 🗄️ Database Schema

### Chat Service Schema

**chat_conversations**

- `id`, `user_id_1`, `user_id_2`, `company_id`
- `last_message_at`, `last_message`
- `created_at`, `updated_at`

**chat_messages**

- `id`, `conversation_id`, `sender_id`
- `content`, `type`, `status`
- `file_url`, `file_metadata`
- `read_at`, `created_at`, `updated_at`

**teamchat_channels**

- `id`, `name`, `is_private`
- `metadata` (JSON), `company_id`
- `created_at`, `updated_at`

**teamchat_messages**

- `id`, `channel_id`, `sender_id`
- `content`, `file_url`
- `created_at`, `updated_at`

**teamchat_channel_members**

- `channel_id`, `user_id`
- `joined_at`, `last_read_at`

### Notification Service Schema

**notifications**

- `id`, `title`, `message`, `type`
- `link`, `read`
- `recipient_id`, `company_id`
- `created_at`

## 🐳 Docker Deployment

### docker-compose.yml

```yaml
services:
  chat-service:
    build:
      context: .
      dockerfile: services/chat-service/Dockerfile
    environment:
      PORT: 4001
      DATABASE_URL: postgresql://...
      REDIS_URL: redis://...
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "4001:4001"

  notification-service:
    build:
      context: .
      dockerfile: services/notification-service/Dockerfile
    environment:
      PORT: 4002
      DATABASE_URL: postgresql://...
      REDIS_URL: redis://...
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "4002:4002"
```

### Environment Variables

**Chat Service:**

- `PORT` - Port servisa (default: 4001)
- `HOST` - Host (default: 0.0.0.0)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret za JWT validaciju
- `NODE_ENV` - production/development
- `ALLOWED_ORIGINS` - CORS origins (comma-separated)

**Notification Service:**

- `PORT` - Port servisa (default: 4002)
- `HOST` - Host (default: 0.0.0.0)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret za JWT validaciju
- `NODE_ENV` - production/development
- `ALLOWED_ORIGINS` - CORS origins (comma-separated)

**Frontend (Next.js):**

- `NEXT_PUBLIC_CHAT_SERVICE_URL` - Chat service URL (default: http://localhost:4001)
- `NEXT_PUBLIC_NOTIFICATION_SERVICE_URL` - Notification service URL (default: http://localhost:4002)

## 🚀 Development

### Lokalni Development

1. **Pokretanje servisa:**

```bash
# Chat Service
cd services/chat-service
bun install
bun run dev

# Notification Service
cd services/notification-service
bun install
bun run dev
```

2. **Pokretanje sa Docker Compose:**

```bash
docker-compose up --build
```

3. **Database Migrations:**

```bash
# Chat Service
cd services/chat-service
bun run db:generate
bun run db:push

# Notification Service
cd services/notification-service
bun run db:generate
bun run db:push
```

### Production Build

```bash
# Chat Service
cd services/chat-service
bun run build
bun run start

# Notification Service
cd services/notification-service
bun run build
bun run start
```

## 🔄 Migracija Frontend-a

### Socket Klijenti

**Pre:**

```typescript
const socketUrl = `http://localhost:3001`;
socket = io(socketUrl, { path: "/socket/teamchat" });
```

**Posle:**

```typescript
const serviceUrl =
  process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:4001";
socket = io(serviceUrl, { path: "/socket/teamchat", withCredentials: true });
```

### API Pozivi

**Pre:**

```typescript
fetch("/api/chat/conversations", { ... })
```

**Posle:**

```typescript
const serviceUrl = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:4001";
fetch(`${serviceUrl}/api/conversations`, {
  headers: { Authorization: `Bearer ${token}` },
  ...
})
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints

- Chat Service: `GET http://localhost:4001/health`
- Notification Service: `GET http://localhost:4002/health`

Response:

```json
{
  "status": "ok",
  "service": "chat-service" // ili "notification-service"
}
```

## 🔍 Troubleshooting

### Problem: Socket.IO connection fails

**Rešenje:**

- Proverite da li je servis pokrenut
- Proverite CORS konfiguraciju (`ALLOWED_ORIGINS`)
- Proverite da li je `withCredentials: true` u socket klijentu

### Problem: JWT validation fails

**Rešenje:**

- Proverite da li je `JWT_SECRET` isti u svim servisima
- Proverite da li se token prosleđuje u `Authorization` headeru
- Proverite token format: `Bearer <token>`

### Problem: Redis pub/sub ne radi

**Rešenje:**

- Proverite Redis konekciju (`REDIS_URL`)
- Proverite da li su oba servisa povezana na isti Redis instance
- Proverite logove za Redis connection errors

### Problem: Notifikacije se ne kreiraju

**Rešenje:**

- Proverite da li chat service publikuje na `events:new_message`
- Proverite da li notification service sluša kanal
- Proverite da li su `memberIds` uključeni u Redis payload

## 🎯 Prednosti Migracije

1. **Skalabilnost**: Svaki servis može biti nezavisno skaliran
2. **Izolacija**: Greške u jednom servisu ne utiču na druge
3. **Nezavisni Deployment**: Servisi se mogu deploy-ovati nezavisno
4. **Tehnološki Stack**: Svaki servis može koristiti optimalan stack
5. **Horizontalno Skaliranje**: Socket.IO sa Redis adapterom omogućava multiple instances
6. **Lakše Održavanje**: Manji, fokusirani kod je lakši za održavanje

## 📝 Napomene

- **UI ostaje isti**: Migracija ne menja korisničko iskustvo
- **Backward Compatibility**: Postojeći API pozivi su proxy-ovani kroz Next.js rute
- **Shared Database**: Oba servisa koriste istu PostgreSQL bazu (moguće je izdvojiti u budućnosti)
- **Multi-tenancy**: Svi servisi podržavaju multi-tenant arhitekturu preko `companyId`

## 🔮 Buduća Poboljšanja

1. **API Gateway**: Implementacija API Gateway-a za centralizovano rukovanje rutama
2. **Separate Databases**: Izdvajanje baza po servisima
3. **Service Discovery**: Implementacija service discovery mehanizma
4. **Circuit Breaker**: Dodavanje circuit breaker pattern-a za otpornost na greške
5. **Distributed Tracing**: Implementacija distributed tracing za debugging
6. **Kubernetes Deployment**: Kubernetes YAML konfiguracije za production

## 📚 Dodatni Resursi

- [Chat Service README](./services/chat-service/README.md)
- [Notification Service README](./services/notification-service/README.md)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/)
- [Fastify Documentation](https://www.fastify.io/)
