import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex
} from "drizzle-orm/pg-core";

import { roles, users } from "./settings.schema";

export const employmentStatus = pgEnum("employment_status", [
  "active",
  "on_leave",
  "terminated",
  "contractor"
]);

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    employeeNumber: text("employee_number").notNull(),
    status: employmentStatus("status").default("active").notNull(),
    department: text("department"),
    managerId: uuid("manager_id"),
    hiredAt: timestamp("hired_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    employeeNumberUnique: uniqueIndex("employees_employee_number_key").on(table.employeeNumber),
    managerIdx: index("employees_manager_idx").on(table.managerId)
  })
);

export const employeeRoleAssignments = pgTable(
  "employee_role_assignments",
  {
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    pk: uniqueIndex("employee_role_assignments_employee_role_key").on(table.employeeId, table.roleId)
  })
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    date: timestamp("date", { withTimezone: true }).notNull(),
    status: text("status").default("present").notNull(),
    checkIn: timestamp("check_in", { withTimezone: true }),
    checkOut: timestamp("check_out", { withTimezone: true })
  },
  (table) => ({
    employeeDateIdx: uniqueIndex("attendance_records_employee_date_key").on(
      table.employeeId,
      table.date
    )
  })
);

export const timeOffRequests = pgTable(
  "time_off_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    reason: text("reason"),
    status: text("status").default("pending").notNull(),
    approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    employeeIdx: index("time_off_requests_employee_idx").on(table.employeeId),
    approverIdx: index("time_off_requests_approver_idx").on(table.approvedBy)
  })
);

export const payrollEntries = pgTable(
  "payroll_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    grossPay: integer("gross_pay").notNull(),
    netPay: integer("net_pay").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    employeePeriodIdx: index("payroll_entries_employee_period_idx").on(
      table.employeeId,
      table.periodStart,
      table.periodEnd
    )
  })
);

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id]
  }),
  manager: one(employees, {
    fields: [employees.managerId],
    references: [employees.id],
    relationName: "manager"
  }),
  directReports: many(employees, {
    relationName: "manager"
  }),
  roles: many(employeeRoleAssignments),
  attendance: many(attendanceRecords),
  timeOffRequests: many(timeOffRequests),
  payrollEntries: many(payrollEntries)
}));

export const employeeRoleAssignmentsRelations = relations(employeeRoleAssignments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeRoleAssignments.employeeId],
    references: [employees.id]
  }),
  role: one(roles, {
    fields: [employeeRoleAssignments.roleId],
    references: [roles.id]
  })
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  employee: one(employees, {
    fields: [attendanceRecords.employeeId],
    references: [employees.id]
  })
}));

export const timeOffRequestsRelations = relations(timeOffRequests, ({ one }) => ({
  employee: one(employees, {
    fields: [timeOffRequests.employeeId],
    references: [employees.id]
  }),
  approver: one(users, {
    fields: [timeOffRequests.approvedBy],
    references: [users.id]
  })
}));

export const payrollEntriesRelations = relations(payrollEntries, ({ one }) => ({
  employee: one(employees, {
    fields: [payrollEntries.employeeId],
    references: [employees.id]
  })
}));


