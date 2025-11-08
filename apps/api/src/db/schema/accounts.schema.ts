import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex
} from "drizzle-orm/pg-core";

import { users } from "./settings.schema";

export const accountType = pgEnum("account_type", ["company", "individual"]);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: accountType("type").default("company").notNull(),
    email: text("email"),
    phone: text("phone"),
    website: text("website"),
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
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    accountIdx: index("account_addresses_account_idx").on(table.accountId)
  })
);

export const accountsRelations = relations(accounts, ({ many, one }) => ({
  contacts: many(accountContacts),
  addresses: many(accountAddresses),
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


