import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable(
	"users",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		email: text("email").notNull(),
		name: text("name").notNull(),
		defaultCompanyId: uuid("default_company_id"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		emailIdx: index("users_email_idx").on(table.email),
	}),
);

export const company = pgTable("company", {
	id: serial("id").primaryKey(),
	ownerId: uuid("owner_id")
		.notNull()
		.unique()
		.references(() => users.id, { onDelete: "cascade" }),
	name: varchar("name", { length: 255 }).notNull(),
	legalName: varchar("legal_name", { length: 255 }),
	registrationNo: varchar("registration_no", { length: 100 }),
	taxId: varchar("tax_id", { length: 100 }),
	industry: varchar("industry", { length: 255 }),
	employees: integer("employees"),
	streetAddress: varchar("street_address", { length: 255 }),
	city: varchar("city", { length: 255 }),
	zipCode: varchar("zip_code", { length: 50 }),
	country: varchar("country", { length: 100 }),
	email: varchar("email", { length: 255 }).notNull(),
	phone: varchar("phone", { length: 100 }),
	website: varchar("website", { length: 255 }),
	logoUrl: varchar("logo_url", { length: 255 }),
	faviconUrl: varchar("favicon_url", { length: 255 }),
	brandColor: varchar("brand_color", { length: 50 }),
	description: text("description"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const companyRelations = relations(company, ({ one }) => ({
	owner: one(users, {
		fields: [company.ownerId],
		references: [users.id],
	}),
}));

export type Company = typeof company.$inferSelect;
export type NewCompany = typeof company.$inferInsert;

export const companies = pgTable(
	"companies",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		domain: text("domain"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		slugIdx: index("companies_slug_idx").on(table.slug),
	}),
);

export const notifications = pgTable(
	"notifications",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		title: text("title").notNull(),
		message: text("message").notNull(),
		type: text("type").notNull().default("info"),
		link: text("link"),
		read: boolean("read").default(false).notNull(),
		recipientId: uuid("recipient_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		companyId: uuid("company_id")
			.notNull()
			.references(() => companies.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		recipientIdx: index("notifications_recipient_idx").on(table.recipientId),
		companyIdx: index("notifications_company_idx").on(table.companyId),
		readIdx: index("notifications_read_idx").on(table.read),
		createdIdx: index("notifications_created_at_idx").on(table.createdAt),
	}),
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
	recipient: one(users, {
		fields: [notifications.recipientId],
		references: [users.id],
	}),
	company: one(companies, {
		fields: [notifications.companyId],
		references: [companies.id],
	}),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
