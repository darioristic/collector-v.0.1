import { relations } from "drizzle-orm";
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, numeric } from "drizzle-orm/pg-core";

import { users } from "./settings.schema";

export const accountType = pgEnum("account_type", ["customer", "partner", "vendor"]);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: accountType("type").default("customer").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    website: text("website"),
    taxId: text("tax_id").notNull().default(""),
    country: text("country").notNull().default("RS"),
    legalName: text("legal_name"),
    registrationNumber: text("registration_number"),
    dateOfIncorporation: timestamp("date_of_incorporation", { withTimezone: true }),
    industry: text("industry"),
    numberOfEmployees: integer("number_of_employees"),
    annualRevenueRange: text("annual_revenue_range"),
    legalStatus: text("legal_status"),
    companyType: text("company_type"),
    description: text("description"),
    socialMediaLinks: jsonb("social_media_links"),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    emailUnique: uniqueIndex("accounts_email_key").on(table.email),
    ownerIdx: index("accounts_owner_idx").on(table.ownerId)
  })
);

export const accountContacts = pgTable(
  "account_contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    fullName: text("full_name").notNull().default(""),
    title: text("title"),
    email: text("email"),
    phone: text("phone"),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    accountIdx: index("account_contacts_account_idx").on(table.accountId),
    emailUnique: uniqueIndex("account_contacts_email_key").on(table.email)
  })
);

export const accountAddresses = pgTable(
  "account_addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    label: text("label").default("primary").notNull(),
    street: text("street"),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code"),
    country: text("country"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    accountIdx: index("account_addresses_account_idx").on(table.accountId)
  })
);

export const accountExecutives = pgTable(
  "account_executives",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title"),
    email: text("email"),
    phone: text("phone"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    accountIdx: index("account_executives_account_idx").on(table.accountId)
  })
);

export const accountMilestones = pgTable(
  "account_milestones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    date: timestamp("date", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    accountIdx: index("account_milestones_account_idx").on(table.accountId)
  })
);

export const accountsRelations = relations(accounts, ({ many, one }) => ({
  contacts: many(accountContacts),
  addresses: many(accountAddresses),
  executives: many(accountExecutives),
  milestones: many(accountMilestones),
  owner: one(users, {
    fields: [accounts.ownerId],
    references: [users.id]
  })
}));

export const accountContactsRelations = relations(accountContacts, ({ one }) => ({
  account: one(accounts, {
    fields: [accountContacts.accountId],
    references: [accounts.id]
  }),
  owner: one(users, {
    fields: [accountContacts.ownerId],
    references: [users.id]
  })
}));

export const accountAddressesRelations = relations(accountAddresses, ({ one }) => ({
  account: one(accounts, {
    fields: [accountAddresses.accountId],
    references: [accounts.id]
  })
}));

export const accountExecutivesRelations = relations(accountExecutives, ({ one }) => ({
  account: one(accounts, {
    fields: [accountExecutives.accountId],
    references: [accounts.id]
  })
}));

export const accountMilestonesRelations = relations(accountMilestones, ({ one }) => ({
  account: one(accounts, {
    fields: [accountMilestones.accountId],
    references: [accounts.id]
  })
}));


