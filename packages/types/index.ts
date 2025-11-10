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

export type AccountContact = {
  id: string;
  accountId: string;
  accountName: string | null;
  name: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  ownerId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
};

export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;
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

export const OPPORTUNITY_STAGES = [
  "qualification",
  "proposal",
  "negotiation",
  "closedWon",
  "closedLost"
] as const;
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

export const ACTIVITY_TYPES = ["call", "email", "meeting", "task"] as const;
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
  updatedAt?: string | null;
};

export type ActivityUpdateInput = Partial<ActivityCreateInput> & {
  date?: string;
  updatedAt?: string | null;
};

export const CRM_ROLES = ["admin", "sales_manager", "sales_rep", "support", "viewer"] as const;
export type CRMRole = (typeof CRM_ROLES)[number];

export const DEAL_STAGES = [
  "prospecting",
  "qualification",
  "proposal",
  "negotiation",
  "closedWon",
  "closedLost"
] as const;
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

export const ORDER_STATUSES = ["pending", "processing", "completed", "cancelled"] as const;
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

export type OrderItemCreateInput = Omit<OrderItem, "id"> & { id?: string };
export type OrderCreateInput = {
  dealId: string;
  items: OrderItemCreateInput[];
  status: OrderStatus;
};

export type OrderCreateReply = Order;

export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue"] as const;
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

// Payment Types
export const PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["bank_transfer", "cash", "card", "crypto"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type Payment = {
  id: string;
  invoiceId: string;
  companyId?: string | null;
  contactId?: string | null;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  paymentDate: string;
  createdAt: string;
};

export type PaymentCreateInput = {
  invoiceId: string;
  amount: number;
  currency?: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  paymentDate?: string;
  status?: PaymentStatus;
};

export type PaymentUpdateInput = Partial<Omit<PaymentCreateInput, "invoiceId">>;

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

export const PROJECT_STATUSES = ["draft", "inProgress", "completed", "onHold", "cancelled"] as const;
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

export const TASK_STATUSES = ["todo", "inProgress", "done", "blocked"] as const;
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

export const ATTENDANCE_STATUSES = ["present", "absent", "remote", "leave"] as const;
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

export const INTEGRATION_STATUSES = ["connected", "disconnected", "error"] as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

export type SettingsIntegration = {
  id: string;
  name: string;
  type: string;
  status: IntegrationStatus;
  connectedAt: string;
};
