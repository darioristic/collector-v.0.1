import type { FastifyInstance } from "fastify";
import { Pool, PoolClient } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import Fastify from "fastify";

import { cachePlugin } from "../../src/lib/cache.service";
import corsPlugin from "../../src/plugins/cors";
import errorHandlerPlugin from "../../src/plugins/error-handler";
import openApiPlugin from "../../src/plugins/openapi";
import crmRoutes from "../../src/modules/crm/crm.routes";
import { createCRMService } from "../../src/modules/crm/crm.service";
import healthRoutes from "../../src/routes/health";
import type { AppDatabase } from "../../src/db";

const parseBody = <T>(responseBody: string): T => JSON.parse(responseBody) as T;

const buildTestServer = async (database: AppDatabase): Promise<FastifyInstance> => {
	const app = Fastify({ logger: false });

	app.decorate("db", { getter: () => database });
	app.decorateRequest("db", { getter: () => database });

	const crmService = createCRMService(database);
	app.decorate("crmService", crmService);
	app.decorateRequest("crmService", { getter: () => crmService });

	await app.register(corsPlugin);
	await app.register(cachePlugin);
	await app.register(errorHandlerPlugin);
	await app.register(openApiPlugin);
	await app.register(healthRoutes, { prefix: "/api" });
	await app.register(crmRoutes, { prefix: "/api/crm" });

	return app;
};

describe("Leads API routes", () => {
	const connectionString =
		process.env.TEST_DATABASE_URL ?? "postgresql://collector:collector@localhost:5432/collector";

	let pool: Pool;
	let client: PoolClient;
	let app: FastifyInstance;

	beforeAll(async () => {
		pool = new Pool({ connectionString });
	});

	afterAll(async () => {
		await pool.end();
	});

	beforeEach(async () => {
		client = await pool.connect();
		await client.query("BEGIN");

		const database = drizzleNodePostgres(client);
		app = await buildTestServer(database);
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
		await client.query("ROLLBACK");
		client.release();
	});

	it("should list leads", async () => {
		// Create a test lead
		await client.query(
			`INSERT INTO leads (id, name, email, phone, company, status, source, created_at, updated_at)
       VALUES (gen_random_uuid(), 'Test Lead', 'test@example.com', '+1234567890', 'Test Company', 'new', 'website', NOW(), NOW())`
		);

		const response = await app.inject({
			method: "GET",
			url: "/api/crm/leads"
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: unknown[] }>(response.body);
		expect(Array.isArray(payload.data)).toBe(true);
		expect(payload.data.length).toBeGreaterThanOrEqual(1);
	});

	it("should get lead by id", async () => {
		const leadResult = await client.query(
			`INSERT INTO leads (id, name, email, phone, company, status, source, created_at, updated_at)
       VALUES (gen_random_uuid(), 'Test Lead 2', 'test2@example.com', '+1234567891', 'Test Company 2', 'new', 'website', NOW(), NOW())
       RETURNING id`
		);
		const leadId = leadResult.rows[0].id;

		const response = await app.inject({
			method: "GET",
			url: `/api/crm/leads/${leadId}`
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: { id: string; name: string } }>(response.body);
		expect(payload.data.id).toBe(leadId);
		expect(payload.data.name).toBe("Test Lead 2");
	});

	it("should create a new lead", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/api/crm/leads",
			payload: {
				name: "New Lead",
				email: "newlead@example.com",
				phone: "+1234567892",
				company: "New Company",
				status: "new",
				source: "website"
			}
		});

		expect(response.statusCode).toBe(201);
		const payload = parseBody<{ data: { id: string; name: string; email: string } }>(response.body);
		expect(payload.data.name).toBe("New Lead");
		expect(payload.data.email).toBe("newlead@example.com");
	});

	it("should update a lead", async () => {
		const leadResult = await client.query(
			`INSERT INTO leads (id, name, email, phone, company, status, source, created_at, updated_at)
       VALUES (gen_random_uuid(), 'Test Lead 3', 'test3@example.com', '+1234567893', 'Test Company 3', 'new', 'website', NOW(), NOW())
       RETURNING id`
		);
		const leadId = leadResult.rows[0].id;

		const response = await app.inject({
			method: "PATCH",
			url: `/api/crm/leads/${leadId}`,
			payload: {
				status: "contacted",
				notes: "Updated lead"
			}
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: { id: string; status: string; notes: string } }>(response.body);
		expect(payload.data.id).toBe(leadId);
		expect(payload.data.status).toBe("contacted");
		expect(payload.data.notes).toBe("Updated lead");
	});

	it("should delete a lead", async () => {
		const leadResult = await client.query(
			`INSERT INTO leads (id, name, email, phone, company, status, source, created_at, updated_at)
       VALUES (gen_random_uuid(), 'Test Lead 4', 'test4@example.com', '+1234567894', 'Test Company 4', 'new', 'website', NOW(), NOW())
       RETURNING id`
		);
		const leadId = leadResult.rows[0].id;

		const deleteResponse = await app.inject({
			method: "DELETE",
			url: `/api/crm/leads/${leadId}`
		});

		expect(deleteResponse.statusCode).toBe(204);

		const getResponse = await app.inject({
			method: "GET",
			url: `/api/crm/leads/${leadId}`
		});

		expect(getResponse.statusCode).toBe(404);
	});

	it("should return 404 for non-existent lead", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/api/crm/leads/00000000-0000-0000-0000-000000000000"
		});

		expect(response.statusCode).toBe(404);
	});

	it("should filter leads by status", async () => {
		await client.query(
			`INSERT INTO leads (id, name, email, phone, company, status, source, created_at, updated_at)
       VALUES (gen_random_uuid(), 'Test Lead 5', 'test5@example.com', '+1234567895', 'Test Company 5', 'new', 'website', NOW(), NOW())`
		);

		const response = await app.inject({
			method: "GET",
			url: "/api/crm/leads?status=new"
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: unknown[] }>(response.body);
		expect(payload.data.length).toBeGreaterThanOrEqual(1);
	});
});

