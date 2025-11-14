import type { RouteHandler } from "fastify";
import { and, eq, ilike, or, type SQL } from "drizzle-orm";

import { db } from "../../db/index.js";
import {
	employeeRoleAssignments,
	employees,
	roles,
	users,
} from "../../db/schema/index.js";
import type { Employee } from "./hr.schema";

export type ListEmployeesQuery = {
  limit?: number;
  offset?: number;
  search?: string;
  department?: string;
};
export type ListEmployeesReply = { data: Employee[] };
export type CreateEmployeeBody = {
  name: string;
  email: string;
  position: string;
  department: string;
  hireDate: string;
  active?: boolean;
};
export type CreateEmployeeReply = { data: Employee };

export const listEmployees: RouteHandler<{ Querystring: ListEmployeesQuery; Reply: ListEmployeesReply }> = async (request) => {
  const limit = Number(request.query?.limit ?? 50);
  const offset = Number(request.query?.offset ?? 0);
  const search = typeof request.query?.search === "string" ? request.query.search : undefined;
  const department = typeof request.query?.department === "string" ? request.query.department : undefined;

  let whereExpr: SQL | undefined;
  if (search && search.length > 0) {
    whereExpr = or(
      ilike(users.name, `%${search}%`),
      ilike(users.email, `%${search}%`),
      ilike(employees.employeeNumber, `%${search}%`),
      ilike(employees.department, `%${search}%`)
    );
  }
  if (department && department.length > 0) {
    const depExpr = eq(employees.department, department);
    whereExpr = whereExpr ? and(whereExpr, depExpr) : depExpr;
  }

  const rows = await db
    .select({ e: employees, u: users, era: employeeRoleAssignments, r: roles })
    .from(employees)
    .leftJoin(users, eq(employees.userId, users.id))
    .leftJoin(employeeRoleAssignments, eq(employeeRoleAssignments.employeeId, employees.id))
    .leftJoin(roles, eq(employeeRoleAssignments.roleId, roles.id))
    .where(whereExpr)
    .limit(limit)
    .offset(offset);

  const byId = new Map<string, Employee>();

  const rank = (roleKey?: string | null) => (roleKey === "admin" ? 3 : roleKey === "manager" ? 2 : roleKey === "user" ? 1 : 0);

  for (const row of rows) {
    const e = row.e;
    const u = row.u;
    const r = row.r;

    const existing = byId.get(e.id);
    const candidate: Employee = {
      id: e.id,
      name: u?.name ?? "",
      email: u?.email ?? "",
      position:
        r?.key === "admin" ? "Administrator" : r?.key === "manager" ? "Manager" : r?.key === "user" ? "Employee" : "Employee",
      department: e.department ?? "",
      hireDate: (e.hiredAt ?? new Date()).toISOString().slice(0, 10),
      active: e.status === "active",
    };

    if (!existing) {
      byId.set(e.id, candidate);
    } else {
      // Prefer higher-ranked role when multiple role assignments exist
      const existingRoleKey = rows.find((r0) => r0.e.id === e.id && r0.r)?.r?.key ?? null;
      if (rank(r?.key ?? null) > rank(existingRoleKey)) {
        byId.set(e.id, candidate);
      }
    }
  }

  return { data: Array.from(byId.values()) };
};

export const createEmployee: RouteHandler<{ Body: CreateEmployeeBody; Reply: CreateEmployeeReply }> =
  async (request, reply) => {
    // Minimal stub: echo back payload to keep API unchanged; persistence will be implemented later
    const newEmployee: Employee = {
      id: "",
      name: request.body.name,
      email: request.body.email,
      position: request.body.position,
      department: request.body.department,
      hireDate: request.body.hireDate,
      active: request.body.active ?? true
    };

    return reply.code(201).send({ data: newEmployee });
  };


