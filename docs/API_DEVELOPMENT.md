# API Development Guide

Detaljni vodič za razvoj API-ja u Collector Dashboard projektu.

## Sadržaj

- [Dodavanje novih ruta](#dodavanje-novih-ruta)
- [Kreiranje OpenAPI šema](#kreiranje-openapi-šema)
- [Validacija request/response](#validacija-requestresponse)
- [Error Handling](#error-handling)
- [Testing API ruta](#testing-api-ruta)
- [Caching](#caching)
- [Best Practices](#best-practices)

## Dodavanje novih ruta

### 1. Definiši tipove

U `*.types.ts` fajlu definiši TypeScript tipove:

```typescript
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  createdAt: string;
}

export interface InventoryCreateInput {
  name: string;
  quantity: number;
}
```

### 2. Implementiraj servis

U `*.service.ts` fajlu implementiraj business logiku:

```typescript
import type { AppDatabase } from "../../db";

export class InventoryService {
  constructor(private readonly database: AppDatabase) {}
  
  async list(): Promise<InventoryItem[]> {
    // Implementacija
  }
  
  async create(input: InventoryCreateInput): Promise<InventoryItem> {
    // Implementacija
  }
}
```

### 3. Kreiraj handler-e

U `*.controller.ts` fajlu kreiraj request handler-e:

```typescript
import type { RouteHandler } from "fastify";
import { InventoryService } from "./inventory.service";

export const listInventoryHandler: RouteHandler = async (request) => {
  const service = new InventoryService(request.db);
  return service.list();
};

export const createInventoryHandler: RouteHandler = async (request, reply) => {
  const service = new InventoryService(request.db);
  const item = await service.create(request.body);
  return reply.status(201).send(item);
};
```

### 4. Definiši OpenAPI šeme

U `*.schema.ts` fajlu definiši šeme za validaciju i dokumentaciju:

```typescript
import type { FastifySchema } from "fastify";

const inventoryItemSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    quantity: { type: "number" },
    createdAt: { type: "string", format: "date-time" }
  },
  required: ["id", "name", "quantity", "createdAt"],
  additionalProperties: false
} as const;

const createInventoryBodySchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    quantity: { type: "number", minimum: 0 }
  },
  required: ["name", "quantity"],
  additionalProperties: false
} as const;

const errorResponseSchema = {
  type: "object",
  properties: {
    statusCode: { type: "number" },
    error: { type: "string" },
    message: { type: "string" }
  },
  required: ["statusCode", "error", "message"],
  additionalProperties: false
} as const;

export const listInventorySchema: FastifySchema = {
  tags: ["inventory"],
  summary: "List inventory items",
  description: "Vraća listu svih inventarskih stavki",
  response: {
    200: {
      type: "array",
      items: inventoryItemSchema,
      description: "Lista inventarskih stavki"
    }
  }
};

export const createInventorySchema: FastifySchema = {
  tags: ["inventory"],
  summary: "Create inventory item",
  description: "Kreira novu inventarsku stavku",
  body: createInventoryBodySchema,
  response: {
    201: {
      ...inventoryItemSchema,
      description: "Kreirana inventarska stavka"
    },
    400: {
      ...errorResponseSchema,
      description: "Nevalidni podaci"
    }
  }
};
```

### 5. Registruj rute

U `*.routes.ts` fajlu registruj rute sa šemama:

```typescript
import type { FastifyPluginAsync } from "fastify";
import { listInventoryHandler, createInventoryHandler } from "./inventory.controller";
import { listInventorySchema, createInventorySchema } from "./inventory.schema";

const inventoryRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { schema: listInventorySchema }, listInventoryHandler);
  app.post("/", { schema: createInventorySchema }, createInventoryHandler);
};

export default inventoryRoutes;
```

### 6. Exportuj modul

U `index.ts` fajlu exportuj rute:

```typescript
import inventoryRoutes from "./inventory.routes";

export default inventoryRoutes;
```

## Kreiranje OpenAPI šema

### Obavezni delovi šeme

Svaka ruta mora imati:

1. **tags** - Kategorizacija rute
2. **summary** - Kratak opis
3. **description** - Detaljniji opis
4. **response** - Definicije response-ova za različite status kodove

### Primer kompletnog schema objekta

```typescript
export const getItemSchema: FastifySchema = {
  tags: ["inventory"],
  summary: "Get inventory item by ID",
  description: "Vraća detaljne informacije o konkretnoj inventarskoj stavci",
  params: {
    type: "object",
    properties: {
      id: { type: "string", minLength: 1 }
    },
    required: ["id"],
    additionalProperties: false
  },
  querystring: {
    type: "object",
    properties: {
      includeDetails: { type: "boolean" }
    },
    additionalProperties: false
  },
  response: {
    200: {
      ...inventoryItemSchema,
      description: "Detalji inventarske stavke"
    },
    404: {
      ...errorResponseSchema,
      description: "Stavka nije pronađena"
    }
  }
};
```

### Query parametri

Za query parametre koristi `querystring`:

```typescript
querystring: {
  type: "object",
  properties: {
    limit: { type: "string", pattern: "^[0-9]+$" },
    offset: { type: "string", pattern: "^[0-9]+$" },
    search: { type: "string" }
  },
  additionalProperties: false
}
```

### Path parametri

Za path parametre koristi `params`:

```typescript
params: {
  type: "object",
  properties: {
    id: { type: "string", minLength: 1 }
  },
  required: ["id"],
  additionalProperties: false
}
```

### Request body

Za request body koristi `body`:

```typescript
body: {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    quantity: { type: "number", minimum: 0 }
  },
  required: ["name", "quantity"],
  additionalProperties: false
}
```

## Validacija request/response

Fastify automatski validira request i response na osnovu šema.

### Request validacija

Ako request ne odgovara šemi, Fastify automatski vraća 400 grešku.

### Response validacija

U development okruženju, Fastify validira i response-ove. Ako response ne odgovara šemi, loguje se greška.

### Custom validacija

Za složeniju validaciju koristi custom validator:

```typescript
import { FastifySchema } from "fastify";

const customValidator = (value: any) => {
  if (value.quantity < 0) {
    throw new Error("Quantity must be positive");
  }
  return true;
};

export const createInventorySchema: FastifySchema = {
  // ...
  body: {
    // ...
    validator: customValidator
  }
};
```

## Error Handling

### Standardizovani error format

Koristi `createHttpError` helper za konzistentne greške:

```typescript
import { createHttpError } from "../../lib/errors";

export const getItemHandler: RouteHandler = async (request, reply) => {
  const item = await service.getById(request.params.id);
  
  if (!item) {
    return reply.status(404).send(
      createHttpError(404, `Item ${request.params.id} not found`, {
        error: "Not Found"
      })
    );
  }
  
  return item;
};
```

### HTTP status kodovi

- `200` - Success
- `201` - Created
- `204` - No Content (za DELETE)
- `400` - Bad Request (validacija)
- `404` - Not Found
- `409` - Conflict (duplikat)
- `500` - Internal Server Error

### Globalni error handler

Globalni error handler se nalazi u `src/plugins/error-handler.ts` i automatski formatira sve greške.

## Testing API ruta

### Unit testovi

Kreiraj test fajl u `tests/` folderu:

```typescript
import { test, expect } from "vitest";
import { buildServer } from "../src/server";

test("GET /api/inventory", async () => {
  const app = await buildServer();
  
  const response = await app.inject({
    method: "GET",
    url: "/api/inventory"
  });
  
  expect(response.statusCode).toBe(200);
  const data = JSON.parse(response.body);
  expect(Array.isArray(data)).toBe(true);
});
```

### Testiranje sa autentifikacijom

Ako ruta zahteva autentifikaciju:

```typescript
test("POST /api/inventory (authenticated)", async () => {
  const app = await buildServer();
  
  const response = await app.inject({
    method: "POST",
    url: "/api/inventory",
    headers: {
      authorization: "Bearer <token>"
    },
    payload: {
      name: "Test Item",
      quantity: 10
    }
  });
  
  expect(response.statusCode).toBe(201);
});
```

### Testiranje error slučajeva

```typescript
test("GET /api/inventory/:id (not found)", async () => {
  const app = await buildServer();
  
  const response = await app.inject({
    method: "GET",
    url: "/api/inventory/nonexistent-id"
  });
  
  expect(response.statusCode).toBe(404);
  const error = JSON.parse(response.body);
  expect(error.message).toContain("not found");
});
```

## Caching

### Redis caching

Za performanse, koristi Redis cache:

```typescript
export const getItemHandler: RouteHandler = async (request, reply) => {
  const cacheKey = `inventory:item:${request.params.id}`;
  
  // Proveri cache
  if (request.cache) {
    const cached = await request.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  // Uzmi iz baze
  const item = await service.getById(request.params.id);
  
  // Sačuvaj u cache
  if (request.cache && item) {
    await request.cache.set(cacheKey, item, { ttl: 300 }); // 5 minuta
  }
  
  return item;
};
```

### Cache invalidation

Kada se podaci menjaju, invalidiraj cache:

```typescript
export const updateItemHandler: RouteHandler = async (request, reply) => {
  const item = await service.update(request.params.id, request.body);
  
  // Invalidiramo cache
  if (request.cache) {
    await request.cache.delete(`inventory:item:${request.params.id}`);
    await request.cache.deletePattern("inventory:list:*");
  }
  
  return item;
};
```

## Best Practices

### 1. Uvek koristi šeme

Svaka ruta mora imati definisanu šemu za validaciju i dokumentaciju.

### 2. Dokumentuj sve

Dodaj `description` u sve šeme i JSDoc komentare u handler-e.

### 3. Koristi tipove

Definiši TypeScript tipove za sve input/output podatke.

### 4. Error handling

Uvek koristi `createHttpError` za konzistentne greške.

### 5. Logging

Koristi `request.log` za logovanje:

```typescript
request.log.info({ itemId: request.params.id }, "Fetching item");
request.log.error({ err: error }, "Failed to fetch item");
```

### 6. Performance

- Koristi caching za često pristupane podatke
- Optimizuj database queries
- Koristi paginaciju za liste

### 7. Security

- Validiraj sve input-e
- Koristi autentifikaciju gde je potrebno
- Sanitizuj user input

### 8. Testing

- Piši testove za sve rute
- Testiraj i success i error slučajeve
- Koristi mock-ove za eksterne servise

## Dodatni Resursi

- [Fastify Dokumentacija](https://www.fastify.io/docs/latest/)
- [OpenAPI Specifikacija](https://swagger.io/specification/)
- [Drizzle ORM Dokumentacija](https://orm.drizzle.team/)
- [Developer Guide](./DEVELOPER_GUIDE.md)

## Search Input Limits

- Polja sa ograničenjem dužine:
  - `products.search`: maksimalno 255 karaktera
  - `sales.orders.search`: maksimalno 255 karaktera
  - `accounts.search`: maksimalno 255 karaktera
- Truncation ponašanje:
  - Uklanja leading/trailing whitespace (`trim`)
  - Skraćuje string na tačno definisanu maksimalnu dužinu (`slice(0, limit)`)
  - Primena se vrši u `preValidation` hook-u rute
- Kako dodati ista pravila na nove endpointe:
  - Importovati `createSearchPreValidation(limit, fieldName)` iz `apps/api/src/lib/validation/search.ts`
  - Dodati u opcije rute: `{ preValidation: createSearchPreValidation(255, "search") }`
  - Po potrebi ažurirati JSON Schema (`maxLength`) za specifičan parametar

