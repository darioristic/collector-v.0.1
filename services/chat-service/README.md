# Chat Service

Mikroservis za chat i teamchat funkcionalnost.

## API Rute

- `GET /api/conversations` - Lista konverzacija
- `POST /api/conversations` - Kreiranje konverzacije
- `GET /api/conversations/:id/messages` - Poruke konverzacije
- `POST /api/conversations/:id/messages` - Slanje poruke
- `GET /api/channels` - Lista kanala
- `POST /api/channels` - Kreiranje kanala
- `GET /api/messages?channelId=...` - Poruke kanala
- `POST /api/messages` - Slanje poruke u kanal
- `GET /api/teamchat/bootstrap` - Bootstrap teamchat
- `GET /api/teamchat/direct-messages` - Lista direktnih poruka

## Socket Events

- `message:new` - Nova poruka
- `channel:updated` - Kanal ažuriran
- `conversation:updated` - Konverzacija ažurirana
- `chat:message:new` - Nova chat poruka

## Environment Variables

- `PORT` - Port na kome servis sluša (default: 4001)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret za JWT validaciju
- `ALLOWED_ORIGINS` - Dozvoljeni CORS origins (comma-separated)

## Development

```bash
bun install
bun run dev
```

## Production

```bash
bun run build
bun run start
```

