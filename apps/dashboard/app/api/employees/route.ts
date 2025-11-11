import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { employees } from "@/lib/db/schema/employees";
import {
  ListEmployeesQuery,
  SortOrder,
  employeeFormSchema,
  employmentStatusSchema,
  employmentTypeSchema,
  listEmployeesQuerySchema
} from "@/lib/validations/employees";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  lt,
  or,
  type SQL
} from "drizzle-orm";

import { serializeEmployee } from "./shared";

type EmployeeCursor =
  | {
      sortField: "name";
      sortOrder: SortOrder;
      lastName: string;
      firstName: string;
      id: number;
    }
  | {
      sortField: "startDate";
      sortOrder: SortOrder;
      startDate: string;
      id: number;
    }
  | {
      sortField: "status";
      sortOrder: SortOrder;
      status: string;
      id: number;
    };

const encodeCursor = (cursor: EmployeeCursor): string =>
  Buffer.from(JSON.stringify(cursor)).toString("base64");

const decodeCursor = (cursor: string): EmployeeCursor | null => {
  try {
    const payload = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));

    if (!payload || typeof payload !== "object") {
      return null;
    }

    if (payload.sortOrder !== "asc" && payload.sortOrder !== "desc") {
      return null;
    }

    switch (payload.sortField) {
      case "name":
        if (
          typeof payload.lastName === "string" &&
          typeof payload.firstName === "string" &&
          typeof payload.id === "number"
        ) {
          return {
            sortField: "name",
            sortOrder: payload.sortOrder,
            lastName: payload.lastName,
            firstName: payload.firstName,
            id: payload.id
          };
        }
        break;
      case "startDate":
        if (typeof payload.startDate === "string" && typeof payload.id === "number") {
          return {
            sortField: "startDate",
            sortOrder: payload.sortOrder,
            startDate: payload.startDate,
            id: payload.id
          };
        }
        break;
      case "status":
        if (typeof payload.status === "string" && typeof payload.id === "number") {
          return {
            sortField: "status",
            sortOrder: payload.sortOrder,
            status: payload.status,
            id: payload.id
          };
        }
        break;
      default:
        break;
    }

    return null;
  } catch {
    return null;
  }
};

const buildOrderBy = (sortField: ListEmployeesQuery["sortField"], sortOrder: SortOrder) => {
  const isAsc = sortOrder === "asc";

  if (sortField === "name") {
    return [
      isAsc ? asc(employees.lastName) : desc(employees.lastName),
      isAsc ? asc(employees.firstName) : desc(employees.firstName),
      isAsc ? asc(employees.id) : desc(employees.id)
    ];
  }

  if (sortField === "startDate") {
    return [isAsc ? asc(employees.startDate) : desc(employees.startDate), isAsc ? asc(employees.id) : desc(employees.id)];
  }

  return [isAsc ? asc(employees.status) : desc(employees.status), isAsc ? asc(employees.id) : desc(employees.id)];
};

const buildCursorCondition = (cursor: EmployeeCursor): SQL => {
  const isAsc = cursor.sortOrder === "asc";

  if (cursor.sortField === "name") {
    const comparisons = [
      isAsc ? gt(employees.lastName, cursor.lastName) : lt(employees.lastName, cursor.lastName),
      and(
        eq(employees.lastName, cursor.lastName),
        isAsc ? gt(employees.firstName, cursor.firstName) : lt(employees.firstName, cursor.firstName)
      ),
      and(
        eq(employees.lastName, cursor.lastName),
        eq(employees.firstName, cursor.firstName),
        isAsc ? gt(employees.id, cursor.id) : lt(employees.id, cursor.id)
      )
    ];

    return or(...comparisons);
  }

  if (cursor.sortField === "startDate") {
    const cursorDate = new Date(cursor.startDate);
    if (Number.isNaN(cursorDate.getTime())) {
      return eq(employees.id, -1);
    }

    return or(
      isAsc ? gt(employees.startDate, cursorDate) : lt(employees.startDate, cursorDate),
      and(
        eq(employees.startDate, cursorDate),
        isAsc ? gt(employees.id, cursor.id) : lt(employees.id, cursor.id)
      )
    );
  }

  return or(
    isAsc ? gt(employees.status, cursor.status) : lt(employees.status, cursor.status),
    and(eq(employees.status, cursor.status), isAsc ? gt(employees.id, cursor.id) : lt(employees.id, cursor.id))
  );
};

const buildSearchConditions = (query: ListEmployeesQuery) => {
  const clauses = [];

  if (query.search) {
    const pattern = `%${query.search}%`;
    clauses.push(
      or(
        ilike(employees.firstName, pattern),
        ilike(employees.lastName, pattern),
        ilike(employees.email, pattern),
        ilike(employees.department, pattern),
        ilike(employees.role, pattern)
      )
    );
  }

  if (query.department) {
    clauses.push(eq(employees.department, query.department));
  }

  if (query.employmentType) {
    clauses.push(eq(employees.employmentType, employmentTypeSchema.parse(query.employmentType)));
  }

  if (query.status) {
    clauses.push(eq(employees.status, employmentStatusSchema.parse(query.status)));
  }

  return clauses;
};

const withNoStore = (response: NextResponse) => {
  response.headers.set("Cache-Control", "no-store");
  return response;
};

export async function GET(request: NextRequest) {
  const db = await getDb();
  const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsedQuery = listEmployeesQuerySchema.safeParse(rawParams);

  if (!parsedQuery.success) {
    return withNoStore(
      NextResponse.json(
        {
          error: "Invalid query parameters.",
          details: parsedQuery.error.flatten()
        },
        { status: 400 }
      )
    );
  }

  const query = parsedQuery.data;

  let cursorCondition = undefined;
  if (query.cursor) {
    const cursor = decodeCursor(query.cursor);
    if (!cursor || cursor.sortField !== query.sortField || cursor.sortOrder !== query.sortOrder) {
      return withNoStore(
        NextResponse.json(
          {
            error: "Invalid cursor."
          },
          { status: 400 }
        )
      );
    }

    cursorCondition = buildCursorCondition(cursor);
  }

  const filters = buildSearchConditions(query);
  if (cursorCondition) {
    filters.push(cursorCondition);
  }

  let statement = db.select().from(employees);

  if (filters.length > 0) {
    statement = statement.where(filters.length === 1 ? filters[0] : and(...filters));
  }

  const orderBy = buildOrderBy(query.sortField, query.sortOrder);

  statement = statement.orderBy(...orderBy).limit(query.limit + 1);

  const rows = await statement;

  const hasNextPage = rows.length > query.limit;
  const visibleRows = hasNextPage ? rows.slice(0, query.limit) : rows;
  const data = visibleRows.map((employee) => serializeEmployee(employee));

  let nextCursor: string | null = null;
  if (hasNextPage) {
    const last = visibleRows[visibleRows.length - 1];
    if (last) {
      const cursorPayload: EmployeeCursor =
        query.sortField === "name"
          ? {
              sortField: "name",
              sortOrder: query.sortOrder,
              lastName: last.lastName,
              firstName: last.firstName,
              id: last.id
            }
          : query.sortField === "startDate"
            ? {
                sortField: "startDate",
                sortOrder: query.sortOrder,
                startDate: last.startDate.toISOString(),
                id: last.id
              }
            : {
                sortField: "status",
                sortOrder: query.sortOrder,
                status: last.status,
                id: last.id
              };

      nextCursor = encodeCursor(cursorPayload);
    }
  }

  return withNoStore(
    NextResponse.json({
      data,
      pageInfo: {
        hasNextPage,
        nextCursor
      }
    })
  );
}

export async function POST(request: NextRequest) {
  const db = await getDb();
  const json = await request.json().catch(() => null);

  const parsed = employeeFormSchema.safeParse(json);

  if (!parsed.success) {
    return withNoStore(
      NextResponse.json(
        {
          error: "Invalid payload.",
          details: parsed.error.flatten()
        },
        { status: 400 }
      )
    );
  }

  const payload = parsed.data;
  const now = new Date();

  try {
    const [employee] = await db
      .insert(employees)
      .values({
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone ?? null,
        department: payload.department ?? null,
        role: payload.role ?? null,
        employmentType: payload.employmentType,
        status: payload.status,
        startDate: payload.startDate,
        endDate: payload.endDate ?? null,
        salary: payload.salary !== undefined ? payload.salary : null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return withNoStore(NextResponse.json({ data: serializeEmployee(employee) }, { status: 201 }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return withNoStore(
      NextResponse.json(
        {
          error: "Unable to create employee.",
          details: message
        },
        { status: 500 }
      )
    );
  }
}

