import {
	index,
	numeric,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const employmentTypeEnum = pgEnum("employment_type", [
	"Full-time",
	"Contractor",
	"Intern",
]);

export const employmentStatusEnum = pgEnum("employment_status", [
	"Active",
	"On Leave",
	"Terminated",
]);

export const employees = pgTable(
	"employees",
	{
		id: serial("id").primaryKey(),
		firstName: varchar("first_name", { length: 100 }).notNull(),
		lastName: varchar("last_name", { length: 100 }).notNull(),
		email: varchar("email", { length: 255 }).notNull().unique(),
		hashedPassword: text("hashed_password").notNull().default(""),
		phone: varchar("phone", { length: 50 }),
		department: varchar("department", { length: 100 }),
		role: varchar("role", { length: 100 }),
		employmentType: employmentTypeEnum("employment_type")
			.default("Full-time")
			.notNull(),
		status: employmentStatusEnum("status").default("Active").notNull(),
		startDate: timestamp("start_date", { withTimezone: true }).notNull(),
		endDate: timestamp("end_date", { withTimezone: true }),
		salary: numeric("salary", { precision: 12, scale: 2 }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		departmentIdx: index("employees_department_idx").on(table.department),
		statusIdx: index("employees_status_idx").on(table.status),
		employmentTypeIdx: index("employees_employment_type_idx").on(
			table.employmentType,
		),
		startDateIdx: index("employees_start_date_idx").on(table.startDate),
	}),
);

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
