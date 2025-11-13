import { and, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "../../db";
import { employees, timeOffRequests, users } from "../../db/schema";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
  approvedBy: string | null;
  approverName?: string | null;
  createdAt: string;
}

export interface LeaveRequestCreateInput {
  employeeId: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  status?: string;
}

export interface LeaveRequestUpdateInput {
  startDate?: string;
  endDate?: string;
  reason?: string | null;
  status?: string;
  approvedBy?: string | null;
}

export interface LeaveRequestListFilters {
  employeeId?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface LeaveRequestListResult {
  data: LeaveRequest[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

const toIsoString = (value: Date | string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  return value instanceof Date ? value.toISOString() : value;
};

type LeaveRequestRow = {
  request: typeof timeOffRequests.$inferSelect;
  employee: typeof employees.$inferSelect | null;
  approver: typeof users.$inferSelect | null;
};

const mapLeaveRequestRow = (row: LeaveRequestRow): LeaveRequest => ({
  id: row.request.id,
  employeeId: row.request.employeeId,
  employeeName: row.employee ? `${row.employee.employeeNumber}` : undefined,
  startDate: toIsoString(row.request.startDate) ?? new Date().toISOString(),
  endDate: toIsoString(row.request.endDate) ?? new Date().toISOString(),
  reason: row.request.reason,
  status: row.request.status,
  approvedBy: row.request.approvedBy,
  approverName: row.approver?.name ?? null,
  createdAt: toIsoString(row.request.createdAt) ?? new Date().toISOString()
});

export class LeaveManagementService {
  constructor(private readonly database = db) {}

  async list(filters?: LeaveRequestListFilters): Promise<LeaveRequestListResult> {
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const whereConditions = [];

    if (filters?.employeeId) {
      whereConditions.push(eq(timeOffRequests.employeeId, filters.employeeId));
    }

    if (filters?.status) {
      whereConditions.push(eq(timeOffRequests.status, filters.status));
    }

    if (filters?.search) {
      whereConditions.push(ilike(timeOffRequests.reason, `%${filters.search}%`));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [requests, totalResult] = await Promise.all([
      this.database
        .select({
          request: timeOffRequests,
          employee: employees,
          approver: users
        })
        .from(timeOffRequests)
        .leftJoin(employees, eq(timeOffRequests.employeeId, employees.id))
        .leftJoin(users, eq(timeOffRequests.approvedBy, users.id))
        .where(whereClause)
        .orderBy(desc(timeOffRequests.createdAt))
        .limit(limit)
        .offset(offset),
      this.database
        .select({ count: timeOffRequests.id })
        .from(timeOffRequests)
        .where(whereClause)
    ]);

    const total = totalResult.length;

    return {
      data: requests.map(mapLeaveRequestRow),
      pagination: {
        total,
        limit,
        offset
      }
    };
  }

  async getById(id: string): Promise<LeaveRequest | undefined> {
    const [result] = await this.database
      .select({
        request: timeOffRequests,
        employee: employees,
        approver: users
      })
      .from(timeOffRequests)
      .leftJoin(employees, eq(timeOffRequests.employeeId, employees.id))
      .leftJoin(users, eq(timeOffRequests.approvedBy, users.id))
      .where(eq(timeOffRequests.id, id))
      .limit(1);

    if (!result) {
      return undefined;
    }

    return mapLeaveRequestRow(result);
  }

  async create(input: LeaveRequestCreateInput): Promise<LeaveRequest> {
    const [result] = await this.database
      .insert(timeOffRequests)
      .values({
        employeeId: input.employeeId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        reason: input.reason ?? null,
        status: input.status ?? "pending"
      })
      .returning();

    const [request] = await this.database
      .select({
        request: timeOffRequests,
        employee: employees,
        approver: users
      })
      .from(timeOffRequests)
      .leftJoin(employees, eq(timeOffRequests.employeeId, employees.id))
      .leftJoin(users, eq(timeOffRequests.approvedBy, users.id))
      .where(eq(timeOffRequests.id, result.id))
      .limit(1);

    return mapLeaveRequestRow(request!);
  }

  async update(id: string, input: LeaveRequestUpdateInput): Promise<LeaveRequest | undefined> {
    const updateData: Partial<typeof timeOffRequests.$inferInsert> = {};

    if (input.startDate !== undefined) {
      updateData.startDate = new Date(input.startDate);
    }
    if (input.endDate !== undefined) {
      updateData.endDate = new Date(input.endDate);
    }
    if (input.reason !== undefined) {
      updateData.reason = input.reason;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.approvedBy !== undefined) {
      updateData.approvedBy = input.approvedBy;
    }

    await this.database.update(timeOffRequests).set(updateData).where(eq(timeOffRequests.id, id));

    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.database
      .delete(timeOffRequests)
      .where(eq(timeOffRequests.id, id))
      .returning();

    return result.length > 0;
  }

  async approve(id: string, approverId: string): Promise<LeaveRequest | undefined> {
    await this.database
      .update(timeOffRequests)
      .set({
        status: "approved",
        approvedBy: approverId
      })
      .where(eq(timeOffRequests.id, id));

    return this.getById(id);
  }

  async reject(id: string, approverId: string): Promise<LeaveRequest | undefined> {
    await this.database
      .update(timeOffRequests)
      .set({
        status: "rejected",
        approvedBy: approverId
      })
      .where(eq(timeOffRequests.id, id));

    return this.getById(id);
  }
}

export function createLeaveManagementService() {
  return new LeaveManagementService();
}

