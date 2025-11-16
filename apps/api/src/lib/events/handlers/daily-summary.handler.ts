import { eventEmitter } from "../event-emitter.js";
import { notificationQueue } from "../../queues/notification.queue.js";
import type { DailySummaryEvent } from "../notification-events.js";
import { NOVU_WORKFLOWS } from "../../novu/novu.templates.js";
import type { MultiChannelNotificationPayload } from "../../novu/novu.types.js";
import { setupPaymentHandler } from "./payment.handler.js";
import { setupTransactionHandler } from "./transaction.handler.js";
import { setupInvoiceHandler } from "./invoice.handler.js";

/**
 * Handle daily summary event
 */
export function setupDailySummaryHandler(): void {
  eventEmitter.on("daily.summary", async (event: DailySummaryEvent) => {
    try {
      const summary = event.summary;
      const summaryItems: string[] = [];

      if (summary.invoicesCount !== undefined) {
        summaryItems.push(`${summary.invoicesCount} invoice(s)`);
      }
      if (summary.paymentsCount !== undefined) {
        summaryItems.push(`${summary.paymentsCount} payment(s)`);
      }
      if (summary.transactionsCount !== undefined) {
        summaryItems.push(`${summary.transactionsCount} transaction(s)`);
      }

      const summaryText = summaryItems.length > 0 ? summaryItems.join(", ") : "No activity";

      const payload: MultiChannelNotificationPayload = {
        userId: event.userId,
        companyId: event.companyId,
        notificationType: "daily_summary",
        title: "Daily Summary",
        message: `Today's activity: ${summaryText}${
          summary.totalRevenue
            ? `. Total revenue: ${summary.totalRevenue} ${summary.currency || ""}`
            : ""
        }`,
        link: `/dashboard?date=${event.date}`,
        metadata: {
          date: event.date,
          summary: event.summary,
        },
        email: {
          to: event.userId, // Will be resolved to user email in Novu
          subject: `Daily Summary - ${event.date}`,
          html: `
            <h2>Daily Summary - ${event.date}</h2>
            <ul>
              ${summary.invoicesCount !== undefined ? `<li>Invoices: ${summary.invoicesCount}</li>` : ""}
              ${summary.paymentsCount !== undefined ? `<li>Payments: ${summary.paymentsCount}</li>` : ""}
              ${summary.transactionsCount !== undefined ? `<li>Transactions: ${summary.transactionsCount}</li>` : ""}
              ${summary.totalRevenue !== undefined ? `<li>Total Revenue: ${summary.totalRevenue} ${summary.currency || ""}</li>` : ""}
            </ul>
            <p><a href="/dashboard?date=${event.date}">View Dashboard</a></p>
          `,
        },
        channels: ["email"], // Daily summaries are typically email-only
      };

      await notificationQueue.add("daily-summary", {
        payload,
        workflowId: NOVU_WORKFLOWS.DAILY_SUMMARY,
      });

      console.log(`✅ Daily summary notification queued for user ${event.userId}`);
    } catch (error) {
      console.error("Failed to queue daily summary notification:", error);
    }
  });

  console.log("✅ Daily summary event handler registered");
}

/**
 * Setup all event handlers
 */
export function setupAllEventHandlers(): void {
  // Import and setup all handlers
  setupPaymentHandler();
  setupTransactionHandler();
  setupInvoiceHandler();
  setupDailySummaryHandler();

  console.log("✅ All event handlers registered");
}

