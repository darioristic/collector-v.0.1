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

describe("Invoices API routes", () => {
	const connectionString =
		process.env.TEST_DATABASE_URL ?? "postgresql://collector:collector@localhost:5432/collector";

	let pool: Pool;
	let client: PoolClient;
	let app: FastifyInstance;
	let companyId: string;
	let contactId: string;
	let orderId: number;

	beforeAll(async () => {
		pool = new Pool({ connectionString });
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

		// Create test order
		const orderResult = await client.query(
			`INSERT INTO orders (order_number, company_id, contact_id, order_date, currency, subtotal, tax, total, status, created_at, updated_at)
       VALUES ('ORD-INV-001', $1, $2, CURRENT_DATE, 'USD', 100.00, 20.00, 120.00, 'confirmed', NOW(), NOW())
       RETURNING id`,
			[companyId, contactId]
		);
		orderId = orderResult.rows[0].id;

		const database = drizzleNodePostgres(client);
		app = await buildTestServer(database);
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
		await client.query("ROLLBACK");
		client.release();
	});

	it("should list invoices", async () => {
		// Create a test invoice
		const invoiceResult = await client.query(
			`INSERT INTO invoices (invoice_number, company_id, order_id, invoice_date, due_date, currency, subtotal, tax, total, status, created_at, updated_at)
       VALUES ('INV-001', $1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'USD', 100.00, 20.00, 120.00, 'draft', NOW(), NOW())
       RETURNING id`,
			[companyId, orderId]
		);

		const response = await app.inject({
			method: "GET",
			url: "/api/sales/invoices"
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: unknown[]; total: number }>(response.body);
		expect(Array.isArray(payload.data)).toBe(true);
		expect(payload.total).toBeGreaterThanOrEqual(1);
	});

	it("should get invoice by id", async () => {
		const invoiceResult = await client.query(
			`INSERT INTO invoices (invoice_number, company_id, order_id, invoice_date, due_date, currency, subtotal, tax, total, status, created_at, updated_at)
       VALUES ('INV-002', $1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'USD', 200.00, 40.00, 240.00, 'draft', NOW(), NOW())
       RETURNING id`,
			[companyId, orderId]
		);
		const invoiceId = invoiceResult.rows[0].id;

		const response = await app.inject({
			method: "GET",
			url: `/api/sales/invoices/${invoiceId}`
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: { id: string; invoiceNumber: string } }>(response.body);
		expect(payload.data.id).toBe(invoiceId);
		expect(payload.data.invoiceNumber).toBe("INV-002");
	});

	it("should create a new invoice", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/api/sales/invoices",
			payload: {
				invoiceNumber: "INV-003",
				companyId,
				orderId,
				invoiceDate: new Date().toISOString().split("T")[0],
				dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
				currency: "USD",
				status: "draft",
				items: [
					{
						description: "Test Product",
						quantity: 2,
						unitPrice: 50.0,
						discountRate: 0
					}
				]
			}
		});

		expect(response.statusCode).toBe(201);
		const payload = parseBody<{ data: { id: string; invoiceNumber: string; total: number } }>(response.body);
		expect(payload.data.invoiceNumber).toBe("INV-003");
		expect(payload.data.total).toBe(120.0); // 2 * 50 + 20% tax
	});

	it("should update an invoice", async () => {
		const invoiceResult = await client.query(
			`INSERT INTO invoices (invoice_number, company_id, order_id, invoice_date, due_date, currency, subtotal, tax, total, status, created_at, updated_at)
       VALUES ('INV-004', $1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'USD', 100.00, 20.00, 120.00, 'draft', NOW(), NOW())
       RETURNING id`,
			[companyId, orderId]
		);
		const invoiceId = invoiceResult.rows[0].id;

		const response = await app.inject({
			method: "PATCH",
			url: `/api/sales/invoices/${invoiceId}`,
			payload: {
				status: "sent",
				notes: "Updated invoice"
			}
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: { id: string; status: string; notes: string } }>(response.body);
		expect(payload.data.id).toBe(invoiceId);
		expect(payload.data.status).toBe("sent");
		expect(payload.data.notes).toBe("Updated invoice");
	});

	it("should delete an invoice", async () => {
		const invoiceResult = await client.query(
			`INSERT INTO invoices (invoice_number, company_id, order_id, invoice_date, due_date, currency, subtotal, tax, total, status, created_at, updated_at)
       VALUES ('INV-005', $1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'USD', 100.00, 20.00, 120.00, 'draft', NOW(), NOW())
       RETURNING id`,
			[companyId, orderId]
		);
		const invoiceId = invoiceResult.rows[0].id;

		const deleteResponse = await app.inject({
			method: "DELETE",
			url: `/api/sales/invoices/${invoiceId}`
		});

		expect(deleteResponse.statusCode).toBe(204);

		const getResponse = await app.inject({
			method: "GET",
			url: `/api/sales/invoices/${invoiceId}`
		});

		expect(getResponse.statusCode).toBe(404);
	});

	it("should return 404 for non-existent invoice", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/api/sales/invoices/00000000-0000-0000-0000-000000000000"
		});

		expect(response.statusCode).toBe(404);
	});

	it("should filter invoices by status", async () => {
		const invoiceResult = await client.query(
			`INSERT INTO invoices (invoice_number, company_id, order_id, invoice_date, due_date, currency, subtotal, tax, total, status, created_at, updated_at)
       VALUES ('INV-006', $1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'USD', 100.00, 20.00, 120.00, 'draft', NOW(), NOW())
       RETURNING id`,
			[companyId, orderId]
		);

		const response = await app.inject({
			method: "GET",
			url: "/api/sales/invoices?status=draft"
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: unknown[]; total: number }>(response.body);
		expect(payload.total).toBeGreaterThanOrEqual(1);
	});
});

