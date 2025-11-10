import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
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
export const orderStatus = pgEnum("order_status", ["draft", "confirmed", "fulfilled", "cancelled"]);
export const invoiceStatus = pgEnum("invoice_status", ["draft", "sent", "paid", "overdue", "void"]);
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
    status: text("status").default("draft").notNull(),
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
    id: uuid("id").defaultRandom().primaryKey(),
    quoteId: integer("quote_id").references(() => quotes.id, { onDelete: "set null" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id").references(() => salesDeals.id, { onDelete: "set null" }),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    status: orderStatus("status").default("draft").notNull(),
    currency: text("currency").default("USD").notNull(),
    totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).default("0").notNull(),
    notes: text("notes"),
    orderedAt: timestamp("ordered_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    accountIdx: index("orders_account_idx").on(table.accountId),
    statusIdx: index("orders_status_idx").on(table.status),
    quoteIdx: index("orders_quote_idx").on(table.quoteId)
  })
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: numeric("quantity", { precision: 10, scale: 2 }).default("1").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).default("0").notNull(),
    discount: numeric("discount", { precision: 5, scale: 2 }).default("0").notNull()
  },
  (table) => ({
    orderIdx: index("order_items_order_idx").on(table.orderId)
  })
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: invoiceStatus("status").default("draft").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
    total: numeric("total", { precision: 14, scale: 2 }).default("0").notNull(),
    balance: numeric("balance", { precision: 14, scale: 2 }).default("0").notNull()
  },
  (table) => ({
    orderIdx: uniqueIndex("invoices_order_key").on(table.orderId),
    statusIdx: index("invoices_status_idx").on(table.status)
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
  account: one(accounts, {
    fields: [orders.accountId],
    references: [accounts.id]
  }),
  deal: one(salesDeals, {
    fields: [orders.dealId],
    references: [salesDeals.id]
  }),
  owner: one(users, {
    fields: [orders.ownerId],
    references: [users.id]
  }),
  items: many(orderItems),
  invoice: one(invoices, {
    fields: [orders.id],
    references: [invoices.orderId]
  })
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
  payments: many(payments)
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


