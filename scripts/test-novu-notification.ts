#!/usr/bin/env bun

/**
 * Test script for Novu notifications
 * Usage: bun scripts/test-novu-notification.ts <event-type> <userId> <companyId>
 * 
 * Examples:
 *   bun scripts/test-novu-notification.ts invoice.sent <user-id> <company-id>
 *   bun scripts/test-novu-notification.ts payment.received <user-id> <company-id>
 */

import { eventEmitter } from "../apps/api/src/lib/events/event-emitter.js";
import type {
  InvoiceSentEvent,
  PaymentReceivedEvent,
  TransactionCreatedEvent,
} from "../apps/api/src/lib/events/notification-events.js";

const eventType = process.argv[2];
const userId = process.argv[3];
const companyId = process.argv[4];

if (!eventType || !userId || !companyId) {
  console.error("Usage: bun scripts/test-novu-notification.ts <event-type> <userId> <companyId>");
  console.error("");
  console.error("Event types:");
  console.error("  - invoice.sent");
  console.error("  - payment.received");
  console.error("  - transaction.created");
  console.error("");
  console.error("Example:");
  console.error("  bun scripts/test-novu-notification.ts invoice.sent <user-id> <company-id>");
  process.exit(1);
}

console.log("🧪 Testing Novu notification system...");
console.log(`Event: ${eventType}`);
console.log(`User ID: ${userId}`);
console.log(`Company ID: ${companyId}`);
console.log("");

// Wait a bit for event handlers to process
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function testEvent() {
  try {
    switch (eventType) {
      case "invoice.sent": {
        const invoiceEvent: InvoiceSentEvent = {
          userId,
          companyId,
          invoiceId: "test-invoice-" + Date.now(),
          invoiceNumber: "INV-001",
          recipientEmail: "test@example.com",
          invoiceLink: "http://localhost:3000/invoices/test",
          customerName: "Test Customer",
          amount: 1000,
          currency: "USD",
          timestamp: new Date(),
          metadata: {},
        };
        eventEmitter.emit("invoice.sent", invoiceEvent);
        console.log("✅ Invoice sent event emitted");
        break;
      }

      case "payment.received": {
        const paymentEvent: PaymentReceivedEvent = {
          userId,
          companyId,
          paymentId: "test-payment-" + Date.now(),
          amount: 500,
          currency: "USD",
          invoiceId: "test-invoice-123",
          customerName: "Test Customer",
          timestamp: new Date(),
          metadata: {},
        };
        eventEmitter.emit("payment.received", paymentEvent);
        console.log("✅ Payment received event emitted");
        break;
      }

      case "transaction.created": {
        const transactionEvent: TransactionCreatedEvent = {
          userId,
          companyId,
          transactionId: "test-transaction-" + Date.now(),
          type: "income",
          amount: 250,
          currency: "USD",
          description: "Test transaction",
          timestamp: new Date(),
          metadata: {},
        };
        eventEmitter.emit("transaction.created", transactionEvent);
        console.log("✅ Transaction created event emitted");
        break;
      }

      default:
        console.error(`❌ Unknown event type: ${eventType}`);
        process.exit(1);
    }

    console.log("");
    console.log("⏳ Waiting for event processing...");
    await wait(2000);

    console.log("");
    console.log("✅ Test completed!");
    console.log("");
    console.log("Proverite:");
    console.log("  - Novu dashboard → Activity Feed");
    console.log("  - Email inbox (ako je email step konfigurisan)");
    console.log("  - In-app notifications u dashboard-u");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testEvent();

