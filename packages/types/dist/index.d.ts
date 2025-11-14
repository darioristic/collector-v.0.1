export type AccountType = "customer" | "partner" | "vendor";
export type Account = {
    id: string;
    name: string;
    type: AccountType;
    email: string;
    phone?: string | null;
    website?: string | null;
    taxId: string;
    country: string;
    legalName?: string | null;
    registrationNumber?: string | null;
    dateOfIncorporation?: string | null;
    industry?: string | null;
    numberOfEmployees?: number | null;
    annualRevenueRange?: string | null;
    legalStatus?: string | null;
    companyType?: string | null;
    description?: string | null;
    socialMediaLinks?: {
        linkedin?: string | null;
        facebook?: string | null;
        twitter?: string | null;
        instagram?: string | null;
        [key: string]: string | null | undefined;
    } | null;
    createdAt: string;
    updatedAt: string;
};
export type AccountCreateInput = {
    name: string;
    type: AccountType;
    email: string;
    phone?: string | null;
    website?: string | null;
    taxId: string;
    country: string;
    legalName?: string | null;
    registrationNumber?: string | null;
    dateOfIncorporation?: string | null;
    industry?: string | null;
    numberOfEmployees?: number | null;
    annualRevenueRange?: string | null;
    legalStatus?: string | null;
    companyType?: string | null;
    description?: string | null;
    socialMediaLinks?: {
        linkedin?: string | null;
        facebook?: string | null;
        twitter?: string | null;
        instagram?: string | null;
        [key: string]: string | null | undefined;
    } | null;
};
export type AccountUpdateInput = Partial<AccountCreateInput>;
export type AccountContact = {
    id: string;
    accountId: string;
    accountName: string | null;
    name: string;
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
    ownerId?: string | null;
    createdAt: string;
    updatedAt: string;
};
export type AccountAddress = {
    id: string;
    accountId: string;
    label: string;
    street?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
    latitude?: string | null;
    longitude?: string | null;
    createdAt: string;
};
export type AccountExecutive = {
    id: string;
    accountId: string;
    name: string;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
    createdAt: string;
};
export type AccountMilestone = {
    id: string;
    accountId: string;
    title: string;
    description?: string | null;
    date: string;
    createdAt: string;
};
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
export type LeadListFilters = {
    status?: LeadStatus;
    source?: string;
    search?: string;
    limit?: number;
    offset?: number;
};
export type LeadListResult = {
    data: Lead[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
    };
};
export declare const OPPORTUNITY_STAGES: readonly ["prospecting", "qualification", "proposal", "negotiation", "closedWon", "closedLost"];
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
export declare const ACTIVITY_TYPES: readonly ["call", "meeting", "task", "follow_up"];
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export type Activity = {
    id: string;
    title: string;
    clientId: string;
    clientName: string;
    assignedTo?: string | null;
    assignedToName?: string | null;
    assignedToEmail?: string | null;
    type: ActivityType;
    dueDate: string;
    status: ActivityStatus;
    priority: ActivityPriority;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
};
export type ActivityCreateInput = {
    title: string;
    clientId: string;
    assignedTo?: string | null;
    type: ActivityType;
    dueDate: string;
    status: ActivityStatus;
    priority: ActivityPriority;
    notes?: string | null;
};
export type ActivityUpdateInput = Partial<ActivityCreateInput> & {
    dueDate?: string;
};
export declare const ACTIVITY_STATUSES: readonly ["scheduled", "in_progress", "completed", "missed"];
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];
export declare const ACTIVITY_PRIORITIES: readonly ["high", "medium", "low"];
export type ActivityPriority = (typeof ACTIVITY_PRIORITIES)[number];
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
export declare const PAYMENT_STATUSES: readonly ["pending", "completed", "failed", "refunded"];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export declare const PAYMENT_METHODS: readonly ["bank_transfer", "cash", "card", "crypto"];
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
export declare const QUOTE_STATUSES: readonly ["draft", "sent", "accepted", "rejected"];
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
export type QuoteItem = {
    id: number;
    quoteId: number;
    productId?: string | null;
    description?: string | null;
    quantity: number;
    unitPrice: number;
    total: number;
    createdAt: string;
};
export type Quote = {
    id: number;
    quoteNumber: string;
    companyId?: string | null;
    contactId?: string | null;
    companyName?: string | null;
    contactName?: string | null;
    issueDate: string;
    expiryDate?: string | null;
    currency: string;
    subtotal: number;
    tax: number;
    total: number;
    status: string;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    items?: QuoteItem[];
};
export type QuoteSortField = "issueDate" | "expiryDate" | "total" | "quoteNumber" | "createdAt";
export type QuoteItemCreateInput = {
    productId?: string;
    description?: string;
    quantity: number;
    unitPrice: number;
};
export type QuoteCreateInput = {
    quoteNumber: string;
    companyId?: string;
    contactId?: string;
    issueDate?: string;
    expiryDate?: string;
    currency?: string;
    status?: string;
    notes?: string;
    items: QuoteItemCreateInput[];
};
export type QuoteUpdateInput = Partial<Omit<QuoteCreateInput, "quoteNumber">>;
export declare const ORDER_STATUSES: readonly ["draft", "confirmed", "fulfilled", "pending", "processing", "shipped", "completed", "cancelled"];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderItem = {
    id: number;
    orderId: number;
    productId?: string | null;
    description?: string | null;
    quantity: number;
    unitPrice: number;
    total: number;
    createdAt: string;
};
export type Order = {
    id: number;
    orderNumber: string;
    quoteId?: number | null;
    companyId?: string | null;
    contactId?: string | null;
    orderDate: string;
    expectedDelivery?: string | null;
    currency: string;
    subtotal: number;
    tax: number;
    total: number;
    status: OrderStatus;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    items?: OrderItem[];
};
export type OrderItemCreateInput = {
    productId?: string;
    description?: string;
    quantity: number;
    unitPrice: number;
};
export type OrderCreateInput = {
    orderNumber: string;
    quoteId?: number;
    companyId?: string;
    contactId?: string;
    orderDate?: string;
    expectedDelivery?: string;
    currency?: string;
    status?: OrderStatus;
    notes?: string;
    items: OrderItemCreateInput[];
};
export type OrderUpdateInput = Partial<Omit<OrderCreateInput, "orderNumber">>;
export declare const INVOICE_STATUSES: readonly ["draft", "sent", "paid", "overdue", "void", "unpaid"];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type InvoiceItem = {
    id: number;
    invoiceId: string;
    description?: string | null;
    quantity: number;
    unit: string;
    unitPrice: number;
    discountRate: number;
    vatRate: number;
    totalExclVat: number;
    vatAmount: number;
    totalInclVat: number;
    createdAt: string;
};
export type Invoice = {
    id: string;
    orderId?: number | null;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    customerEmail?: string | null;
    billingAddress?: string | null;
    status: InvoiceStatus;
    issuedAt: string;
    dueDate?: string | null;
    amountBeforeDiscount: number;
    discountTotal: number;
    subtotal: number;
    totalVat: number;
    total: number;
    amountPaid: number;
    balance: number;
    currency: string;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    items?: InvoiceItem[];
};
export type InvoiceItemCreateInput = {
    description?: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    discountRate?: number;
    vatRate?: number;
};
export type InvoiceCreateInput = {
    invoiceNumber: string;
    orderId?: number;
    customerId: string;
    customerName: string;
    customerEmail?: string;
    billingAddress?: string;
    issuedAt?: string;
    dueDate?: string;
    currency?: string;
    status?: InvoiceStatus;
    notes?: string;
    items: InvoiceItemCreateInput[];
};
export type InvoiceUpdateInput = Partial<Omit<InvoiceCreateInput, "invoiceNumber" | "customerId">>;
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
