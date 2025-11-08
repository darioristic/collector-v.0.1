import type { FastifyInstance } from "fastify";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { Account } from "@crm/types";

let buildServer: typeof import("../src/server").buildServer;

const parseBody = <T>(responseBody: string): T => JSON.parse(responseBody) as T;

describe("Accounts API routes", () => {
  let app: FastifyInstance;
  let seededAccountIds: string[];

  beforeAll(async () => {
    process.env.DATABASE_URL = "";
    process.env.ACCOUNTS_REPOSITORY = "memory";

    ({ buildServer } = await import("../src/server"));
  });

  beforeEach(async () => {
    app = await buildServer();
    await app.ready();
    seededAccountIds = ["acc_0001", "acc_0002"];
  });

  afterEach(async () => {
    await app.close();
  });

  it("should list accounts", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/accounts"
    });

    expect(response.statusCode).toBe(200);

    const payload = parseBody<Account[]>(response.body);

    expect(Array.isArray(payload)).toBe(true);
    expect(payload).toHaveLength(2);
    expect(payload[0]).toMatchObject({
      id: seededAccountIds[0],
      name: "Acme Manufacturing",
      type: "company"
    });
  });

  it("should return a single account by id", async () => {
    const accountId = seededAccountIds[0];

    const response = await app.inject({
      method: "GET",
      url: `/api/accounts/${accountId}`
    });

    expect(response.statusCode).toBe(200);

    const payload = parseBody<Account>(response.body);

    expect(payload).toMatchObject({
      id: accountId,
      name: "Acme Manufacturing",
      type: "company"
    });
  });

  it("should create a new account", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/accounts",
      payload: {
        name: "New Horizon LLC",
        type: "company",
        email: "hello@newhorizon.example",
        phone: "+1-555-0150"
      }
    });

    expect(createResponse.statusCode).toBe(201);

    const created = parseBody<Account>(createResponse.body);

    expect(created.id).toMatch(/^[0-9a-fA-F-]{36}$/);
    expect(created).toMatchObject({
      name: "New Horizon LLC",
      type: "company",
      email: "hello@newhorizon.example"
    });

    const listResponse = await app.inject({
      method: "GET",
      url: "/api/accounts"
    });

    const listPayload = parseBody<Account[]>(listResponse.body);

    expect(listPayload).toHaveLength(3);
    expect(listPayload.some((account) => account.email === "hello@newhorizon.example")).toBe(true);
  });

  it("should prevent creating duplicate accounts by email", async () => {
    const payload = {
      name: "Duplicate Test",
      type: "individual" as const,
      email: "duplicate@example.com"
    };

    const firstResponse = await app.inject({
      method: "POST",
      url: "/api/accounts",
      payload
    });

    expect(firstResponse.statusCode).toBe(201);

    const duplicateResponse = await app.inject({
      method: "POST",
      url: "/api/accounts",
      payload
    });

    expect(duplicateResponse.statusCode).toBe(409);

    const errorPayload = parseBody<{ message: string }>(duplicateResponse.body);

    expect(errorPayload.message).toContain(payload.email);
  });

  it("should update an existing account", async () => {
    const accountId = seededAccountIds[0];

    const response = await app.inject({
      method: "PUT",
      url: `/api/accounts/${accountId}`,
      payload: {
        name: "Acme Manufacturing International",
        type: "company",
        email: "contact@acme.example",
        phone: "+1-555-0102"
      }
    });

    expect(response.statusCode).toBe(200);

    const payload = parseBody<Account>(response.body);

    expect(payload).toMatchObject({
      id: accountId,
      name: "Acme Manufacturing International",
      phone: "+1-555-0102"
    });
  });

  it("should delete an account", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/accounts",
      payload: {
        name: "Temp Account",
        type: "company",
        email: "temp@example.com"
      }
    });

    const created = parseBody<Account>(createResponse.body);

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/api/accounts/${created.id}`
    });

    expect(deleteResponse.statusCode).toBe(204);
    expect(deleteResponse.body).toBe("");

    const getResponse = await app.inject({
      method: "GET",
      url: `/api/accounts/${created.id}`
    });

    expect(getResponse.statusCode).toBe(404);
  });
});

