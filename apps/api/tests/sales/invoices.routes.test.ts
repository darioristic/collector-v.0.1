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

describe("Invoices API routes", () => {
	let pool: Pool | null = null;
	let client: PoolClient;
	let app: FastifyInstance;
	let companyId: string;
	let contactId: string;
	let orderId: number;

	beforeAll(async () => {
		pool = await createTestPool();
	});

	afterAll(async () => {
		if (pool) {
			await pool.end();
		}
	});

	beforeEach(async () => {
		if (!pool) {
			throw new Error("Pool not initialized");
		}
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
		await client.query(
			`INSERT INTO invoices (invoice_number, customer_id, customer_name, order_id, issued_at, due_date, currency, amount_before_discount, discount_total, subtotal, total_vat, total, amount_paid, balance, status, created_at, updated_at)
       VALUES ('INV-001', $1, 'Test Company', $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'USD', 100.00, 0.00, 100.00, 20.00, 120.00, 0.00, 120.00, 'draft', NOW(), NOW())
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
			`INSERT INTO invoices (invoice_number, customer_id, customer_name, order_id, issued_at, due_date, currency, amount_before_discount, discount_total, subtotal, total_vat, total, amount_paid, balance, status, created_at, updated_at)
       VALUES ('INV-002', $1, 'Test Company', $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'USD', 200.00, 0.00, 200.00, 40.00, 240.00, 0.00, 240.00, 'draft', NOW(), NOW())
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

	it("should create a new invoice with items", async () => {
		const issuedAt = new Date().toISOString();
		const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

		const response = await app.inject({
			method: "POST",
			url: "/api/sales/invoices",
			payload: {
				invoiceNumber: "INV-003",
				customerId: companyId,
				customerName: "Test Company",
				customerEmail: "test@example.com",
				orderId,
				issuedAt,
				dueDate,
				currency: "USD",
				status: "draft",
				items: [
					{
						description: "Test Product",
						quantity: 2,
						unit: "pcs",
						unitPrice: 50.0,
						discountRate: 0,
						vatRate: 20
					}
				]
			}
		});

		expect(response.statusCode).toBe(201);
		const payload = parseBody<{ data: { id: string; invoiceNumber: string; total: number; items?: unknown[] } }>(response.body);
		expect(payload.data.invoiceNumber).toBe("INV-003");
		expect(payload.data.total).toBe(120.0); // 2 * 50 + 20% tax = 100 + 20 = 120
		expect(payload.data.items).toBeDefined();
		expect(Array.isArray(payload.data.items)).toBe(true);
		expect(payload.data.items?.length).toBe(1);
	});

	it("should create invoice with multiple items and calculate totals correctly", async () => {
		const issuedAt = new Date().toISOString();
		const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

		const response = await app.inject({
			method: "POST",
			url: "/api/sales/invoices",
			payload: {
				invoiceNumber: "INV-MULTI-001",
				customerId: companyId,
				customerName: "Test Company",
				issuedAt,
				dueDate,
				currency: "EUR",
				status: "draft",
				items: [
					{
						description: "Product A",
						quantity: 3,
						unit: "pcs",
						unitPrice: 100.0,
						discountRate: 10,
						vatRate: 20
					},
					{
						description: "Product B",
						quantity: 2,
						unit: "pcs",
						unitPrice: 50.0,
						discountRate: 5,
						vatRate: 10
					}
				]
			}
		});

		expect(response.statusCode).toBe(201);
		const payload = parseBody<{ data: { invoiceNumber: string; total: number; subtotal: number; totalVat: number; items?: Array<{ description: string; quantity: string; unitPrice: string; discountRate: string; vatRate: string; totalInclVat: string }> } }>(response.body);
		expect(payload.data.invoiceNumber).toBe("INV-MULTI-001");
		expect(payload.data.items).toBeDefined();
		expect(payload.data.items?.length).toBe(2);

		// Item 1: 3 * 100 = 300, discount 10% = 30, after discount = 270, VAT 20% = 54, total = 324
		// Item 2: 2 * 50 = 100, discount 5% = 5, after discount = 95, VAT 10% = 9.5, total = 104.5
		// Total: 324 + 104.5 = 428.5
		expect(payload.data.total).toBeCloseTo(428.5, 1);
		expect(payload.data.subtotal).toBeCloseTo(365, 1); // 270 + 95
		expect(payload.data.totalVat).toBeCloseTo(63.5, 1); // 54 + 9.5

		// Check first item
		const item1 = payload.data.items?.[0];
		expect(item1?.description).toBe("Product A");
		expect(item1?.quantity).toBe("3.00");
		expect(item1?.unitPrice).toBe("100.00");
		expect(item1?.discountRate).toBe("10.00");
		expect(item1?.vatRate).toBe("20.00");
	});

	it("should create invoice with decimal quantities and prices", async () => {
		const issuedAt = new Date().toISOString();
		const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

		const response = await app.inject({
			method: "POST",
			url: "/api/sales/invoices",
			payload: {
				invoiceNumber: "INV-DEC-001",
				customerId: companyId,
				customerName: "Test Company",
				issuedAt,
				dueDate,
				currency: "EUR",
				status: "draft",
				items: [
					{
						description: "Service Hours",
						quantity: 37.5,
						unit: "hours",
						unitPrice: 85.50,
						discountRate: 0,
						vatRate: 20
					}
				]
			}
		});

		expect(response.statusCode).toBe(201);
		const payload = parseBody<{ data: { invoiceNumber: string; total: number } }>(response.body);
		expect(payload.data.invoiceNumber).toBe("INV-DEC-001");
		// 37.5 * 85.50 = 3206.25, VAT 20% = 641.25, total = 3847.50
		expect(payload.data.total).toBeCloseTo(3847.50, 2);
	});

	it("should update an invoice", async () => {
		const invoiceResult = await client.query(
			`INSERT INTO invoices (invoice_number, customer_id, customer_name, order_id, issued_at, due_date, currency, amount_before_discount, discount_total, subtotal, total_vat, total, amount_paid, balance, status, created_at, updated_at)
       VALUES ('INV-004', $1, 'Test Company', $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'USD', 100.00, 0.00, 100.00, 20.00, 120.00, 0.00, 120.00, 'draft', NOW(), NOW())
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
			`INSERT INTO invoices (invoice_number, customer_id, customer_name, order_id, issued_at, due_date, currency, amount_before_discount, discount_total, subtotal, total_vat, total, amount_paid, balance, status, created_at, updated_at)
       VALUES ('INV-005', $1, 'Test Company', $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'USD', 100.00, 0.00, 100.00, 20.00, 120.00, 0.00, 120.00, 'draft', NOW(), NOW())
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
		await client.query(
			`INSERT INTO invoices (invoice_number, customer_id, customer_name, order_id, issued_at, due_date, currency, amount_before_discount, discount_total, subtotal, total_vat, total, amount_paid, balance, status, created_at, updated_at)
       VALUES ('INV-006', $1, 'Test Company', $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'USD', 100.00, 0.00, 100.00, 20.00, 120.00, 0.00, 120.00, 'draft', NOW(), NOW())`,
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

