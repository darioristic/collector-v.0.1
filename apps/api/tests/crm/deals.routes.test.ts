import type { FastifyInstance } from "fastify";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Fastify from "fastify";

import { cachePlugin } from "../../src/lib/cache.service";
import corsPlugin from "../../src/plugins/cors";
import errorHandlerPlugin from "../../src/plugins/error-handler";
import openApiPlugin from "../../src/plugins/openapi";
import salesRoutes from "../../src/modules/sales/sales.routes";
import healthRoutes from "../../src/routes/health";
import { db } from "../../src/db";

const parseBody = <T>(responseBody: string): T => JSON.parse(responseBody) as T;

const buildTestServer = async (): Promise<FastifyInstance> => {
	const app = Fastify({ logger: false });

	app.decorate("db", { getter: () => db });
	app.decorateRequest("db", { getter: () => db });

	await app.register(corsPlugin);
	await app.register(cachePlugin);
	await app.register(errorHandlerPlugin);
	await app.register(openApiPlugin);
	await app.register(healthRoutes, { prefix: "/api" });
	await app.register(salesRoutes, { prefix: "/api/sales" });

	return app;
};

describe("Deals API routes", () => {
	let app: FastifyInstance;

	beforeAll(async () => {
		app = await buildTestServer();
		await app.ready();
	});

	afterEach(async () => {
		// Reset deals store by clearing and re-adding default deals
		// Note: This is a workaround since deals use in-memory store
		// In a real scenario, you'd want to reset the store properly
	});

	beforeEach(async () => {
		// Ensure app is ready
		if (!app) {
			app = await buildTestServer();
			await app.ready();
		}
	});

	it("should list deals", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/api/sales/deals"
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{ data: unknown[] }>(response.body);
		expect(Array.isArray(payload.data)).toBe(true);
		expect(payload.data.length).toBeGreaterThanOrEqual(2); // At least 2 default deals
	});

	it("should create a new deal", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/api/sales/deals",
			payload: {
				accountId: "acc_003",
				title: "New Enterprise Deal",
				stage: "prospecting",
				amount: 75_000,
				closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
			}
		});

		expect(response.statusCode).toBe(201);
		const payload = parseBody<{ data: { id: string; title: string; amount: number } }>(response.body);
		expect(payload.data.title).toBe("New Enterprise Deal");
		expect(payload.data.amount).toBe(75_000);
		expect(payload.data.id).toBeDefined();
	});

	it("should return deals with correct structure", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/api/sales/deals"
		});

		expect(response.statusCode).toBe(200);
		const payload = parseBody<{
			data: Array<{
				id: string;
				accountId: string;
				title: string;
				stage: string;
				amount: number;
				closeDate: string;
			}>;
		}>(response.body);

		if (payload.data.length > 0) {
			const deal = payload.data[0];
			expect(deal).toHaveProperty("id");
			expect(deal).toHaveProperty("accountId");
			expect(deal).toHaveProperty("title");
			expect(deal).toHaveProperty("stage");
			expect(deal).toHaveProperty("amount");
			expect(deal).toHaveProperty("closeDate");
		}
	});
});

