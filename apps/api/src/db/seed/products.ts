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

const productsSeed = (() => {
  const count = parseInt(process.env.SEED_PRODUCTS_COUNT || "50", 10);
  const items: Array<{
    id: string;
    sku: string;
    name: string;
    description: string;
    status: typeof products.$inferSelect.status;
    categoryId: string;
    unitPrice: number;
    specifications?: Record<string, unknown> | null;
    inventory: Array<{ locationId: string; quantity: number; reserved: number }>;
  }> = [];

  for (let i = 0; i < count; i++) {
    const category = categoriesSeed[i % categoriesSeed.length];
    const id = formatSeedUuid(3000, i + 1);
    const sku = `${["MEM","KIT","STG","ART"][i % 4]}-${String(i + 1).padStart(3, "0")}`;
    const nameBase = [
      "Premium Collector Membership",
      "Collector Starter Kit",
      "Archival Storage Box",
      "Limited Artifact"
    ][i % 4];
    const name = `${nameBase} ${i + 1}`;
    const description =
      i % 4 === 0
        ? "Godišnja članarina sa ekskluzivnim pristupom."
        : i % 4 === 1
        ? "Komplet sa albumom, futrolama i vodičem."
        : i % 4 === 2
        ? "Kiselinski neutralna kutija za skladištenje."
        : "Retki predmet iz limitirane serije sa sertifikatom.";
    const unitPrice = i % 4 === 3 ? 999 + i * 5 : 29 + i * 2;
    const specifications =
      i % 4 === 0
        ? { tier: "gold", durationMonths: 12, supportLevel: "premium" }
        : i % 4 === 1
        ? { contents: ["album", "sleeves", "guide"], weightKg: 2.5 }
        : i % 4 === 2
        ? { material: "acid-free", size: "L", capacityItems: 200 }
        : { edition: "limited", certificate: true, serial: `ART-${i + 1}` };
    const inventory = [
      { locationId: locationsSeed[0].id, quantity: 50 + (i % 20), reserved: 5 + (i % 3) },
      { locationId: locationsSeed[1].id, quantity: 20 + (i % 15), reserved: 2 + (i % 2) }
    ];

    items.push({
      id,
      sku,
      name,
      description,
      status: DEFAULT_STATUS,
      categoryId: category.id,
      unitPrice,
      specifications,
      inventory
    });
  }

  return items;
})();

export const seedProducts = async (database = defaultDb) => {
  const tx = database;
    const categoryIdByName = new Map<string, string>();
    const existingCategories = await tx
      .select({ id: productCategories.id, name: productCategories.name })
      .from(productCategories);
    for (const c of existingCategories) categoryIdByName.set(c.name, c.id);

    for (const category of categoriesSeed) {
      if (!categoryIdByName.has(category.name)) {
        try {
          const [row] = await tx
            .insert(productCategories)
            .values({ id: category.id, name: category.name, description: category.description })
            .onConflictDoNothing()
            .returning();
          if (row?.id) categoryIdByName.set(category.name, row.id);
        } catch {
          const [row] = await tx
            .select({ id: productCategories.id })
            .from(productCategories)
            .where(sql`"name" = ${category.name}`)
            .limit(1);
          if (row?.id) categoryIdByName.set(category.name, row.id);
        }
      }
    }

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
              address: location.address
            }
          })
      )
    );

    const productIdBySku = new Map<string, string>();
    for (const product of productsSeed) {
      const catId = categoryIdByName.get(categoriesSeed[(productsSeed.indexOf(product)) % categoriesSeed.length].name) ?? product.categoryId;
      const [row] = await tx
        .insert(products)
        .values({
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description,
          status: product.status ?? DEFAULT_STATUS,
          categoryId: catId ?? undefined,
          unitPrice: Number.isFinite(product.unitPrice)
            ? (product.unitPrice as number).toFixed(2)
            : "0.00"
        ,
          specifications: product.specifications ?? null
        })
        .onConflictDoNothing()
        .returning();
      if (row?.id) productIdBySku.set(product.sku, row.id);
      if (!row?.id) {
        const [existing] = await tx
          .select({ id: products.id })
          .from(products)
          .where(sql`sku = ${product.sku}`)
          .limit(1);
        if (existing?.id) productIdBySku.set(product.sku, existing.id);
      }
    }

    for (const product of productsSeed) {
      const pid = productIdBySku.get(product.sku) ?? product.id;
      for (const entry of product.inventory) {
        const updated = await tx
          .update(inventoryItems)
          .set({
            quantity: entry.quantity,
            reserved: entry.reserved,
            updatedAt: sql`NOW()`
          })
          .where(sql`product_id = ${pid} AND location_id = ${entry.locationId}`)
          .returning();

        if (!updated?.length) {
          await tx.insert(inventoryItems).values({
            productId: pid,
            locationId: entry.locationId,
            quantity: entry.quantity,
            reserved: entry.reserved
          });
        }
      }
    }
};
  
export default seedProducts;


