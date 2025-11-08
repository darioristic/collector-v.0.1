export type AccountType = "company" | "individual";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
};

export type AccountCreateInput = {
  name: string;
  type: AccountType;
  email: string;
  phone?: string;
};

export type AccountUpdateInput = AccountCreateInput;

export type User = {
  id: string;
  name: string;
  email: string;
};

export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type LeadBase = {
  name: string;
  email: string;
  status: LeadStatus;
  source: string;
};

export type Lead = LeadBase & {
  id: string;
  createdAt: string;
  updatedAt?: string | null;
};

export type LeadCreateInput = LeadBase & {
  createdAt?: string;
  updatedAt?: string | null;
};

export type LeadUpdateInput = Partial<LeadBase> & {
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

export type OpportunityBase = {
  accountId: string;
  title: string;
  stage: OpportunityStage;
  value: number;
  probability: number;
  closeDate: string;
};

export type Opportunity = OpportunityBase & {
  id: string;
  createdAt: string;
  updatedAt?: string | null;
};

export type OpportunityCreateInput = OpportunityBase & {
  createdAt?: string;
  updatedAt?: string | null;
};

export type OpportunityUpdateInput = Partial<OpportunityBase> & {
  updatedAt?: string | null;
};

export const ACTIVITY_TYPES = ["call", "email", "meeting", "task"] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type ActivityBase = {
  type: ActivityType;
  subject: string;
  date: string;
  relatedTo: string;
};

export type Activity = ActivityBase & {
  id: string;
  createdAt: string;
  updatedAt?: string | null;
};

export type ActivityCreateInput = Omit<ActivityBase, "date"> & { date?: string };

export type ActivityUpdateInput = Partial<ActivityBase> & {
  date?: string;
  updatedAt?: string | null;
};

export const CRM_ROLES = ["admin", "sales_manager", "sales_rep", "support", "viewer"] as const;
export type CRMRole = (typeof CRM_ROLES)[number];
  createdAt: string;
};

export type OpportunityStage =
  | "qualification"
  | "proposal"
  | "negotiation"
  | "closedWon"
  | "closedLost";

export type Opportunity = {
  id: string;
  accountId: string;
  title: string;
  stage: OpportunityStage;
  value: number;
  probability: number;
  closeDate: string;
};

export type ActivityType = "call" | "email" | "meeting" | "task";

export type Activity = {
  id: string;
  type: ActivityType;
  subject: string;
  date: string;
  relatedTo: string;
};

