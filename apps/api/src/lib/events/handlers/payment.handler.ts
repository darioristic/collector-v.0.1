import { eventEmitter } from "../event-emitter.js";
import { notificationQueue } from "../../queues/notification.queue.js";
import type { PaymentReceivedEvent } from "../notification-events.js";
import { NOVU_WORKFLOWS } from "../../novu/novu.templates.js";
import type { MultiChannelNotificationPayload } from "../../novu/novu.types.js";

/**
 * Handle payment received event
 */
export function setupPaymentHandler(): void {
  eventEmitter.on("payment.received", async (...args: unknown[]) => {
    const [event] = args as [PaymentReceivedEvent];
    try {
      const payload: MultiChannelNotificationPayload = {
        userId: event.userId,
        companyId: event.companyId,
        notificationType: "payment",
        title: "Payment Received",
        message: `Payment of ${event.amount} ${event.currency} has been received${
          event.customerName ? ` from ${event.customerName}` : ""
        }`,
        link: event.invoiceId
          ? `/invoices/${event.invoiceId}`
          : `/payments/${event.paymentId}`,
        metadata: {
          paymentId: event.paymentId,
          amount: event.amount,
          currency: event.currency,
          invoiceId: event.invoiceId,
          customerName: event.customerName,
        },
        email: {
          to: event.userId, // Will be resolved to user email in Novu
          subject: `Payment Received - ${event.amount} ${event.currency}`,
          html: `
            <h2>Payment Received</h2>
            <p>A payment of <strong>${event.amount} ${event.currency}</strong> has been received.</p>
            ${event.customerName ? `<p>Customer: ${event.customerName}</p>` : ""}
            ${event.invoiceId ? `<p><a href="${event.invoiceId}">View Invoice</a></p>` : ""}
          `,
        },
        inApp: {
          cta: {
            type: "redirect",
            data: {
              url: event.invoiceId
                ? `/invoices/${event.invoiceId}`
                : `/payments/${event.paymentId}`,
            },
          },
        },
        channels: ["in_app", "email"],
        fallback: true,
      };

      await notificationQueue.add("payment-received", {
        payload,
        workflowId: NOVU_WORKFLOWS.PAYMENT_RECEIVED,
      });

      console.log(`✅ Payment notification queued for user ${event.userId}`);
    } catch (error) {
      console.error("Failed to queue payment notification:", error);
    }
  });

  console.log("✅ Payment event handler registered");
}
