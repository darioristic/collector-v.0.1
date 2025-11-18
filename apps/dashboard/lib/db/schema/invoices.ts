import { relations } from "drizzle-orm";
import {
	boolean,
	decimal,
	index,
	integer,
	json,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { company, users } from "./core";

// Enums
export const invoiceStatusEnum = pgEnum("invoice_status", [
	"draft",
	"pending",
	"overdue",
	"paid",
	"canceled",
]);

export const invoiceSizeEnum = pgEnum("invoice_size", ["a4", "letter"]);

export const invoiceDeliveryTypeEnum = pgEnum("invoice_delivery_type", [
	"create",
	"create_and_send",
]);

export const dateFormatEnum = pgEnum("date_format", [
	"dd/MM/yyyy",
	"MM/dd/yyyy",
	"yyyy-MM-dd",
]);

// Main Invoices Table
export const invoices = pgTable(
	"invoices",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		companyId: integer("company_id")
			.notNull()
			.references(() => company.id, { onDelete: "cascade" }),
		customerId: uuid("customer_id"), // References customers table (to be created)
		customerName: varchar("customer_name", { length: 255 }),
		invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
		status: invoiceStatusEnum("status").default("draft").notNull(),

		// Dates
		issueDate: timestamp("issue_date", { withTimezone: true }).notNull(),
		dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
		paidAt: timestamp("paid_at", { withTimezone: true }),

		// Amounts
		subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
		vatAmount: decimal("vat_amount", { precision: 12, scale: 2 }).default("0"),
		taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
		discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0"),
		total: decimal("total", { precision: 12, scale: 2 }).notNull(),

		currency: varchar("currency", { length: 3 }).default("USD").notNull(),

		// Template settings
		logoUrl: text("logo_url"),
		size: invoiceSizeEnum("size").default("a4").notNull(),
		includeVat: boolean("include_vat").default(true),
		includeTax: boolean("include_tax").default(false),
		taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
		dateFormat: dateFormatEnum("date_format").default("yyyy-MM-dd").notNull(),
		locale: varchar("locale", { length: 10 }).default("en-US"),

		// Labels (customizable)
		customerLabel: varchar("customer_label", { length: 100 }).default("To"),
		fromLabel: varchar("from_label", { length: 100 }).default("From"),
		invoiceNoLabel: varchar("invoice_no_label", { length: 100 }).default("Invoice No"),
		issueDateLabel: varchar("issue_date_label", { length: 100 }).default("Issue Date"),
		dueDateLabel: varchar("due_date_label", { length: 100 }).default("Due Date"),
		descriptionLabel: varchar("description_label", { length: 100 }).default("Description"),
		priceLabel: varchar("price_label", { length: 100 }).default("Price"),
		quantityLabel: varchar("quantity_label", { length: 100 }).default("Quantity"),
		totalLabel: varchar("total_label", { length: 100 }).default("Total"),
		vatLabel: varchar("vat_label", { length: 100 }).default("VAT"),
		taxLabel: varchar("tax_label", { length: 100 }).default("Tax"),
		paymentLabel: varchar("payment_label", { length: 100 }).default("Payment Details"),
		noteLabel: varchar("note_label", { length: 100 }).default("Note"),

		// JSON fields for rich content (TipTap editor)
		fromDetails: json("from_details"), // Company address, contact info
		customerDetails: json("customer_details"), // Customer address, contact info
		paymentDetails: json("payment_details"), // Bank details, payment instructions
		noteDetails: json("note_details"), // Additional notes

		// Internal notes (not shown on invoice)
		internalNote: text("internal_note"),

		// Token for public access (view/pay invoice)
		token: varchar("token", { length: 255 }).unique(),

		// Delivery
		deliveryType: invoiceDeliveryTypeEnum("delivery_type").default("create"),
		sentAt: timestamp("sent_at", { withTimezone: true }),
		sentTo: text("sent_to"), // Email addresses
		reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
		reminderCount: integer("reminder_count").default(0),

		// View tracking
		viewCount: integer("view_count").default(0),
		lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),

		// Metadata
		createdBy: uuid("created_by").references(() => users.id),
		updatedBy: uuid("updated_by").references(() => users.id),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		companyIdIdx: index("invoices_company_id_idx").on(table.companyId),
		customerIdIdx: index("invoices_customer_id_idx").on(table.customerId),
		statusIdx: index("invoices_status_idx").on(table.status),
		invoiceNumberIdx: index("invoices_invoice_number_idx").on(table.invoiceNumber),
		dueDateIdx: index("invoices_due_date_idx").on(table.dueDate),
		tokenIdx: index("invoices_token_idx").on(table.token),
	}),
);

// Invoice Line Items Table
export const invoiceLineItems = pgTable(
	"invoice_line_items",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		invoiceId: uuid("invoice_id")
			.notNull()
			.references(() => invoices.id, { onDelete: "cascade" }),

		name: varchar("name", { length: 500 }).notNull(),
		description: text("description"),
		quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
		price: decimal("price", { precision: 12, scale: 2 }).notNull(),

		// VAT/Tax per item
		vat: decimal("vat", { precision: 5, scale: 2 }).default("0"),
		tax: decimal("tax", { precision: 5, scale: 2 }).default("0"),
		discountRate: decimal("discount_rate", { precision: 5, scale: 2 }).default("0"),

		// Calculated totals
		lineTotal: decimal("line_total", { precision: 12, scale: 2 }).notNull(),

		// Order
		sortOrder: integer("sort_order").default(0),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		invoiceIdIdx: index("invoice_line_items_invoice_id_idx").on(table.invoiceId),
	}),
);

// Invoice Comments Table (for collaboration)
export const invoiceComments = pgTable(
	"invoice_comments",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		invoiceId: uuid("invoice_id")
			.notNull()
			.references(() => invoices.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),

		comment: text("comment").notNull(),

		// Mentions
		mentions: json("mentions"), // Array of user IDs mentioned

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		invoiceIdIdx: index("invoice_comments_invoice_id_idx").on(table.invoiceId),
		userIdIdx: index("invoice_comments_user_id_idx").on(table.userId),
	}),
);

// Invoice Customers Table (simplified CRM)
export const invoiceCustomers = pgTable(
	"invoice_customers",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		companyId: integer("company_id")
			.notNull()
			.references(() => company.id, { onDelete: "cascade" }),

		name: varchar("name", { length: 255 }).notNull(),
		email: varchar("email", { length: 255 }),
		phone: varchar("phone", { length: 100 }),

		// Address
		streetAddress: varchar("street_address", { length: 255 }),
		city: varchar("city", { length: 255 }),
		zipCode: varchar("zip_code", { length: 50 }),
		country: varchar("country", { length: 100 }),

		// Business info
		taxId: varchar("tax_id", { length: 100 }),
		registrationNo: varchar("registration_no", { length: 100 }),

		// Payment terms
		defaultPaymentTerms: integer("default_payment_terms").default(30), // days
		defaultCurrency: varchar("default_currency", { length: 3 }).default("USD"),

		// Stats
		totalInvoices: integer("total_invoices").default(0),
		totalPaid: decimal("total_paid", { precision: 12, scale: 2 }).default("0"),
		totalOutstanding: decimal("total_outstanding", { precision: 12, scale: 2 }).default("0"),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		companyIdIdx: index("invoice_customers_company_id_idx").on(table.companyId),
		emailIdx: index("invoice_customers_email_idx").on(table.email),
	}),
);

// Invoice Templates Table (default settings per company)
export const invoiceTemplates = pgTable(
	"invoice_templates",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		companyId: integer("company_id")
			.notNull()
			.references(() => company.id, { onDelete: "cascade" })
			.unique(), // One template per company

		// Template settings
		logoUrl: text("logo_url"),
		size: invoiceSizeEnum("size").default("a4").notNull(),
		includeVat: boolean("include_vat").default(true),
		includeTax: boolean("include_tax").default(false),
		taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
		dateFormat: dateFormatEnum("date_format").default("yyyy-MM-dd").notNull(),
		locale: varchar("locale", { length: 10 }).default("en-US"),
		currency: varchar("currency", { length: 3 }).default("USD").notNull(),

		// Labels (customizable)
		customerLabel: varchar("customer_label", { length: 100 }).default("To"),
		fromLabel: varchar("from_label", { length: 100 }).default("From"),
		invoiceNoLabel: varchar("invoice_no_label", { length: 100 }).default("Invoice No"),
		issueDateLabel: varchar("issue_date_label", { length: 100 }).default("Issue Date"),
		dueDateLabel: varchar("due_date_label", { length: 100 }).default("Due Date"),
		descriptionLabel: varchar("description_label", { length: 100 }).default("Description"),
		priceLabel: varchar("price_label", { length: 100 }).default("Price"),
		quantityLabel: varchar("quantity_label", { length: 100 }).default("Quantity"),
		totalLabel: varchar("total_label", { length: 100 }).default("Total"),
		vatLabel: varchar("vat_label", { length: 100 }).default("VAT"),
		taxLabel: varchar("tax_label", { length: 100 }).default("Tax"),
		paymentLabel: varchar("payment_label", { length: 100 }).default("Payment Details"),
		noteLabel: varchar("note_label", { length: 100 }).default("Note"),

		// Default JSON content
		fromDetails: json("from_details"),
		paymentDetails: json("payment_details"),

		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		companyIdIdx: index("invoice_templates_company_id_idx").on(table.companyId),
	}),
);

// Relations
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
	company: one(company, {
		fields: [invoices.companyId],
		references: [company.id],
	}),
	customer: one(invoiceCustomers, {
		fields: [invoices.customerId],
		references: [invoiceCustomers.id],
	}),
	createdByUser: one(users, {
		fields: [invoices.createdBy],
		references: [users.id],
		relationName: "invoiceCreatedBy",
	}),
	updatedByUser: one(users, {
		fields: [invoices.updatedBy],
		references: [users.id],
		relationName: "invoiceUpdatedBy",
	}),
	lineItems: many(invoiceLineItems),
	comments: many(invoiceComments),
}));

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
	invoice: one(invoices, {
		fields: [invoiceLineItems.invoiceId],
		references: [invoices.id],
	}),
}));

export const invoiceCommentsRelations = relations(invoiceComments, ({ one }) => ({
	invoice: one(invoices, {
		fields: [invoiceComments.invoiceId],
		references: [invoices.id],
	}),
	user: one(users, {
		fields: [invoiceComments.userId],
		references: [users.id],
	}),
}));

export const invoiceCustomersRelations = relations(invoiceCustomers, ({ one, many }) => ({
	company: one(company, {
		fields: [invoiceCustomers.companyId],
		references: [company.id],
	}),
	invoices: many(invoices),
}));

export const invoiceTemplatesRelations = relations(invoiceTemplates, ({ one }) => ({
	company: one(company, {
		fields: [invoiceTemplates.companyId],
		references: [company.id],
	}),
}));
