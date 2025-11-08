import { relations } from "drizzle-orm";
import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex
} from "drizzle-orm/pg-core";

import { users } from "./settings.schema";

export const productStatus = pgEnum("product_status", ["active", "inactive", "archived"]);

export const productCategories = pgTable(
  "product_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    nameIdx: uniqueIndex("product_categories_name_key").on(table.name)
  })
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    status: productStatus("status").default("active").notNull(),
    categoryId: uuid("category_id").references(() => productCategories.id, {
      onDelete: "set null"
    }),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).default("0").notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    skuUnique: uniqueIndex("products_sku_key").on(table.sku),
    nameIdx: uniqueIndex("products_name_key").on(table.name)
  })
);

export const inventoryLocations = pgTable("inventory_locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => inventoryLocations.id, { onDelete: "cascade" }),
    quantity: integer("quantity").default(0).notNull(),
    reserved: integer("reserved").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    productLocationUnique: uniqueIndex("inventory_items_product_location_key").on(
      table.productId,
      table.locationId
    )
  })
);

export const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  products: many(products)
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id]
  }),
  creator: one(users, {
    fields: [products.createdBy],
    references: [users.id]
  }),
  inventoryItems: many(inventoryItems)
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one }) => ({
  product: one(products, {
    fields: [inventoryItems.productId],
    references: [products.id]
  }),
  location: one(inventoryLocations, {
    fields: [inventoryItems.locationId],
    references: [inventoryLocations.id]
  })
}));

export const inventoryLocationsRelations = relations(inventoryLocations, ({ many }) => ({
  inventoryItems: many(inventoryItems)
}));


