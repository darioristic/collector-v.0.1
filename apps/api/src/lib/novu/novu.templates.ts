/**
 * Novu workflow identifiers
 * These should match the workflow IDs created in Novu dashboard
 */
export const NOVU_WORKFLOWS = {
  INVOICE_SENT: "invoice-sent",
  PAYMENT_RECEIVED: "payment-received",
  TRANSACTION_CREATED: "transaction-created",
  DAILY_SUMMARY: "daily-summary",
  QUOTE_APPROVED: "quote-approved",
  DEAL_WON: "deal-won",
  PROJECT_MILESTONE: "project-milestone",
  TASK_ASSIGNED: "task-assigned",
  SYSTEM_ALERT: "system-alert",
} as const;

export type NovuWorkflowId = (typeof NOVU_WORKFLOWS)[keyof typeof NOVU_WORKFLOWS];

/**
 * Map notification preference types to workflow IDs
 */
export const NOTIFICATION_TYPE_TO_WORKFLOW: Record<
  string,
  NovuWorkflowId
> = {
  invoice: NOVU_WORKFLOWS.INVOICE_SENT,
  payment: NOVU_WORKFLOWS.PAYMENT_RECEIVED,
  transaction: NOVU_WORKFLOWS.TRANSACTION_CREATED,
  daily_summary: NOVU_WORKFLOWS.DAILY_SUMMARY,
  quote: NOVU_WORKFLOWS.QUOTE_APPROVED,
  deal: NOVU_WORKFLOWS.DEAL_WON,
  project: NOVU_WORKFLOWS.PROJECT_MILESTONE,
  task: NOVU_WORKFLOWS.TASK_ASSIGNED,
  system: NOVU_WORKFLOWS.SYSTEM_ALERT,
};

