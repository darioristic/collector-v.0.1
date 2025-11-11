import { index, pgTable, text, timestamp, uniqueIndex, uuid, varchar, bigint } from "drizzle-orm/pg-core";

import { teamMembers } from "./team-members";

export const vaultFolders = pgTable(
  "vault_folders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    parentId: uuid("parent_id").references(() => vaultFolders.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by").references(() => teamMembers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    parentIdx: index("vault_folders_parent_idx").on(table.parentId),
    nameIdx: index("vault_folders_name_idx").on(table.name),
    parentNameUnique: uniqueIndex("vault_folders_parent_name_idx").on(table.parentId, table.name)
  })
);

export const vaultFiles = pgTable(
  "vault_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    type: varchar("type", { length: 150 }).notNull(),
    url: text("url").notNull(),
    folderId: uuid("folder_id")
      .notNull()
      .references(() => vaultFolders.id, { onDelete: "cascade" }),
    uploadedBy: uuid("uploaded_by").references(() => teamMembers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    folderIdx: index("vault_files_folder_idx").on(table.folderId),
    uploadedByIdx: index("vault_files_uploaded_by_idx").on(table.uploadedBy)
  })
);

export type VaultFolder = typeof vaultFolders.$inferSelect;
export type NewVaultFolder = typeof vaultFolders.$inferInsert;

export type VaultFile = typeof vaultFiles.$inferSelect;
export type NewVaultFile = typeof vaultFiles.$inferInsert;


