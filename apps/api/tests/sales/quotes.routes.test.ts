import type { FastifyInstance } from "fastify";
import { Pool, PoolClient } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import Fastify from "fastify";

import { cachePlugin } from "../../src/lib/cache.service";
import corsPlugin from "../../src/plugins/cors";
import errorHandlerPlugin from "../../src/plugins/error-handler";
import openApiPlugin from "../../src/plugins/openapi";
import salesRoutes from "../../src/modules/sales/sales.routes";
import healthRoutes from "../../src/routes/health";
import type { AppDatabase } from "../../src/db";
import { createTestPool } from "../utils/test-db";

const parseBody = <T>(responseBody: string): T => JSON.parse(responseBody) as T;

const buildTestServer = async (database: AppDatabase): Promise<FastifyInstance> => {
	const app = Fastify({ logger: false });

	app.decorate("db", { getter: () => database });
	app.decorateRequest("db", { getter: () => database });

	await app.register(corsPlugin);
	await app.register(cachePlugin);
	await app.register(errorHandlerPlugin);
	await app.register(openApiPlugin);
	await app.register(healthRoutes, { prefix: "/api" });
	await app.register(salesRoutes, { prefix: "/api/sales" });

	return app;
};

describe("Quotes API routes", () => {
	let pool: Pool;
	let client: PoolClient;
	let app: FastifyInstance;
	let companyId: string;
	let contactId: string;

	beforeAll(async () => {
		pool = await createTestPool();
	});

	afterAll(async () => {
		await pool.end();
	});

	beforeEach(async () => {
		client = await pool.connect();
		await client.query("BEGIN");

		// Create test company and contact
		const companyResult = await client.query(
			`INSERT INTO companies (id, name, type, email, phone, tax_id, country, created_at, updated_at)
       VALUES (gen_random_uuid(), 'Test Company', 'customer', 'test@example.com', '+1234567890', 'TAX-001', 'US', NOW(), NOW())
       RETURNING id`
		);
		companyId = companyResult.rows[0].id;

		const contactResult = await client.query(
			`INSERT INTO contacts (id, company_id, first_name, last_name, email, phone, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, 'John', 'Doe', 'john@example.com', '+1234567891', NOW(), NOW())
       RETURNING id`,
			[companyId]
		);
		contactId = contactResult.rows[0].id;

		const database = drizzleNodePostgres(client);
		app = await buildTestServer(database);
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
		await client.query("ROLLBACK");
		client.release();
	});

	it("should list quotes", async () => {
		// Create a test quote
		const _quoteResult = await client.query(
			`INSERT INTO quotes (quote_number, company_id, contact_id, quote_date, valid_until, currency, subtotal, tax, total, status, created_at, updated_at)
       VALUES ('QT-001', $1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'USD', 100.00, 20.00, 120.00, 'draft', NOW(), NOW())
       RETURNING id`,
			[companyId, contactId]
		);

		const response = await app.inject({
			method: "GET",
			url: "/api/sales/quotes"
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: unknown[]; total: number }>(response.body);
		expect(Array.isArray(payload.data)).toBe(true);
		expect(payload.total).toBeGreaterThanOrEqual(1);
	});

	it("should get quote by id", async () => {
		const quoteResult = await client.query(
			`INSERT INTO quotes (quote_number, company_id, contact_id, quote_date, valid_until, currency, subtotal, tax, total, status, created_at, updated_at)
       VALUES ('QT-002', $1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'USD', 200.00, 40.00, 240.00, 'draft', NOW(), NOW())
       RETURNING id`,
			[companyId, contactId]
		);
		const quoteId = quoteResult.rows[0].id;

		const response = await app.inject({
			method: "GET",
			url: `/api/sales/quotes/${quoteId}`
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: { id: number; quoteNumber: string } }>(response.body);
		expect(payload.data.id).toBe(quoteId);
		expect(payload.data.quoteNumber).toBe("QT-002");
	});

	it("should create a new quote", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/api/sales/quotes",
			payload: {
				quoteNumber: "QT-003",
				companyId,
				contactId,
				quoteDate: new Date().toISOString().split("T")[0],
				validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
				currency: "USD",
				status: "draft",
				items: [
					{
						description: "Test Product",
						quantity: 2,
						unitPrice: 50.0
					}
				]
			}
		});

		expect(response.statusCode).toBe(201);
		const payload = parseBody<{ data: { id: number; quoteNumber: string; total: number } }>(response.body);
		expect(payload.data.quoteNumber).toBe("QT-003");
		expect(payload.data.total).toBe(120.0); // 2 * 50 + 20% tax
	});

	it("should update a quote", async () => {
		const quoteResult = await client.query(
			`INSERT INTO quotes (quote_number, company_id, contact_id, quote_date, valid_until, currency, subtotal, tax, total, status, created_at, updated_at)
       VALUES ('QT-004', $1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'USD', 100.00, 20.00, 120.00, 'draft', NOW(), NOW())
       RETURNING id`,
			[companyId, contactId]
		);
		const quoteId = quoteResult.rows[0].id;

		const response = await app.inject({
			method: "PATCH",
			url: `/api/sales/quotes/${quoteId}`,
			payload: {
				status: "sent",
				notes: "Updated quote"
			}
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: { id: number; status: string; notes: string } }>(response.body);
		expect(payload.data.id).toBe(quoteId);
		expect(payload.data.status).toBe("sent");
		expect(payload.data.notes).toBe("Updated quote");
	});

	it("should delete a quote", async () => {
		const quoteResult = await client.query(
			`INSERT INTO quotes (quote_number, company_id, contact_id, quote_date, valid_until, currency, subtotal, tax, total, status, created_at, updated_at)
       VALUES ('QT-005', $1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'USD', 100.00, 20.00, 120.00, 'draft', NOW(), NOW())
       RETURNING id`,
			[companyId, contactId]
		);
		const quoteId = quoteResult.rows[0].id;

		const deleteResponse = await app.inject({
			method: "DELETE",
			url: `/api/sales/quotes/${quoteId}`
		});

		expect(deleteResponse.statusCode).toBe(204);

		const getResponse = await app.inject({
			method: "GET",
			url: `/api/sales/quotes/${quoteId}`
		});

		expect(getResponse.statusCode).toBe(404);
	});

	it("should return 404 for non-existent quote", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/api/sales/quotes/99999"
		});

		expect(response.statusCode).toBe(404);
	});

	it("should filter quotes by status", async () => {
		const _quoteResult = await client.query(
			`INSERT INTO quotes (quote_number, company_id, contact_id, quote_date, valid_until, currency, subtotal, tax, total, status, created_at, updated_at)
       VALUES ('QT-006', $1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'USD', 100.00, 20.00, 120.00, 'draft', NOW(), NOW())
       RETURNING id`,
			[companyId, contactId]
		);

		const response = await app.inject({
			method: "GET",
			url: "/api/sales/quotes?status=draft"
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: unknown[]; total: number }>(response.body);
		expect(payload.total).toBeGreaterThanOrEqual(1);
	});
});

