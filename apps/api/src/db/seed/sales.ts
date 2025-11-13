import { inArray, sql } from "drizzle-orm";

import { db as defaultDb } from "../index";
import { accountContacts, accounts } from "../schema/accounts.schema";
import {
  invoiceItems,
  invoices,
  orderItems,
  orders,
  payments,
  quoteItems,
  quotes,
  salesDeals
} from "../schema/sales.schema";
import { products } from "../schema/products.schema";
import { opportunities } from "../schema/crm.schema";
import { users } from "../schema/settings.schema";

const formatMoney = (value: number): string => value.toFixed(2);
const formatRate = (value: number): string => value.toFixed(2);
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date): string => date.toISOString().substring(0, 10);

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
    await tx.delete(salesDeals);
    await tx.delete(invoiceItems);
    await tx.delete(invoices);
    await tx.delete(orderItems);
    await tx.delete(orders);
    // Clean previous offers (quotes) data
    await tx.delete(quoteItems);
    await tx.delete(quotes);

    // Get existing products from database (seeded by products.ts)
    // If products don't exist, throw error - products seed must run first
    const productRecords = await tx
      .select({ id: products.id, sku: products.sku, name: products.name, unitPrice: products.unitPrice })
      .from(products)
      .limit(100);

    if (productRecords.length < 2) {
      throw new Error("Not enough products in database. Please run products seed first: bun run db:seed --only=products");
    }

    const productsByIndex = productRecords.map((product) => ({
      id: product.id,
      name: product.name,
      unitPrice: Number(product.unitPrice)
    }));

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

    // Create 50 offers (quotes) with companies from database
    for (let index = 0; index < 50; index += 1) {
      // Use all companies from database, cycling through them
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

      // Create payment for paid and overdue invoices
      if (invoiceStatus === "paid" || invoiceStatus === "overdue") {
        const paymentDate = invoiceStatus === "paid" 
          ? addDays(issuedAt, Math.floor(Math.random() * 15) + 1)
          : addDays(dueDate, Math.floor(Math.random() * 30) + 1);

        await tx.insert(payments).values({
          invoiceId: invoiceId,
          companyId: account.id,
          contactId: contact.id,
          status: invoiceStatus === "paid" ? "completed" : "pending",
          amount: formatMoney(amountPaid),
          currency,
          method: invoiceStatus === "paid" ? "bank_transfer" : "bank_transfer",
          reference: `PAY-${invoiceRow.invoiceNumber}-${index + 1}`,
          notes: invoiceStatus === "paid" 
            ? `Plaćeno ${formatDate(paymentDate)}`
            : `Delimično plaćeno - preostalo ${formatMoney(invoiceTotal - amountPaid)}`,
          paymentDate: formatDate(paymentDate)
        });
      }
    }

    // Create sales deals from opportunities (if they exist)
    const existingOpportunities = await tx
      .select({ 
        id: opportunities.id, 
        accountId: opportunities.accountId,
        ownerId: opportunities.ownerId,
        value: opportunities.value,
        stage: opportunities.stage,
        closeDate: opportunities.closeDate
      })
      .from(opportunities)
      .limit(30);

    const existingUsers = await tx
      .select({ id: users.id })
      .from(users)
      .limit(10);

    if (existingOpportunities.length > 0 && existingUsers.length > 0) {
      const dealsToCreate = existingOpportunities.slice(0, Math.min(25, existingOpportunities.length));
      
      for (let i = 0; i < dealsToCreate.length; i++) {
        const opp = dealsToCreate[i];
        const owner = existingUsers[i % existingUsers.length];

        // Only create deals for opportunities that are closed or in negotiation
        if (opp.stage === "closedWon" || opp.stage === "closedLost" || opp.stage === "negotiation") {
          await tx.insert(salesDeals).values({
            opportunityId: opp.id,
            ownerId: owner.id,
            description: `Sales deal for opportunity ${opp.id}`,
            closedAt: opp.closeDate || (opp.stage === "closedWon" || opp.stage === "closedLost" ? new Date() : null),
            createdAt: new Date()
          }).onConflictDoNothing();
        }
      }
    }
  });
};
