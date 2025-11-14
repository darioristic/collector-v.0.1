import { Pool, PoolClient } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { randomUUID } from "node:crypto";

import { ProjectsService } from "../src/modules/projects/projects.service";
import type { CacheOptions, CacheService } from "../src/lib/cache.service";
import { createTestPool } from "./utils/test-db";

class InMemoryCache implements CacheService {
	private store = new Map<string, unknown>();

	public deletedKeys: string[] = [];
	public deletedPatterns: string[] = [];

	async get<T>(key: string): Promise<T | null> {
		if (!this.store.has(key)) {
			return null;
		}
		return this.store.get(key) as T;
	}

	async set(key: string, value: unknown, _options?: CacheOptions): Promise<boolean> {
		this.store.set(key, value);
		return true;
	}

	async delete(...keys: string[]): Promise<boolean> {
		for (const key of keys) {
			this.deletedKeys.push(key);
			this.store.delete(key);
		}
		return true;
	}

	async deletePattern(pattern: string): Promise<boolean> {
		this.deletedPatterns.push(pattern);
		const regex = new RegExp(
			`^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`,
		);

		for (const key of Array.from(this.store.keys())) {
			if (regex.test(key)) {
				this.store.delete(key);
			}
		}
		return true;
	}

	async getOrSet<T>(key: string, fetcher: () => Promise<T>, _options?: CacheOptions): Promise<T> {
		const cached = await this.get<T>(key);
		if (cached !== null) {
			return cached;
		}

		const value = await fetcher();
		await this.set(key, value);
		return value;
	}

	async close(): Promise<void> {
		this.store.clear();
	}

	isEnabled(): boolean {
		return true;
	}
}

describe("ProjectsService (integration)", () => {
	let pool: Pool;
	let client: PoolClient;
	let service: ProjectsService;
	let cache: InMemoryCache;

	let projectId: string;
	let ownerId: string;
	let assigneeId: string;
	let projectSuffix: string;

	beforeAll(async () => {
		pool = await createTestPool();
	});

	afterAll(async () => {
		await pool.end();
	});

	beforeEach(async () => {
		client = await pool.connect();
		await client.query("BEGIN");

		const database = drizzleNodePostgres(client);
		cache = new InMemoryCache();
		service = new ProjectsService(database, cache);

		projectId = randomUUID();
		ownerId = randomUUID();
		assigneeId = randomUUID();
		projectSuffix = projectId.slice(0, 8);

		await client.query(
			`INSERT INTO users (id, email, name, status)
       VALUES ($1, $2, $3, 'active')`,
			[ownerId, `owner+${projectSuffix}@example.com`, `Owner ${projectSuffix}`],
		);

		await client.query(
			`INSERT INTO users (id, email, name, status)
       VALUES ($1, $2, $3, 'active')`,
			[assigneeId, `dev+${projectSuffix}@example.com`, `Dev ${projectSuffix}`],
		);

		await client.query(
			`INSERT INTO projects
				(id, owner_id, name, description, customer, status, budget_total, budget_spent, budget_currency, due_date)
			 VALUES
			 	($1, $2, $3, $4, $5, 'active', $6, $7, 'EUR', NOW() + INTERVAL '14 days')`,
			[
				projectId,
				ownerId,
				`Collector Dashboard ${projectSuffix}`,
				"Core platform",
				"Collector Inc",
				"10000",
				"2500",
			],
		);

		await client.query(
			`INSERT INTO project_tasks
				(id, project_id, title, description, status, assignee_id, due_date)
			 VALUES
			 	($1, $3, 'Design architecture', 'Initial architecture draft', 'done', $2, NOW() + INTERVAL '3 days'),
			 	($4, $3, 'Implement caching', 'Add Redis layer', 'todo', $2, NOW() + INTERVAL '10 days')`,
			[randomUUID(), assigneeId, projectId, randomUUID()],
		);

		await client.query(
			`INSERT INTO project_milestones
				(id, project_id, title, description, status, due_date)
			 VALUES
			 	($1, $2, 'Phase 1', 'Initial delivery', 'todo', NOW() + INTERVAL '7 days')`,
			[randomUUID(), projectId],
		);

		await client.query(
			`INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, 'developer')`,
			[projectId, assigneeId],
		);

		await client.query(
			`INSERT INTO project_budget_categories
				(id, project_id, category, allocated_amount, spent_amount)
			 VALUES
			 	($1, $2, 'Engineering', 6000, 1500)`,
			[randomUUID(), projectId],
		);
	});

	afterEach(async () => {
		await client.query("ROLLBACK");
		client.release();
	});

	it("returns project summaries with aggregated task stats and caches the result", async () => {
		const summaries = await service.list();

		const summary = summaries.find((item) => item.id === projectId);
	expect(summary).toBeDefined();
	expect(summary?.totalTasks).toBe(2);
	expect(summary?.completedTasks).toBe(1);
	expect(summary?.progress).toBe(50);
	expect(summary?.owner?.id).toBe(ownerId);

	const cachedSummaries = await service.list();
	expect(cachedSummaries).toEqual(summaries);
	});

	it("returns detailed project information and stores it in cache", async () => {
		const details = await service.getProjectDetails(projectId);

		expect(details).not.toBeNull();
		expect(details?.tasks).toHaveLength(2);
		expect(details?.timeline).toHaveLength(1);
		expect(details?.team).toHaveLength(1);
		expect(details?.budget?.categories).toHaveLength(1);

		const cached = await service.getProjectDetails(projectId);
		expect(cached).toEqual(details);
	});

	it("invalidates caches when mutating project data", async () => {
		await service.getProjectDetails(projectId);

		const createdTask = await service.createTask(projectId, {
			title: "Finalize API",
			description: "Complete endpoints",
			status: "todo",
		});

		expect(createdTask.projectId).toBe(projectId);
		expect(cache.deletedKeys).toContain(`projects:detail:${projectId}`);
		expect(cache.deletedPatterns).toContain("projects:list:*");

		const updatedDetails = await service.getProjectDetails(projectId);
		expect(updatedDetails?.tasks).toHaveLength(3);
		expect(updatedDetails?.quickStats.totalTasks).toBe(3);
	});
});


