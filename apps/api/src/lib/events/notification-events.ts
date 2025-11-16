import type { NotificationPreferenceType } from "../novu/novu.types.js";

/**
 * Base event payload structure
 */
export interface BaseEventPayload {
  userId: string;
  companyId: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Payment received event
 */
export interface PaymentReceivedEvent extends BaseEventPayload {
  paymentId: string;
  amount: number;
  currency: string;
  invoiceId?: string;
  customerName?: string;
}

/**
 * Transaction created event
 */
export interface TransactionCreatedEvent extends BaseEventPayload {
  transactionId: string;
  type: "income" | "expense";
  amount: number;
  currency: string;
  description?: string;
}

/**
 * Invoice sent event
 */
export interface InvoiceSentEvent extends BaseEventPayload {
  invoiceId: string;
  invoiceNumber: string;
  recipientEmail: string | string[];
  invoiceLink: string;
  customerName?: string;
  amount?: number;
  currency?: string;
}

/**
 * Daily summary event
 */
export interface DailySummaryEvent extends BaseEventPayload {
  date: string; // ISO date string
  summary: {
    invoicesCount?: number;
    paymentsCount?: number;
    transactionsCount?: number;
    totalRevenue?: number;
    currency?: string;
  };
}

/**
 * Quote approved event
 */
export interface QuoteApprovedEvent extends BaseEventPayload {
  quoteId: string;
  quoteNumber: string;
  customerName?: string;
  amount?: number;
  currency?: string;
}

/**
 * Deal won event
 */
export interface DealWonEvent extends BaseEventPayload {
  dealId: string;
  dealName: string;
  amount?: number;
  currency?: string;
  customerName?: string;
}

/**
 * Project milestone event
 */
export interface ProjectMilestoneEvent extends BaseEventPayload {
  projectId: string;
  projectName: string;
  milestoneId: string;
  milestoneName: string;
}

/**
 * Task assigned event
 */
export interface TaskAssignedEvent extends BaseEventPayload {
  taskId: string;
  taskName: string;
  assigneeId: string;
  assigneeName?: string;
  projectId?: string;
  projectName?: string;
}

/**
 * System alert event
 */
export interface SystemAlertEvent extends BaseEventPayload {
  alertType: "error" | "warning" | "info";
  message: string;
  severity: "low" | "medium" | "high" | "critical";
}

/**
 * Event type definitions
 * Maps event names to their payload types
 */
export type NotificationEventMap = {
  "payment.received": PaymentReceivedEvent;
  "transaction.created": TransactionCreatedEvent;
  "invoice.sent": InvoiceSentEvent;
  "daily.summary": DailySummaryEvent;
  "quote.approved": QuoteApprovedEvent;
  "deal.won": DealWonEvent;
  "project.milestone": ProjectMilestoneEvent;
  "task.assigned": TaskAssignedEvent;
  "system.alert": SystemAlertEvent;
};

/**
 * Event names as union type
 */
export type NotificationEventName = keyof NotificationEventMap;

/**
 * Helper type to get event payload type
 */
export type EventPayload<T extends NotificationEventName> =
  NotificationEventMap[T];

/**
 * Map event names to notification preference types
 */
export const EVENT_TO_NOTIFICATION_TYPE: Record<
  NotificationEventName,
  NotificationPreferenceType
> = {
  "payment.received": "payment",
  "transaction.created": "transaction",
  "invoice.sent": "invoice",
  "daily.summary": "daily_summary",
  "quote.approved": "quote",
  "deal.won": "deal",
  "project.milestone": "project",
  "task.assigned": "task",
  "system.alert": "system",
};

