import { sql } from "drizzle-orm";

import { db as defaultDb } from "../index";
import {
  inventoryItems,
  inventoryLocations,
  productCategories,
  products
} from "../schema/products.schema";

const DEFAULT_STATUS: typeof products.$inferSelect.status = "active";

const formatSeedUuid = (prefix: number, suffix: number) =>
  `00000000-0000-0000-${String(prefix).padStart(4, "0")}-${String(suffix).padStart(12, "0")}`;

const categoriesSeed = [
  {
    id: formatSeedUuid(1000, 1),
    name: "Premium Memberships",
    description: "Ekskluzivne pretplate i članarine za kolekcionare"
  },
  {
    id: formatSeedUuid(1000, 2),
    name: "Collector Kits",
    description: "Kompletni setovi za započinjanje kolekcionarske kolekcije"
  },
  {
    id: formatSeedUuid(1000, 3),
    name: "Storage Solutions",
    description: "Kutije, futrole i alati za pravilno skladištenje kolekcija"
  },
  {
    id: formatSeedUuid(1000, 4),
    name: "Limited Edition Artifacts",
    description: "Ograničene serije i retki predmeti"
  }
];

const locationsSeed = [
  {
    id: formatSeedUuid(2000, 1),
    name: "Central Warehouse",
    address: "Bulevar umetnosti 12, Beograd"
  },
  {
    id: formatSeedUuid(2000, 2),
    name: "EU Fulfillment Center",
    address: "Industrijska zona bb, Novi Sad"
  }
];

const productsSeed = [
  {
    id: formatSeedUuid(3000, 1),
    sku: "MEM-PREMIUM-001",
    name: "Premium Collector Membership",
    description:
      "Godišnja članarina koja uključuje ekskluzivan pristup aukcijama i privatnim događajima.",
    status: "active" as const,
    categoryId: categoriesSeed[0].id,
    unitPrice: 199.99,
    inventory: [
      { locationId: locationsSeed[0].id, quantity: 150, reserved: 12 },
      { locationId: locationsSeed[1].id, quantity: 60, reserved: 5 }
    ]
  },
  {
    id: formatSeedUuid(3000, 2),
    sku: "KIT-START-101",
    name: "Collector Starter Kit",
    description:
      "Komplet sa albumom, zaštitnim futrolama i vodičem za početnike.",
    status: "active" as const,
    categoryId: categoriesSeed[1].id,
    unitPrice: 89.5,
    inventory: [
      { locationId: locationsSeed[0].id, quantity: 80, reserved: 10 },
      { locationId: locationsSeed[1].id, quantity: 45, reserved: 4 }
    ]
  },
  {
    id: formatSeedUuid(3000, 3),
    sku: "STG-BOX-050",
    name: "Archival Storage Box",
    description: "Kiselinski neutralna kutija za dugoročno skladištenje retkih predmeta.",
    status: "active" as const,
    categoryId: categoriesSeed[2].id,
    unitPrice: 39.9,
    inventory: [
      { locationId: locationsSeed[0].id, quantity: 200, reserved: 25 }
    ]
  },
  {
    id: formatSeedUuid(3000, 4),
    sku: "ART-LIMIT-777",
    name: "Limited Artifact #777",
    description:
      "Ekstremno redak predmet iz limitirane serije sa sertifikatom autentičnosti.",
    status: "active" as const,
    categoryId: categoriesSeed[3].id,
    unitPrice: 1299.0,
    inventory: [
      { locationId: locationsSeed[0].id, quantity: 12, reserved: 3 },
      { locationId: locationsSeed[1].id, quantity: 6, reserved: 1 }
    ]
  }
];

export const seedProducts = async (database = defaultDb) => {
  await database.transaction(async (tx) => {
    await Promise.all(
      categoriesSeed.map((category) =>
        tx
          .insert(productCategories)
          .values({
            id: category.id,
            name: category.name,
            description: category.description
          })
          .onConflictDoUpdate({
            target: productCategories.id,
            set: {
              name: category.name,
              description: category.description,
              updatedAt: sql`NOW()`
            }
          })
      )
    );

    await Promise.all(
      locationsSeed.map((location) =>
        tx
          .insert(inventoryLocations)
          .values({
            id: location.id,
            name: location.name,
            address: location.address
          })
          .onConflictDoUpdate({
            target: inventoryLocations.id,
            set: {
              name: location.name,
              address: location.address,
              updatedAt: sql`NOW()`
            }
          })
      )
    );

    await Promise.all(
      productsSeed.map((product) =>
        tx
          .insert(products)
          .values({
            id: product.id,
            sku: product.sku,
            name: product.name,
            description: product.description,
            status: product.status ?? DEFAULT_STATUS,
            categoryId: product.categoryId,
            unitPrice: product.unitPrice.toString(),
            createdBy: null
          })
          .onConflictDoUpdate({
            target: products.id,
            set: {
              sku: product.sku,
              name: product.name,
              description: product.description,
              status: product.status ?? DEFAULT_STATUS,
              categoryId: product.categoryId,
              unitPrice: product.unitPrice.toString(),
              updatedAt: sql`NOW()`
            }
          })
      )
    );

    await Promise.all(
      productsSeed.map((product) =>
        Promise.all(
          product.inventory.map((entry) =>
            tx
              .insert(inventoryItems)
              .values({
                productId: product.id,
                locationId: entry.locationId,
                quantity: entry.quantity,
                reserved: entry.reserved
              })
              .onConflictDoUpdate({
                target: [inventoryItems.productId, inventoryItems.locationId],
                set: {
                  quantity: entry.quantity,
                  reserved: entry.reserved,
                  updatedAt: sql`NOW()`
                }
              })
          )
        )
      )
    );
  });
};


