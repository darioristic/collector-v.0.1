import { inArray } from "drizzle-orm";

import { db as defaultDb } from "../index";
import { accountContacts, accounts } from "../schema/accounts.schema";
import {
  invoiceItems,
  invoices,
  orderItems,
  orders,
  payments,
  quoteItems,
  quotes
} from "../schema/sales.schema";
import { productCategories, products } from "../schema/products.schema";

const formatMoney = (value: number): string => value.toFixed(2);
const formatRate = (value: number): string => value.toFixed(2);
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date): string => date.toISOString().substring(0, 10);

const categorySeeds: Array<{
  id: string;
  name: string;
  description: string;
}> = [
  {
    id: "00000000-0000-0000-0000-000000010001",
    name: "Construction Services",
    description: "Consulting and execution services for large construction projects"
  },
  {
    id: "00000000-0000-0000-0000-000000010002",
    name: "Industrial Equipment",
    description: "Heavy machinery, safety systems and monitoring equipment"
  },
  {
    id: "00000000-0000-0000-0000-000000010003",
    name: "Software & Automation",
    description: "Software licenses, automation suites and integrations"
  },
  {
    id: "00000000-0000-0000-0000-000000010004",
    name: "Logistics",
    description: "Freight, warehousing and logistics management"
  },
  {
    id: "00000000-0000-0000-0000-000000010005",
    name: "Energy Solutions",
    description: "Power management, renewable energy and grid maintenance"
  }
] ;

const productSeeds: Array<{
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  unitPrice: number;
}> = [
  {
    id: "00000000-0000-0000-0000-000000020001",
    sku: "PROD-001",
    name: "Project Planning Suite",
    description: "Software for detailed construction project planning",
    categoryId: categorySeeds[2].id,
    unitPrice: 3200
  },
  {
    id: "00000000-0000-0000-0000-000000020002",
    sku: "PROD-002",
    name: "Safety Monitoring Sensors",
    description: "IoT sensors for on-site safety monitoring",
    categoryId: categorySeeds[1].id,
    unitPrice: 980
  },
  {
    id: "00000000-0000-0000-0000-000000020003",
    sku: "PROD-003",
    name: "Crane Rental (per week)",
    description: "Heavy-duty crane rental including operator",
    categoryId: categorySeeds[0].id,
    unitPrice: 8500
  },
  {
    id: "00000000-0000-0000-0000-000000020004",
    sku: "PROD-004",
    name: "Steel Support Beams",
    description: "Reinforced steel beams (set of 10)",
    categoryId: categorySeeds[1].id,
    unitPrice: 1250
  },
  {
    id: "00000000-0000-0000-0000-000000020005",
    sku: "PROD-005",
    name: "Site Logistics Package",
    description: "In-field logistics coordination and warehousing",
    categoryId: categorySeeds[3].id,
    unitPrice: 4100
  },
  {
    id: "00000000-0000-0000-0000-000000020006",
    sku: "PROD-006",
    name: "Renewable Power Unit",
    description: "Hybrid solar/wind mobile power station",
    categoryId: categorySeeds[4].id,
    unitPrice: 6700
  },
  {
    id: "00000000-0000-0000-0000-000000020007",
    sku: "PROD-007",
    name: "Concrete Delivery",
    description: "High-volume concrete delivery (25m³)",
    categoryId: categorySeeds[0].id,
    unitPrice: 2200
  },
  {
    id: "00000000-0000-0000-0000-000000020008",
    sku: "PROD-008",
    name: "Structural Engineering Consulting",
    description: "Senior engineering consulting retainer (per month)",
    categoryId: categorySeeds[0].id,
    unitPrice: 5400
  },
  {
    id: "00000000-0000-0000-0000-000000020009",
    sku: "PROD-009",
    name: "Automation Integrations",
    description: "Industrial automation software integration",
    categoryId: categorySeeds[2].id,
    unitPrice: 3800
  },
  {
    id: "00000000-0000-0000-0000-000000020010",
    sku: "PROD-010",
    name: "Warm Shell Fit-out",
    description: "Interior warm shell construction works",
    categoryId: categorySeeds[0].id,
    unitPrice: 15200
  }
] ;

const orderStatuses = ["pending", "processing", "shipped", "completed", "cancelled"] as const;
const invoiceStatuses = ["draft", "sent", "paid", "overdue", "unpaid"] as const;
const quoteStatuses = ["draft", "sent", "accepted", "rejected"] as const;
const currencies = ["EUR", "USD", "GBP"] as const;

export const seedSales = async (database = defaultDb) => {
  await database.transaction(async (tx) => {
    // Ensure related base data exists
    const existingAccounts = await tx.select({ id: accounts.id, name: accounts.name, email: accounts.email }).from(accounts);
    if (existingAccounts.length === 0) {
      throw new Error("Seed accounts before running sales seed");
    }

    const existingContacts = await tx
      .select({
        id: accountContacts.id,
        accountId: accountContacts.accountId,
        name: accountContacts.name,
        firstName: accountContacts.firstName,
        lastName: accountContacts.lastName,
        fullName: accountContacts.fullName,
        email: accountContacts.email
      })
      .from(accountContacts);

    if (existingContacts.length === 0) {
      throw new Error("Seed contacts before running sales seed");
    }

    // Clean previous sales data
    await tx.delete(payments);
    await tx.delete(invoiceItems);
    await tx.delete(invoices);
    await tx.delete(orderItems);
    await tx.delete(orders);
    await tx.delete(quoteItems);
    await tx.delete(quotes);

    // Upsert product categories
    await tx
      .insert(productCategories)
      .values(categorySeeds)
      .onConflictDoUpdate({
        target: productCategories.id,
        set: {
          name: productCategories.name,
          description: productCategories.description
        }
      });

    const categoryRecords = await tx
      .select({ id: productCategories.id, name: productCategories.name })
      .from(productCategories)
      .where(inArray(productCategories.id, categorySeeds.map((category) => category.id)));
    const categoryLookup = new Map(categoryRecords.map((category) => [category.id, category.id]));

    // Upsert products
    await tx
      .insert(products)
      .values(
        productSeeds.map((product) => ({
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description,
          categoryId: categoryLookup.get(product.categoryId) ?? null,
          unitPrice: formatMoney(product.unitPrice)
        }))
      )
      .onConflictDoUpdate({
        target: products.sku,
        set: {
          name: products.name,
          description: products.description,
          categoryId: products.categoryId,
          unitPrice: products.unitPrice
        }
      });

    const productRecords = await tx
      .select({ id: products.id, sku: products.sku, name: products.name, unitPrice: products.unitPrice })
      .from(products)
      .where(inArray(products.sku, productSeeds.map((product) => product.sku)));
    const productsByIndex = productRecords.map((product) => ({
      id: product.id,
      name: product.name,
      unitPrice: Number(product.unitPrice)
    }));

    if (productsByIndex.length < 2) {
      throw new Error("Not enough products to seed sales data");
    }

    const contactByAccount = existingContacts.reduce<Map<string, typeof existingContacts[number][]>>(
      (map, contact) => {
        const group = map.get(contact.accountId) ?? [];
        group.push(contact);
        map.set(contact.accountId, group);
        return map;
      },
      new Map()
    );

    const baseDate = new Date(2025, 0, 8);

    for (let index = 0; index < 50; index += 1) {
      const account = existingAccounts[index % existingAccounts.length];
      const contactsForAccount = contactByAccount.get(account.id) ?? existingContacts;
      const contact = contactsForAccount[index % contactsForAccount.length];

      const issueDate = addDays(baseDate, index * 2);
      const expiryDate = addDays(issueDate, 30);
      const orderDate = addDays(issueDate, 5);
      const expectedDelivery = addDays(orderDate, 7 + (index % 6));
      const currency = currencies[index % currencies.length];

      const productA = productsByIndex[(index * 2) % productsByIndex.length];
      const productB = productsByIndex[(index * 2 + 3) % productsByIndex.length];

      const quantityA = (index % 5) + 1;
      const quantityB = ((index + 2) % 4) + 1;

      const itemATotal = quantityA * productA.unitPrice;
      const itemBTotal = quantityB * productB.unitPrice;
      const orderSubtotal = itemATotal + itemBTotal;
      const orderTax = Number((orderSubtotal * 0.18).toFixed(2));
      const orderTotal = orderSubtotal + orderTax;

      const quoteStatus = quoteStatuses[index % quoteStatuses.length];
      const orderStatusValue = orderStatuses[index % orderStatuses.length];

      const [quoteRow] = await tx
        .insert(quotes)
        .values({
          quoteNumber: `QUO-2025-${String(index + 1).padStart(4, "0")}`,
          companyId: account.id,
          contactId: contact.id,
          issueDate: formatDate(issueDate),
          expiryDate: formatDate(expiryDate),
          currency,
          subtotal: formatMoney(orderSubtotal),
          tax: formatMoney(orderTax),
          total: formatMoney(orderTotal),
          status: quoteStatus,
          notes: `Automatski generisana ponuda za ${account.name}`
        })
        .returning();

      const quoteId = quoteRow.id;

      await tx.insert(quoteItems).values([
        {
          quoteId,
          productId: productA.id,
          description: productA.name,
          quantity: quantityA,
          unitPrice: formatMoney(productA.unitPrice),
          total: formatMoney(itemATotal)
        },
        {
          quoteId,
          productId: productB.id,
          description: productB.name,
          quantity: quantityB,
          unitPrice: formatMoney(productB.unitPrice),
          total: formatMoney(itemBTotal)
        }
      ]);

      const [orderRow] = await tx
        .insert(orders)
        .values({
          orderNumber: `ORD-2025-${String(index + 1).padStart(4, "0")}`,
          quoteId,
          companyId: account.id,
          contactId: contact.id,
          orderDate: formatDate(orderDate),
          expectedDelivery: formatDate(expectedDelivery),
          currency,
          subtotal: formatMoney(orderSubtotal),
          tax: formatMoney(orderTax),
          total: formatMoney(orderTotal),
          status: orderStatusValue,
          notes: `Automatski generisana porudžbina #${index + 1}`
        })
        .returning();

      const orderId = orderRow.id;

      await tx.insert(orderItems).values([
        {
          orderId,
          productId: productA.id,
          description: productA.name,
          quantity: quantityA,
          unitPrice: formatMoney(productA.unitPrice),
          total: formatMoney(itemATotal)
        },
        {
          orderId,
          productId: productB.id,
          description: productB.name,
          quantity: quantityB,
          unitPrice: formatMoney(productB.unitPrice),
          total: formatMoney(itemBTotal)
        }
      ]);

      // Generate invoice items (10 per invoice)
      const invoiceItemsData: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        discountRate: number;
        vatRate: number;
      }> = [];

      for (let itemIndex = 0; itemIndex < 10; itemIndex += 1) {
        const product = productsByIndex[(index * 7 + itemIndex) % productsByIndex.length];
        const quantity = ((itemIndex + index) % 5) + 1;
        const discountRate = ((itemIndex + index) % 4) * 2.5; // 0, 2.5, 5, 7.5
        const vatRate = itemIndex % 2 === 0 ? 20 : 10;

        invoiceItemsData.push({
          description: product.name,
          quantity,
          unitPrice: product.unitPrice,
          discountRate,
          vatRate
        });
      }

      let amountBeforeDiscount = 0;
      let discountTotal = 0;
      let subtotal = 0;
      let totalVat = 0;

      const invoiceItemRecords = invoiceItemsData.map((item) => {
        const raw = item.quantity * item.unitPrice;
        const discounted = raw * (1 - item.discountRate / 100);
        const vatAmount = discounted * (item.vatRate / 100);
        const totalInclVat = discounted + vatAmount;

        amountBeforeDiscount += raw;
        discountTotal += raw - discounted;
        subtotal += discounted;
        totalVat += vatAmount;

        return {
          description: item.description,
          quantity: formatMoney(item.quantity),
          unit: "pcs",
          unitPrice: formatMoney(item.unitPrice),
          discountRate: formatRate(item.discountRate),
          vatRate: formatRate(item.vatRate),
          totalExclVat: formatMoney(discounted),
          vatAmount: formatMoney(vatAmount),
          totalInclVat: formatMoney(totalInclVat)
        };
      });

      const invoiceTotal = subtotal + totalVat;
      const invoiceStatus = invoiceStatuses[index % invoiceStatuses.length];
      let amountPaid = 0;

      switch (invoiceStatus) {
        case "paid":
          amountPaid = invoiceTotal;
          break;
        case "overdue":
          amountPaid = invoiceTotal * 0.6;
          break;
        case "sent":
        case "draft":
        case "unpaid":
        default:
          amountPaid = 0;
          break;
      }

      const issuedAt = addDays(orderDate, 2);
      const dueDate = addDays(issuedAt, 30);

      const [invoiceRow] = await tx
        .insert(invoices)
        .values({
          orderId,
          invoiceNumber: `INV-2025-${String(index + 1).padStart(4, "0")}`,
          customerId: account.id,
          customerName: account.name,
          customerEmail: contact.email ?? account.email ?? `${account.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          billingAddress: `${account.name} Billing Office`,
          status: invoiceStatus,
          issuedAt,
          dueDate,
          amountBeforeDiscount: formatMoney(amountBeforeDiscount),
          discountTotal: formatMoney(discountTotal),
          subtotal: formatMoney(subtotal),
          totalVat: formatMoney(totalVat),
          total: formatMoney(invoiceTotal),
          amountPaid: formatMoney(amountPaid),
          balance: formatMoney(invoiceTotal - amountPaid),
          currency,
          notes: `Automatski generisana faktura za porudžbinu ${index + 1}`
        })
        .returning();

      const invoiceId = invoiceRow.id;

      await tx.insert(invoiceItems).values(
        invoiceItemRecords.map((item) => ({
          ...item,
          invoiceId
        }))
      );
    }
  });
};
