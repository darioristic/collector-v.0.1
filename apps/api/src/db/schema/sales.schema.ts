import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  uniqueIndex
} from "drizzle-orm/pg-core";

import { accounts, accountContacts } from "./accounts.schema";
import { opportunities } from "./crm.schema";
import { products } from "./products.schema";
import { users } from "./settings.schema";

export const quoteStatus = pgEnum("quote_status", ["draft", "sent", "accepted", "rejected"]);
export const orderStatus = pgEnum("order_status", [
  "draft",
  "confirmed",
  "fulfilled",
  "pending",
  "processing",
  "shipped",
  "completed",
  "cancelled"
]);
export const invoiceStatus = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "void",
  "unpaid"
]);
export const paymentStatus = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
export const paymentMethod = pgEnum("payment_method", ["bank_transfer", "cash", "card", "crypto"]);

export const quotes = pgTable(
  "quotes",
  {
    id: serial("id").primaryKey(),
    quoteNumber: text("quote_number").notNull().unique(),
    companyId: uuid("company_id").references(() => accounts.id, { onDelete: "set null" }),
    contactId: uuid("contact_id").references(() => accountContacts.id, { onDelete: "set null" }),
    issueDate: date("issue_date").defaultNow(),
    expiryDate: date("expiry_date"),
    currency: text("currency").default("EUR").notNull(),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).default("0").notNull(),
    tax: numeric("tax", { precision: 14, scale: 2 }).default("0").notNull(),
    total: numeric("total", { precision: 14, scale: 2 }).default("0").notNull(),
    status: quoteStatus("status").default("draft").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    companyIdx: index("quotes_company_idx").on(table.companyId),
    contactIdx: index("quotes_contact_idx").on(table.contactId)
  })
);

export const quoteItems = pgTable(
  "quote_items",
  {
    id: serial("id").primaryKey(),
    quoteId: integer("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    description: text("description"),
    quantity: integer("quantity").default(1).notNull(),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).default("0").notNull(),
    total: numeric("total", { precision: 14, scale: 2 }).default("0").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    quoteIdx: index("quote_items_quote_idx").on(table.quoteId),
    productIdx: index("quote_items_product_idx").on(table.productId)
  })
);

export const salesDeals = pgTable(
  "sales_deals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    description: text("description"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    opportunityUnique: uniqueIndex("sales_deals_opportunity_key").on(table.opportunityId)
  })
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    quoteId: integer("quote_id").references(() => quotes.id, { onDelete: "set null" }),
    companyId: uuid("company_id").references(() => accounts.id, { onDelete: "set null" }),
    contactId: uuid("contact_id").references(() => accountContacts.id, { onDelete: "set null" }),
    orderDate: date("order_date").defaultNow(),
    expectedDelivery: date("expected_delivery"),
    currency: text("currency").default("EUR").notNull(),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).default("0").notNull(),
    tax: numeric("tax", { precision: 14, scale: 2 }).default("0").notNull(),
    total: numeric("total", { precision: 14, scale: 2 }).default("0").notNull(),
    status: orderStatus("status").default("pending").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    companyIdx: index("orders_company_idx").on(table.companyId),
    statusIdx: index("orders_status_idx").on(table.status),
    dateIdx: index("orders_date_idx").on(table.orderDate)
  })
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    description: text("description"),
    quantity: integer("quantity").default(1).notNull(),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).default("0").notNull(),
    total: numeric("total", { precision: 14, scale: 2 }).default("0").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    orderIdx: index("order_items_order_idx").on(table.orderId)
  })
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceNumber: text("invoice_number").notNull().unique(),
    orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email"),
    billingAddress: text("billing_address"),
    status: invoiceStatus("status").default("draft").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    amountBeforeDiscount: numeric("amount_before_discount", { precision: 14, scale: 2 })
      .default("0")
      .notNull(),
    discountTotal: numeric("discount_total", { precision: 14, scale: 2 }).default("0").notNull(),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).default("0").notNull(),
    totalVat: numeric("total_vat", { precision: 14, scale: 2 }).default("0").notNull(),
    total: numeric("total", { precision: 14, scale: 2 }).default("0").notNull(),
    amountPaid: numeric("amount_paid", { precision: 14, scale: 2 }).default("0").notNull(),
    balance: numeric("balance", { precision: 14, scale: 2 }).default("0").notNull(),
    currency: text("currency").default("EUR").notNull(),
    notes: jsonb("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    orderIdx: uniqueIndex("invoices_order_key").on(table.orderId),
    customerIdx: index("invoices_customer_idx").on(table.customerId),
    statusIdx: index("invoices_status_idx").on(table.status),
    issuedAtIdx: index("invoices_issued_at_idx").on(table.issuedAt),
    customerStatusIdx: index("invoices_customer_status_idx").on(table.customerId, table.status),
    statusIssuedAtIdx: index("invoices_status_issued_at_idx").on(table.status, table.issuedAt)
  })
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: text("description"),
    quantity: numeric("quantity", { precision: 14, scale: 2 }).default("1").notNull(),
    unit: text("unit").default("pcs").notNull(),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).default("0").notNull(),
    discountRate: numeric("discount_rate", { precision: 6, scale: 2 }).default("0").notNull(),
    vatRate: numeric("vat_rate", { precision: 6, scale: 2 }).default("20").notNull(),
    total: numeric("total", { precision: 14, scale: 2 }).default("0").notNull(),
    totalExclVat: numeric("total_excl_vat", { precision: 14, scale: 2 }).default("0").notNull(),
    vatAmount: numeric("vat_amount", { precision: 14, scale: 2 }).default("0").notNull(),
    totalInclVat: numeric("total_incl_vat", { precision: 14, scale: 2 }).default("0").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    invoiceIdx: index("invoice_items_invoice_idx").on(table.invoiceId)
  })
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    companyId: uuid("company_id").references(() => accounts.id, { onDelete: "set null" }),
    contactId: uuid("contact_id").references(() => accountContacts.id, { onDelete: "set null" }),
    status: paymentStatus("status").default("completed").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).default("0").notNull(),
    currency: text("currency").default("EUR").notNull(),
    method: paymentMethod("method").default("bank_transfer").notNull(),
    reference: text("reference"),
    notes: text("notes"),
    paymentDate: date("payment_date").defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    invoiceIdx: index("payments_invoice_idx").on(table.invoiceId),
    companyIdx: index("payments_company_idx").on(table.companyId),
    statusIdx: index("payments_status_idx").on(table.status)
  })
);

export const invoiceLinks = pgTable(
  "invoice_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    viewCount: integer("view_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    tokenIdx: uniqueIndex("invoice_links_token_idx").on(table.token),
    invoiceIdx: index("invoice_links_invoice_idx").on(table.invoiceId),
    expiresAtIdx: index("invoice_links_expires_at_idx").on(table.expiresAt)
  })
);

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  company: one(accounts, {
    fields: [quotes.companyId],
    references: [accounts.id]
  }),
  contact: one(accountContacts, {
    fields: [quotes.contactId],
    references: [accountContacts.id]
  }),
  items: many(quoteItems),
  orders: many(orders)
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id]
  }),
  product: one(products, {
    fields: [quoteItems.productId],
    references: [products.id]
  })
}));

export const salesDealsRelations = relations(salesDeals, ({ one, many }) => ({
  opportunity: one(opportunities, {
    fields: [salesDeals.opportunityId],
    references: [opportunities.id]
  }),
  owner: one(users, {
    fields: [salesDeals.ownerId],
    references: [users.id]
  }),
  orders: many(orders)
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  quote: one(quotes, {
    fields: [orders.quoteId],
    references: [quotes.id]
  }),
  company: one(accounts, {
    fields: [orders.companyId],
    references: [accounts.id]
  }),
  contact: one(accountContacts, {
    fields: [orders.contactId],
    references: [accountContacts.id]
  }),
  items: many(orderItems),
  invoices: many(invoices)
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  })
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  order: one(orders, {
    fields: [invoices.orderId],
    references: [orders.id]
  }),
  customer: one(accounts, {
    fields: [invoices.customerId],
    references: [accounts.id]
  }),
  items: many(invoiceItems),
  payments: many(payments),
  links: many(invoiceLinks)
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id]
  })
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id]
  }),
  company: one(accounts, {
    fields: [payments.companyId],
    references: [accounts.id]
  }),
  contact: one(accountContacts, {
    fields: [payments.contactId],
    references: [accountContacts.id]
  })
}));

export const invoiceLinksRelations = relations(invoiceLinks, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLinks.invoiceId],
    references: [invoices.id]
  })
}));


