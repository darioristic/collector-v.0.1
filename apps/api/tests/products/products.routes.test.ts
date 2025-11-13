import type { FastifyInstance } from "fastify";
import { Pool, PoolClient } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import Fastify from "fastify";

import { cachePlugin } from "../../src/lib/cache.service";
import corsPlugin from "../../src/plugins/cors";
import errorHandlerPlugin from "../../src/plugins/error-handler";
import openApiPlugin from "../../src/plugins/openapi";
import productsRoutes from "../../src/modules/products/products.routes";
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
	await app.register(productsRoutes, { prefix: "/api/products" });

	return app;
};

describe("Products API routes", () => {
	const connectionString =
		process.env.TEST_DATABASE_URL ?? "postgresql://collector:collector@localhost:5432/collector";

	let pool: Pool;
	let client: PoolClient;
	let app: FastifyInstance;
	let categoryId: string;
	let locationId: string;

	beforeAll(async () => {
		pool = new Pool({ connectionString });
	});

	afterAll(async () => {
		await pool.end();
	});

	beforeEach(async () => {
		client = await pool.connect();
		await client.query("BEGIN");

		// Create test category
		const categoryResult = await client.query(
			`INSERT INTO product_categories (id, name, description, created_at, updated_at)
       VALUES (gen_random_uuid(), 'Test Category', 'Test Description', NOW(), NOW())
       RETURNING id`
		);
		categoryId = categoryResult.rows[0].id;

		// Create test location
		const locationResult = await client.query(
			`INSERT INTO inventory_locations (id, name, address, created_at, updated_at)
       VALUES (gen_random_uuid(), 'Test Location', 'Test Address', NOW(), NOW())
       RETURNING id`
		);
		locationId = locationResult.rows[0].id;

		const database = drizzleNodePostgres(client);
		app = await buildTestServer(database);
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
		await client.query("ROLLBACK");
		client.release();
	});

	it("should list products", async () => {
		// Create a test product
		await client.query(
			`INSERT INTO products (id, name, sku, price, currency, category_id, status, created_at, updated_at)
       VALUES (gen_random_uuid(), 'Test Product', 'SKU-001', 99.99, 'USD', $1, 'active', NOW(), NOW())`,
			[categoryId]
		);

		const response = await app.inject({
			method: "GET",
			url: "/api/products"
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: unknown[]; total: number }>(response.body);
		expect(Array.isArray(payload.data)).toBe(true);
		expect(payload.total).toBeGreaterThanOrEqual(1);
	});

	it("should get product by id", async () => {
		const productResult = await client.query(
			`INSERT INTO products (id, name, sku, price, currency, category_id, status, created_at, updated_at)
       VALUES (gen_random_uuid(), 'Test Product 2', 'SKU-002', 149.99, 'USD', $1, 'active', NOW(), NOW())
       RETURNING id`,
			[categoryId]
		);
		const productId = productResult.rows[0].id;

		const response = await app.inject({
			method: "GET",
			url: `/api/products/${productId}`
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: { id: string; name: string; sku: string } }>(response.body);
		expect(payload.data.id).toBe(productId);
		expect(payload.data.name).toBe("Test Product 2");
		expect(payload.data.sku).toBe("SKU-002");
	});

	it("should create a new product", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/api/products",
			payload: {
				name: "New Product",
				sku: "SKU-003",
				price: 199.99,
				currency: "USD",
				categoryId,
				status: "active"
			}
		});

		expect(response.statusCode).toBe(201);
		const payload = parseBody<{ data: { id: string; name: string; sku: string; price: number } }>(
			response.body
		);
		expect(payload.data.name).toBe("New Product");
		expect(payload.data.sku).toBe("SKU-003");
		expect(payload.data.price).toBe(199.99);
	});

	it("should update a product", async () => {
		const productResult = await client.query(
			`INSERT INTO products (id, name, sku, price, currency, category_id, status, created_at, updated_at)
       VALUES (gen_random_uuid(), 'Test Product 3', 'SKU-004', 79.99, 'USD', $1, 'active', NOW(), NOW())
       RETURNING id`,
			[categoryId]
		);
		const productId = productResult.rows[0].id;

		const response = await app.inject({
			method: "PUT",
			url: `/api/products/${productId}`,
			payload: {
				name: "Updated Product",
				price: 89.99,
				status: "inactive"
			}
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: { id: string; name: string; price: number; status: string } }>(
			response.body
		);
		expect(payload.data.id).toBe(productId);
		expect(payload.data.name).toBe("Updated Product");
		expect(payload.data.price).toBe(89.99);
		expect(payload.data.status).toBe("inactive");
	});

	it("should delete a product", async () => {
		const productResult = await client.query(
			`INSERT INTO products (id, name, sku, price, currency, category_id, status, created_at, updated_at)
       VALUES (gen_random_uuid(), 'Test Product 4', 'SKU-005', 59.99, 'USD', $1, 'active', NOW(), NOW())
       RETURNING id`,
			[categoryId]
		);
		const productId = productResult.rows[0].id;

		const deleteResponse = await app.inject({
			method: "DELETE",
			url: `/api/products/${productId}`
		});

		expect(deleteResponse.statusCode).toBe(200);

		const getResponse = await app.inject({
			method: "GET",
			url: `/api/products/${productId}`
		});

		expect(getResponse.statusCode).toBe(404);
	});

	it("should return 404 for non-existent product", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/api/products/00000000-0000-0000-0000-000000000000"
		});

		expect(response.statusCode).toBe(404);
	});

	it("should filter products by status", async () => {
		await client.query(
			`INSERT INTO products (id, name, sku, price, currency, category_id, status, created_at, updated_at)
       VALUES (gen_random_uuid(), 'Test Product 5', 'SKU-006', 39.99, 'USD', $1, 'active', NOW(), NOW())`,
			[categoryId]
		);

		const response = await app.inject({
			method: "GET",
			url: "/api/products?status=active"
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: unknown[]; total: number }>(response.body);
		expect(payload.total).toBeGreaterThanOrEqual(1);
	});

	it("should list inventory", async () => {
		// Create a product first
		const productResult = await client.query(
			`INSERT INTO products (id, name, sku, price, currency, category_id, status, created_at, updated_at)
       VALUES (gen_random_uuid(), 'Test Product 6', 'SKU-007', 49.99, 'USD', $1, 'active', NOW(), NOW())
       RETURNING id`,
			[categoryId]
		);
		const productId = productResult.rows[0].id;

		// Create inventory entry
		await client.query(
			`INSERT INTO inventory (id, product_id, location_id, quantity, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, 100, NOW(), NOW())`,
			[productId, locationId]
		);

		const response = await app.inject({
			method: "GET",
			url: "/api/products/inventory"
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: unknown[]; total: number }>(response.body);
		expect(Array.isArray(payload.data)).toBe(true);
		expect(payload.total).toBeGreaterThanOrEqual(1);
	});
});

