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

describe("Orders API routes", () => {
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

	it("should list orders", async () => {
		// Create a test order
		const orderResult = await client.query(
			`INSERT INTO orders (order_number, company_id, contact_id, order_date, currency, subtotal, tax, total, status, created_at, updated_at)
       VALUES ('ORD-001', $1, $2, CURRENT_DATE, 'USD', 100.00, 20.00, 120.00, 'pending', NOW(), NOW())
       RETURNING id`,
			[companyId, contactId]
		);
		const orderId = orderResult.rows[0].id;

		const response = await app.inject({
			method: "GET",
			url: "/api/sales/orders"
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: unknown[]; total: number }>(response.body);
		expect(Array.isArray(payload.data)).toBe(true);
		expect(payload.total).toBeGreaterThanOrEqual(1);
		expect(payload.data.length).toBeGreaterThanOrEqual(1);
	});

	it("should get order by id", async () => {
		const orderResult = await client.query(
			`INSERT INTO orders (order_number, company_id, contact_id, order_date, currency, subtotal, tax, total, status, created_at, updated_at)
       VALUES ('ORD-002', $1, $2, CURRENT_DATE, 'USD', 200.00, 40.00, 240.00, 'pending', NOW(), NOW())
       RETURNING id`,
			[companyId, contactId]
		);
		const orderId = orderResult.rows[0].id;

		const response = await app.inject({
			method: "GET",
			url: `/api/sales/orders/${orderId}`
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: { id: number; orderNumber: string } }>(response.body);
		expect(payload.data.id).toBe(orderId);
		expect(payload.data.orderNumber).toBe("ORD-002");
	});

	it("should create a new order", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/api/sales/orders",
			payload: {
				orderNumber: "ORD-003",
				companyId,
				contactId,
				orderDate: new Date().toISOString().split("T")[0],
				currency: "USD",
				status: "pending",
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
		const payload = parseBody<{ data: { id: number; orderNumber: string; total: number } }>(response.body);
		expect(payload.data.orderNumber).toBe("ORD-003");
		expect(payload.data.total).toBe(120.0); // 2 * 50 + 20% tax
	});

	it("should update an order", async () => {
		const orderResult = await client.query(
			`INSERT INTO orders (order_number, company_id, contact_id, order_date, currency, subtotal, tax, total, status, created_at, updated_at)
       VALUES ('ORD-004', $1, $2, CURRENT_DATE, 'USD', 100.00, 20.00, 120.00, 'pending', NOW(), NOW())
       RETURNING id`,
			[companyId, contactId]
		);
		const orderId = orderResult.rows[0].id;

		const response = await app.inject({
			method: "PATCH",
			url: `/api/sales/orders/${orderId}`,
			payload: {
				status: "confirmed",
				notes: "Updated order"
			}
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: { id: number; status: string; notes: string } }>(response.body);
		expect(payload.data.id).toBe(orderId);
		expect(payload.data.status).toBe("confirmed");
		expect(payload.data.notes).toBe("Updated order");
	});

	it("should delete an order", async () => {
		const orderResult = await client.query(
			`INSERT INTO orders (order_number, company_id, contact_id, order_date, currency, subtotal, tax, total, status, created_at, updated_at)
       VALUES ('ORD-005', $1, $2, CURRENT_DATE, 'USD', 100.00, 20.00, 120.00, 'pending', NOW(), NOW())
       RETURNING id`,
			[companyId, contactId]
		);
		const orderId = orderResult.rows[0].id;

		const deleteResponse = await app.inject({
			method: "DELETE",
			url: `/api/sales/orders/${orderId}`
		});

		expect(deleteResponse.statusCode).toBe(204);

		const getResponse = await app.inject({
			method: "GET",
			url: `/api/sales/orders/${orderId}`
		});

		expect(getResponse.statusCode).toBe(404);
	});

	it("should return 404 for non-existent order", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/api/sales/orders/99999"
		});

		expect(response.statusCode).toBe(404);
	});

	it("should filter orders by companyId", async () => {
		const orderResult = await client.query(
			`INSERT INTO orders (order_number, company_id, contact_id, order_date, currency, subtotal, tax, total, status, created_at, updated_at)
       VALUES ('ORD-006', $1, $2, CURRENT_DATE, 'USD', 100.00, 20.00, 120.00, 'pending', NOW(), NOW())
       RETURNING id`,
			[companyId, contactId]
		);

		const response = await app.inject({
			method: "GET",
			url: `/api/sales/orders?companyId=${companyId}`
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: unknown[]; total: number }>(response.body);
		expect(payload.total).toBeGreaterThanOrEqual(1);
	});
});

