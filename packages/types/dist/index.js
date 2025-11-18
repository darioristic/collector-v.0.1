export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost"];
export const OPPORTUNITY_STAGES = [
    "prospecting",
    "qualification",
    "proposal",
    "negotiation",
    "closedWon",
    "closedLost"
];
export const ACTIVITY_TYPES = ["call", "meeting", "task", "follow_up"];
export const ACTIVITY_STATUSES = ["scheduled", "in_progress", "completed", "missed"];
export const ACTIVITY_PRIORITIES = ["high", "medium", "low"];
export const CRM_ROLES = ["admin", "sales_manager", "sales_rep", "support", "viewer"];
export const DEAL_STAGES = [
    "prospecting",
    "qualification",
    "proposal",
    "negotiation",
    "closedWon",
    "closedLost"
];
// Payment Types
export const PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded"];
export const PAYMENT_METHODS = ["bank_transfer", "cash", "card", "crypto"];
// Quote Types
export const QUOTE_STATUSES = ["draft", "sent", "accepted", "rejected"];
// Order Types
export const ORDER_STATUSES = [
    "draft",
    "confirmed",
    "fulfilled",
    "pending",
    "processing",
    "shipped",
    "completed",
    "cancelled"
];
// Invoice Types
export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "void", "unpaid"];
export const PROJECT_STATUSES = ["draft", "inProgress", "completed", "onHold", "cancelled"];
export const TASK_STATUSES = ["todo", "inProgress", "done", "blocked"];
export const ATTENDANCE_STATUSES = ["present", "absent", "remote", "leave"];
export const INTEGRATION_STATUSES = ["connected", "disconnected", "error"];
export * from "./invoice.js";
export * from "./utils/units.js";
export * from "./utils/pagination.js";
