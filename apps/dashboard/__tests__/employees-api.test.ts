import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET as listEmployeesRoute, POST as createEmployeeRoute } from "@/app/api/employees/route";
import {
  DELETE as deleteEmployeeRoute,
  GET as getEmployeeRoute,
  PUT as updateEmployeeRoute
} from "@/app/api/employees/[id]/route";

type MockRequest = {
  nextUrl: URL;
  json: () => Promise<unknown>;
};

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
  nextId: 1
};

const operationContext = {
  targetId: null as number | null
};

const extractIdFromCondition = (condition: unknown): number | null => {
  if (
    condition &&
    typeof condition === "object" &&
    "queryChunks" in (condition as Record<string, unknown>) &&
    Array.isArray((condition as Record<string, unknown>).queryChunks)
  ) {
    const chunks = (condition as { queryChunks: Array<Record<string, unknown>> }).queryChunks;
    for (const chunk of chunks) {
      if (chunk && typeof chunk === "object" && "value" in chunk) {
        const value = (chunk as { value: unknown }).value;
        return typeof value === "number" ? value : typeof value === "string" ? Number(value) : null;
      }
    }
  }
  return null;
};

const buildAsyncResult = (data: StoredEmployee[]) => ({
  from() {
    return this;
  },
  where() {
    return this;
  },
  orderBy() {
    return this;
  },
  limit() {
    return this;
  },
  then(resolve: (value: StoredEmployee[]) => void, reject?: (reason?: unknown) => void) {
    return Promise.resolve(data).then(resolve, reject);
  }
});

vi.mock("@/lib/db", () => {
  return {
    db: {
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
              startDate: payload.startDate ? new Date(String(payload.startDate)) : null,
              endDate: payload.endDate ? new Date(String(payload.endDate)) : null,
              salary: payload.salary !== undefined && payload.salary !== null ? Number(payload.salary) : null,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            store.employees.push(record);
            return [record];
          }
        })
      }),
      select: () => buildAsyncResult([...store.employees]),
      update: () => ({
        set: (payload: Record<string, unknown>) => ({
          where: (condition: unknown) => ({
            returning: () => {
              const id = operationContext.targetId ?? extractIdFromCondition(condition);
              const record = store.employees.find((item) => item.id === id);
              if (!record) {
                return [];
              }
              Object.assign(record, payload);
              record.updatedAt = new Date();
              return [record];
            }
          })
        })
      }),
      delete: () => ({
        where: (condition: unknown) => ({
          returning: () => {
            const id = operationContext.targetId ?? extractIdFromCondition(condition);
            const index = store.employees.findIndex((item) => item.id === id);
            if (index === -1) {
              return [];
            }
            const [removed] = store.employees.splice(index, 1);
            return [removed];
          }
        })
      })
    }
  };
});

const buildRequest = (url: string, body?: unknown): MockRequest => ({
  nextUrl: new URL(url),
  json: async () => body ?? {}
});

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
    salary: 82000
  };

  it("creates, lists, updates, and deletes an employee", async () => {
    const createResponse = await createEmployeeRoute(buildRequest("http://localhost/api/employees", basePayload) as any);
    expect(createResponse.status).toBe(201);

    const { data: created } = (await createResponse.json()) as { data: { id: number; fullName: string } };
    expect(created.fullName).toBe("Ana Jovanovic");
    expect(created.id).toBe(1);

    const listResponse = await listEmployeesRoute(buildRequest("http://localhost/api/employees") as any);
    const listPayload = (await listResponse.json()) as { data: Array<{ id: number }> };
    expect(listPayload.data).toHaveLength(1);

    const updatePayload = { status: "On Leave", salary: 83000 };
    operationContext.targetId = created.id;
    const updateResponse = await updateEmployeeRoute(buildRequest("http://localhost/api/employees", updatePayload) as any, {
      params: { id: String(created.id) }
    });
    operationContext.targetId = null;
    expect(updateResponse.status).toBe(200);

    const updatedBody = (await updateResponse.json()) as { data: { status: string; salary: number | null } };
    expect(updatedBody.data.status).toBe("On Leave");
    expect(updatedBody.data.salary).toBe(83000);

    const getResponse = await getEmployeeRoute(buildRequest("http://localhost/api/employees") as any, {
      params: { id: String(created.id) }
    });
    const getPayload = (await getResponse.json()) as { data: { id: number; status: string } };
    expect(getPayload.data.status).toBe("On Leave");

    operationContext.targetId = created.id;
    const deleteResponse = await deleteEmployeeRoute(buildRequest("http://localhost/api/employees") as any, {
      params: { id: String(created.id) }
    });
    operationContext.targetId = null;
    expect(deleteResponse.status).toBe(204);

    const emptyList = await listEmployeesRoute(buildRequest("http://localhost/api/employees") as any);
    const emptyPayload = (await emptyList.json()) as { data: unknown[] };
    expect(emptyPayload.data).toHaveLength(0);
  });

  it("rejects invalid payload", async () => {
    const invalidPayload = {
      firstName: "",
      lastName: "",
      email: "invalid",
      startDate: "not-a-date"
    };

    const response = await createEmployeeRoute(buildRequest("http://localhost/api/employees", invalidPayload) as any);
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Invalid payload.");
  });
});
