export type AccountType = "company" | "individual";
export type Account = {
    id: string;
    name: string;
    type: AccountType;
    email: string;
    phone?: string | null;
    createdAt: string;
    updatedAt: string;
};
export type AccountCreateInput = {
    name: string;
    type: AccountType;
    email: string;
    phone?: string | null;
};
export type AccountUpdateInput = Partial<AccountCreateInput>;
export type User = {
    id: string;
    name: string;
    email: string;
};
export declare const LEAD_STATUSES: readonly ["new", "contacted", "qualified", "won", "lost"];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type Lead = {
    id: string;
    name: string;
    email: string;
    status: LeadStatus;
    source: string;
    createdAt: string;
    updatedAt?: string | null;
};
export type LeadCreateInput = {
    name: string;
    email: string;
    status: LeadStatus;
    source: string;
    createdAt?: string;
    updatedAt?: string | null;
};
export type LeadUpdateInput = Partial<Omit<LeadCreateInput, "createdAt">> & {
    updatedAt?: string | null;
};
export declare const OPPORTUNITY_STAGES: readonly ["qualification", "proposal", "negotiation", "closedWon", "closedLost"];
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];
export type Opportunity = {
    id: string;
    accountId: string;
    title: string;
    stage: OpportunityStage;
    value: number;
    probability: number;
    closeDate: string;
    createdAt: string;
    updatedAt?: string | null;
};
export type OpportunityCreateInput = {
    accountId: string;
    title: string;
    stage: OpportunityStage;
    value: number;
    probability: number;
    closeDate: string;
    createdAt?: string;
    updatedAt?: string | null;
};
export type OpportunityUpdateInput = Partial<Omit<OpportunityCreateInput, "createdAt">> & {
    updatedAt?: string | null;
};
export declare const ACTIVITY_TYPES: readonly ["call", "email", "meeting", "task"];
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export type Activity = {
    id: string;
    type: ActivityType;
    subject: string;
    date: string;
    relatedTo: string;
    createdAt: string;
    updatedAt?: string | null;
};
export type ActivityCreateInput = {
    type: ActivityType;
    subject: string;
    relatedTo: string;
    date?: string;
};
export type ActivityUpdateInput = Partial<ActivityCreateInput> & {
    date?: string;
    updatedAt?: string | null;
};
export declare const CRM_ROLES: readonly ["admin", "sales_manager", "sales_rep", "support", "viewer"];
export type CRMRole = (typeof CRM_ROLES)[number];
export declare const DEAL_STAGES: readonly ["prospecting", "qualification", "proposal", "negotiation", "closedWon", "closedLost"];
export type DealStage = (typeof DEAL_STAGES)[number];
export type Deal = {
    id: string;
    accountId: string;
    title: string;
    stage: DealStage;
    amount: number;
    closeDate: string;
};
export type DealCreateInput = Omit<Deal, "id">;
export type DealUpdateInput = Partial<DealCreateInput>;
export declare const ORDER_STATUSES: readonly ["pending", "processing", "completed", "cancelled"];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderItem = {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
};
export type Order = {
    id: string;
    dealId: string;
    items: OrderItem[];
    totalAmount: number;
    status: OrderStatus;
};
export type OrderItemCreateInput = Omit<OrderItem, "id"> & {
    id?: string;
};
export type OrderCreateInput = {
    dealId: string;
    items: OrderItemCreateInput[];
    status: OrderStatus;
};
export type OrderCreateReply = Order;
export declare const INVOICE_STATUSES: readonly ["draft", "sent", "paid", "overdue"];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type Invoice = {
    id: string;
    orderId: string;
    issueDate: string;
    dueDate: string;
    amount: number;
    status: InvoiceStatus;
};
export type InvoiceCreateInput = Omit<Invoice, "id">;
export type InvoiceCreateReply = Invoice;
export type Product = {
    id: string;
    name: string;
    sku: string;
    price: number;
    currency: string;
    category: string;
    active: boolean;
    relatedSalesOrders: string[];
};
export type ProductCreateInput = {
    name: string;
    sku: string;
    price: number;
    currency: string;
    category: string;
    active?: boolean;
    relatedSalesOrders?: string[];
};
export type ProductUpdateInput = Partial<ProductCreateInput>;
export type InventoryEntry = {
    productId: string;
    warehouse: string;
    quantity: number;
    threshold: number;
};
export declare const PROJECT_STATUSES: readonly ["draft", "inProgress", "completed", "onHold", "cancelled"];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type Project = {
    id: string;
    name: string;
    accountId: string;
    status: ProjectStatus;
    startDate: string;
    endDate: string;
};
export type ProjectCreateInput = {
    name: string;
    accountId: string;
    status: ProjectStatus;
    startDate: string;
    endDate: string;
};
export declare const TASK_STATUSES: readonly ["todo", "inProgress", "done", "blocked"];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type Task = {
    id: string;
    projectId: string;
    title: string;
    assignee: string;
    dueDate: string;
    status: TaskStatus;
};
export type TaskCreateInput = {
    title: string;
    assignee: string;
    dueDate: string;
    status: TaskStatus;
};
export type Milestone = {
    id: string;
    projectId: string;
    title: string;
    targetDate: string;
    completed: boolean;
};
export type MilestoneCreateInput = {
    title: string;
    targetDate: string;
    completed: boolean;
};
export type Employee = {
    id: string;
    name: string;
    email: string;
    position: string;
    department: string;
    hireDate: string;
    active: boolean;
};
export type EmployeeCreateInput = {
    name: string;
    email: string;
    position: string;
    department: string;
    hireDate: string;
    active?: boolean;
};
export type Role = {
    id: string;
    name: string;
    permissions: string[];
};
export declare const ATTENDANCE_STATUSES: readonly ["present", "absent", "remote", "leave"];
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
export type AttendanceRecord = {
    id: string;
    employeeId: string;
    date: string;
    status: AttendanceStatus;
};
export type SettingsUser = {
    id: string;
    username: string;
    email: string;
    role: string;
    active: boolean;
};
export type SettingsUserCreateInput = {
    username: string;
    email: string;
    role: string;
    active?: boolean;
};
export type SettingsPermission = {
    id: string;
    name: string;
    description: string;
    roleId: string;
};
export declare const INTEGRATION_STATUSES: readonly ["connected", "disconnected", "error"];
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];
export type SettingsIntegration = {
    id: string;
    name: string;
    type: string;
    status: IntegrationStatus;
    connectedAt: string;
};
