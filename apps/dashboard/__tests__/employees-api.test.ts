import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	DELETE as deleteEmployeeRoute,
	GET as getEmployeeRoute,
	PUT as updateEmployeeRoute,
} from "@/app/api/employees/[id]/route";
import {
	GET as listEmployeesRoute,
	POST as createEmployeeRoute,
} from "@/app/api/employees/route";

type StoredEmployee = {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	phone: string | null;
	department: string | null;
	role: string | null;
	employmentType: string;
	status: string;
	startDate: Date | null;
	endDate: Date | null;
	salary: number | null;
	createdAt: Date;
	updatedAt: Date;
};

const store: { employees: StoredEmployee[]; nextId: number } = {
	employees: [],
	nextId: 1,
};

const operationContext = {
	targetId: null as number | null,
};

const extractIdFromCondition = (condition: unknown): number | null => {
	if (
		condition &&
		typeof condition === "object" &&
		"queryChunks" in (condition as Record<string, unknown>) &&
		Array.isArray((condition as Record<string, unknown>).queryChunks)
	) {
		const chunks = (
			condition as { queryChunks: Array<Record<string, unknown>> }
		).queryChunks;
		for (const chunk of chunks) {
			if (chunk && typeof chunk === "object" && "value" in chunk) {
				const value = (chunk as { value: unknown }).value;
				return typeof value === "number"
					? value
					: typeof value === "string"
						? Number(value)
						: null;
			}
		}
	}
	return null;
};

class QueryBuilderMock implements PromiseLike<StoredEmployee[]> {
	private readonly data: StoredEmployee[];

	constructor(data: StoredEmployee[]) {
		this.data = data;
	}

	from() {
		return this;
	}

	where() {
		return this;
	}

	orderBy() {
		return this;
	}

	limit() {
		return this;
	}

	then<TResult1 = StoredEmployee[], TResult2 = never>(
		onFulfilled?: ((value: StoredEmployee[]) => TResult1 | PromiseLike<TResult1>) | null,
		onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
	): Promise<TResult1 | TResult2> {
		return Promise.resolve(this.data).then(onFulfilled, onRejected);
	}
}

const buildAsyncResult = (data: StoredEmployee[]) => new QueryBuilderMock(data);

const createDb = () => ({
	insert: () => ({
		values: (payload: Record<string, unknown>) => ({
			returning: () => {
				const record: StoredEmployee = {
					id: store.nextId++,
					firstName: String(payload.firstName),
					lastName: String(payload.lastName),
					email: String(payload.email),
					phone: payload.phone ? String(payload.phone) : null,
					department: payload.department ? String(payload.department) : null,
					role: payload.role ? String(payload.role) : null,
					employmentType: String(payload.employmentType),
					status: String(payload.status),
					startDate: payload.startDate
						? new Date(String(payload.startDate))
						: null,
					endDate: payload.endDate ? new Date(String(payload.endDate)) : null,
					salary:
						payload.salary !== undefined && payload.salary !== null
							? Number(payload.salary)
							: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				};
				store.employees.push(record);
				return [record];
			},
		}),
	}),
	select: () => buildAsyncResult([...store.employees]),
	update: () => ({
		set: (payload: Record<string, unknown>) => ({
			where: (condition: unknown) => ({
				returning: () => {
					const id =
						operationContext.targetId ?? extractIdFromCondition(condition);
					const record = store.employees.find((item) => item.id === id);
					if (!record) {
						return [];
					}
					Object.assign(record, payload);
					record.updatedAt = new Date();
					return [record];
				},
			}),
		}),
	}),
	delete: () => ({
		where: (condition: unknown) => ({
			returning: () => {
				const id =
					operationContext.targetId ?? extractIdFromCondition(condition);
				const index = store.employees.findIndex((item) => item.id === id);
				if (index === -1) {
					return [];
				}
				const [removed] = store.employees.splice(index, 1);
				return [removed];
			},
		}),
	}),
});

vi.mock("@/lib/db", () => {
	return {
		getDb: vi.fn(async () => createDb()),
	};
});

type RouteRequest = Parameters<typeof createEmployeeRoute>[0];

const buildRequest = (url: string, body?: unknown): RouteRequest =>
	({
		nextUrl: new URL(url),
		json: async () => body ?? {},
	}) as unknown as RouteRequest;

describe("Employees API routes (mocked data layer)", () => {
	beforeEach(() => {
		store.employees = [];
		store.nextId = 1;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	const basePayload = {
		firstName: "Ana",
		lastName: "Jovanovic",
		email: "ana@example.com",
		phone: "+381601234567",
		department: "Engineering",
		role: "Frontend Developer",
		employmentType: "Full-time",
		status: "Active",
		startDate: "2024-01-15",
		endDate: null,
		salary: 82000,
	};

	it("creates, lists, updates, and deletes an employee", async () => {
		const createResponse = await createEmployeeRoute(
			buildRequest("http://localhost/api/employees", basePayload),
		);
		expect(createResponse.status).toBe(201);

		const { data: created } = (await createResponse.json()) as {
			data: { id: number; fullName: string };
		};
		expect(created.fullName).toBe("Ana Jovanovic");
		expect(created.id).toBe(1);

		const listResponse = await listEmployeesRoute(
			buildRequest("http://localhost/api/employees"),
		);
		const listPayload = (await listResponse.json()) as {
			data: Array<{ id: number }>;
		};
		expect(listPayload.data).toHaveLength(1);

		const updatePayload = { status: "On Leave", salary: 83000 };
		operationContext.targetId = created.id;
		const updateResponse = await updateEmployeeRoute(
			buildRequest("http://localhost/api/employees", updatePayload),
			{
				params: { id: String(created.id) },
			},
		);
		operationContext.targetId = null;
		expect(updateResponse.status).toBe(200);

		const updatedBody = (await updateResponse.json()) as {
			data: { status: string; salary: number | null };
		};
		expect(updatedBody.data.status).toBe("On Leave");
		expect(updatedBody.data.salary).toBe(83000);

		const getResponse = await getEmployeeRoute(
			buildRequest("http://localhost/api/employees"),
			{
				params: { id: String(created.id) },
			},
		);
		const getPayload = (await getResponse.json()) as {
			data: { id: number; status: string };
		};
		expect(getPayload.data.status).toBe("On Leave");

		operationContext.targetId = created.id;
		const deleteResponse = await deleteEmployeeRoute(
			buildRequest("http://localhost/api/employees"),
			{
				params: { id: String(created.id) },
			},
		);
		operationContext.targetId = null;
		expect(deleteResponse.status).toBe(204);

		const emptyList = await listEmployeesRoute(
			buildRequest("http://localhost/api/employees"),
		);
		const emptyPayload = (await emptyList.json()) as { data: unknown[] };
		expect(emptyPayload.data).toHaveLength(0);
	});

	it("rejects invalid payload", async () => {
		const invalidPayload = {
			firstName: "",
			lastName: "",
			email: "invalid",
			startDate: "not-a-date",
		};

		const response = await createEmployeeRoute(
			buildRequest("http://localhost/api/employees", invalidPayload),
		);
		expect(response.status).toBe(400);
		const body = (await response.json()) as { error: string };
		expect(body.error).toBe("Invalid payload.");
	});
});
