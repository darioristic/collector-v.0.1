import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Account } from "@crm/types";

import { buildServer } from "../src/server";

const parseBody = <T>(responseBody: string): T => JSON.parse(responseBody) as T;

describe("Accounts API routes", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildServer();
    await app.ready();
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
      id: "acc_001",
      name: "Acme Manufacturing",
      type: "company"
    });
  });

  it("should return a single account by id", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/accounts/acc_001"
    });

    expect(response.statusCode).toBe(200);

    const payload = parseBody<Account>(response.body);

    expect(payload).toMatchObject({
      id: "acc_001",
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

    expect(created.id).toMatch(/^acc_/);
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
    const response = await app.inject({
      method: "PUT",
      url: "/api/accounts/acc_001",
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
      id: "acc_001",
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

