import { eventEmitter } from "../event-emitter.js";
import { notificationQueue } from "../../queues/notification.queue.js";
import type { TransactionCreatedEvent } from "../notification-events.js";
import { NOVU_WORKFLOWS } from "../../novu/novu.templates.js";
import type { MultiChannelNotificationPayload } from "../../novu/novu.types.js";

/**
 * Handle transaction created event
 */
export function setupTransactionHandler(): void {
  eventEmitter.on(
    "transaction.created",
    async (...args: unknown[]) => {
      const [event] = args as [TransactionCreatedEvent];
      try {
        const payload: MultiChannelNotificationPayload = {
          userId: event.userId,
          companyId: event.companyId,
          notificationType: "transaction",
          title: `New ${event.type === "income" ? "Income" : "Expense"} Transaction`,
          message: `A new ${event.type} transaction of ${event.amount} ${event.currency} has been created${
            event.description ? `: ${event.description}` : ""
          }`,
          link: `/transactions/${event.transactionId}`,
          metadata: {
            transactionId: event.transactionId,
            type: event.type,
            amount: event.amount,
            currency: event.currency,
            description: event.description,
          },
          inApp: {
            cta: {
              type: "redirect",
              data: {
                url: `/transactions/${event.transactionId}`,
              },
            },
          },
          channels: ["in_app"],
          fallback: true,
        };

        await notificationQueue.add("transaction-created", {
          payload,
          workflowId: NOVU_WORKFLOWS.TRANSACTION_CREATED,
        });

        console.log(
          `✅ Transaction notification queued for user ${event.userId}`
        );
      } catch (error) {
        console.error("Failed to queue transaction notification:", error);
      }
    }
  );

  console.log("✅ Transaction event handler registered");
}
