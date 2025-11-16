import { eventEmitter } from "../event-emitter.js";
import { notificationQueue } from "../../queues/notification.queue.js";
import type { InvoiceSentEvent } from "../notification-events.js";
import { NOVU_WORKFLOWS } from "../../novu/novu.templates.js";
import type { MultiChannelNotificationPayload } from "../../novu/novu.types.js";

/**
 * Handle invoice sent event
 */
export function setupInvoiceHandler(): void {
  eventEmitter.on("invoice.sent", async (event: InvoiceSentEvent) => {
    try {
      const recipients = Array.isArray(event.recipientEmail)
        ? event.recipientEmail
        : [event.recipientEmail];

      // Send notification to the user who sent the invoice
      const payload: MultiChannelNotificationPayload = {
        userId: event.userId,
        companyId: event.companyId,
        notificationType: "invoice",
        title: "Invoice Sent",
        message: `Invoice ${event.invoiceNumber} has been sent${
          event.customerName ? ` to ${event.customerName}` : ""
        }`,
        link: `/invoices/${event.invoiceId}`,
        metadata: {
          invoiceId: event.invoiceId,
          invoiceNumber: event.invoiceNumber,
          recipientEmail: recipients,
          customerName: event.customerName,
          amount: event.amount,
          currency: event.currency,
        },
        email: {
          to: event.userId, // Will be resolved to user email in Novu
          subject: `Invoice ${event.invoiceNumber} Sent`,
          html: `
            <h2>Invoice Sent</h2>
            <p>Invoice <strong>${event.invoiceNumber}</strong> has been sent successfully.</p>
            ${event.customerName ? `<p>Recipient: ${event.customerName}</p>` : ""}
            ${event.amount ? `<p>Amount: ${event.amount} ${event.currency || ""}</p>` : ""}
            <p><a href="${event.invoiceLink}">View Invoice</a></p>
          `,
        },
        inApp: {
          cta: {
            type: "redirect",
            data: {
              url: `/invoices/${event.invoiceId}`,
            },
          },
        },
        channels: ["in_app", "email"],
        fallback: true,
      };

      await notificationQueue.add("invoice-sent", {
        payload,
        workflowId: NOVU_WORKFLOWS.INVOICE_SENT,
      });

      console.log(`✅ Invoice notification queued for user ${event.userId}`);
    } catch (error) {
      console.error("Failed to queue invoice notification:", error);
    }
  });

  console.log("✅ Invoice event handler registered");
}

