import { and, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "../../db";
import { employees, payrollEntries } from "../../db/schema";

export interface PayrollEntry {
  id: string;
  employeeId: string;
  employeeName?: string;
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  netPay: number;
  createdAt: string;
}

export interface PayrollEntryCreateInput {
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  netPay: number;
}

export interface PayrollEntryUpdateInput {
  periodStart?: string;
  periodEnd?: string;
  grossPay?: number;
  netPay?: number;
}

export interface PayrollEntryListFilters {
  employeeId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PayrollEntryListResult {
  data: PayrollEntry[];
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

type PayrollEntryRow = {
  entry: typeof payrollEntries.$inferSelect;
  employee: typeof employees.$inferSelect | null;
};

const mapPayrollEntryRow = (row: PayrollEntryRow): PayrollEntry => ({
  id: row.entry.id,
  employeeId: row.entry.employeeId,
  employeeName: row.employee ? `${row.employee.employeeNumber}` : undefined,
  periodStart: toIsoString(row.entry.periodStart) ?? new Date().toISOString(),
  periodEnd: toIsoString(row.entry.periodEnd) ?? new Date().toISOString(),
  grossPay: row.entry.grossPay,
  netPay: row.entry.netPay,
  createdAt: toIsoString(row.entry.createdAt) ?? new Date().toISOString()
});

export class PayrollService {
  constructor(private readonly database = db) {}

  async list(filters?: PayrollEntryListFilters): Promise<PayrollEntryListResult> {
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    const whereConditions = [];

    if (filters?.employeeId) {
      whereConditions.push(eq(payrollEntries.employeeId, filters.employeeId));
    }

    if (filters?.search) {
      whereConditions.push(
        or(
          ilike(employees.employeeNumber, `%${filters.search}%`),
          ilike(employees.department, `%${filters.search}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [entries, totalResult] = await Promise.all([
      this.database
        .select({
          entry: payrollEntries,
          employee: employees
        })
        .from(payrollEntries)
        .leftJoin(employees, eq(payrollEntries.employeeId, employees.id))
        .where(whereClause)
        .orderBy(desc(payrollEntries.periodStart))
        .limit(limit)
        .offset(offset),
      this.database
        .select({ count: payrollEntries.id })
        .from(payrollEntries)
        .where(whereClause)
    ]);

    const total = totalResult.length;

    return {
      data: entries.map(mapPayrollEntryRow),
      pagination: {
        total,
        limit,
        offset
      }
    };
  }

  async getById(id: string): Promise<PayrollEntry | undefined> {
    const [result] = await this.database
      .select({
        entry: payrollEntries,
        employee: employees
      })
      .from(payrollEntries)
      .leftJoin(employees, eq(payrollEntries.employeeId, employees.id))
      .where(eq(payrollEntries.id, id))
      .limit(1);

    if (!result) {
      return undefined;
    }

    return mapPayrollEntryRow(result);
  }

  async create(input: PayrollEntryCreateInput): Promise<PayrollEntry> {
    const [result] = await this.database
      .insert(payrollEntries)
      .values({
        employeeId: input.employeeId,
        periodStart: new Date(input.periodStart),
        periodEnd: new Date(input.periodEnd),
        grossPay: input.grossPay,
        netPay: input.netPay
      })
      .returning();

    const [entry] = await this.database
      .select({
        entry: payrollEntries,
        employee: employees
      })
      .from(payrollEntries)
      .leftJoin(employees, eq(payrollEntries.employeeId, employees.id))
      .where(eq(payrollEntries.id, result.id))
      .limit(1);

    return mapPayrollEntryRow(entry!);
  }

  async update(id: string, input: PayrollEntryUpdateInput): Promise<PayrollEntry | undefined> {
    const updateData: Partial<typeof payrollEntries.$inferInsert> = {};

    if (input.periodStart !== undefined) {
      updateData.periodStart = new Date(input.periodStart);
    }
    if (input.periodEnd !== undefined) {
      updateData.periodEnd = new Date(input.periodEnd);
    }
    if (input.grossPay !== undefined) {
      updateData.grossPay = input.grossPay;
    }
    if (input.netPay !== undefined) {
      updateData.netPay = input.netPay;
    }

    await this.database.update(payrollEntries).set(updateData).where(eq(payrollEntries.id, id));

    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.database
      .delete(payrollEntries)
      .where(eq(payrollEntries.id, id))
      .returning();

    return result.length > 0;
  }
}

export function createPayrollService() {
  return new PayrollService();
}

