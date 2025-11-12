# Notification Service

Mikroservis za notifikacije.

## API Rute

- `GET /api/notifications` - Lista notifikacija
- `GET /api/notifications/unread-count` - Broj nepročitanih
- `POST /api/notifications` - Kreiranje notifikacije
- `PATCH /api/notifications/mark-read` - Označavanje kao pročitano

## Socket Events

- `notification:new` - Nova notifikacija
- `notification:read` - Notifikacija pročitana

## Redis Pub/Sub

Sluša `events:new_message` kanal i automatski kreira notifikacije za nove poruke.

## Environment Variables

- `PORT` - Port na kome servis sluša (default: 4002)
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

