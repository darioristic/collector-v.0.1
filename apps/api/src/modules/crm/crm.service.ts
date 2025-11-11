import { randomUUID } from "node:crypto";

import { desc, eq } from "drizzle-orm";

import { db } from "../../db";
import {
  accounts,
  clientActivities,
  clientActivityPriorityEnum,
  clientActivityStatusEnum,
  clientActivityTypeEnum,
  leadStatusEnum,
  leads,
  opportunityStageEnum,
  opportunities,
  users
} from "../../db/schema";
import type {
  Activity,
  ActivityCreateInput,
  ActivityUpdateInput,
  Lead,
  LeadCreateInput,
  LeadUpdateInput,
  Opportunity,
  OpportunityCreateInput,
  OpportunityUpdateInput
} from "@crm/types";

export interface CRMService {
  listLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(input: LeadCreateInput): Promise<Lead>;
  updateLead(id: string, input: LeadUpdateInput): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;

  listOpportunities(): Promise<Opportunity[]>;
  getOpportunity(id: string): Promise<Opportunity | undefined>;
  createOpportunity(input: OpportunityCreateInput): Promise<Opportunity>;
  updateOpportunity(id: string, input: OpportunityUpdateInput): Promise<Opportunity | undefined>;
  deleteOpportunity(id: string): Promise<boolean>;

  listActivities(): Promise<Activity[]>;
  getActivity(id: string): Promise<Activity | undefined>;
  createActivity(input: ActivityCreateInput): Promise<Activity>;
  updateActivity(id: string, input: ActivityUpdateInput): Promise<Activity | undefined>;
  deleteActivity(id: string): Promise<boolean>;
}

type CRMDatabase = typeof db;

const toIsoString = (value: Date | string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
};

const ensureEnumValue = <T extends readonly string[]>(value: string, options: T): T[number] => {
  return options.includes(value as T[number]) ? (value as T[number]) : options[0];
};

const mapLeadRow = (row: typeof leads.$inferSelect): Lead => ({
  id: row.id,
  name: row.name,
  email: row.email,
  status: ensureEnumValue(row.status, leadStatusEnum.enumValues),
  source: row.source ?? "",
  createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(row.updatedAt)
});

const mapOpportunityRow = (row: typeof opportunities.$inferSelect): Opportunity => ({
  id: row.id,
  accountId: row.accountId,
  title: row.title,
  stage: ensureEnumValue(row.stage, opportunityStageEnum.enumValues),
  value: Number(row.value ?? 0),
  probability: Number(row.probability ?? 0),
  closeDate: toIsoString(row.closeDate) ?? new Date().toISOString(),
  createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(row.updatedAt)
});

type ClientActivityRow = {
  activity: typeof clientActivities.$inferSelect;
  account: typeof accounts.$inferSelect | null;
  assignee: typeof users.$inferSelect | null;
};

const mapClientActivityRow = (row: ClientActivityRow): Activity => ({
  id: row.activity.id,
  title: row.activity.title,
  clientId: row.activity.clientId,
  clientName: row.account?.name ?? "Unknown Client",
  assignedTo: row.activity.assignedTo ?? null,
  assignedToName: row.assignee?.name ?? null,
  assignedToEmail: row.assignee?.email ?? null,
  type: ensureEnumValue(row.activity.type, clientActivityTypeEnum.enumValues),
  dueDate: toIsoString(row.activity.dueDate) ?? new Date().toISOString(),
  status: ensureEnumValue(row.activity.status, clientActivityStatusEnum.enumValues),
  priority: ensureEnumValue(row.activity.priority, clientActivityPriorityEnum.enumValues),
  notes: row.activity.notes ?? null,
  createdAt: toIsoString(row.activity.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(row.activity.updatedAt) ?? new Date().toISOString()
});

class DrizzleCRMService implements CRMService {
  constructor(private readonly database: CRMDatabase = db) {}

  async listLeads(): Promise<Lead[]> {
    const rows = await this.database.select().from(leads).orderBy(desc(leads.createdAt));
    return rows.map(mapLeadRow);
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [row] = await this.database.select().from(leads).where(eq(leads.id, id)).limit(1);
    return row ? mapLeadRow(row) : undefined;
  }

  async createLead(input: LeadCreateInput): Promise<Lead> {
    const createdAt = input.createdAt ? new Date(input.createdAt) : new Date();
    const updatedAt = input.updatedAt ? new Date(input.updatedAt) : createdAt;

    const [created] = await this.database
      .insert(leads)
      .values({
        id: randomUUID(),
        name: input.name,
        email: input.email,
        status: input.status,
        source: input.source,
        createdAt,
        updatedAt
      })
      .returning();

    return mapLeadRow(created);
  }

  async updateLead(id: string, input: LeadUpdateInput): Promise<Lead | undefined> {
    const payload: Partial<typeof leads.$inferInsert> = {
      updatedAt: input.updatedAt ? new Date(input.updatedAt) : new Date()
    };

    if (typeof input.name !== "undefined") {
      payload.name = input.name;
    }

    if (typeof input.email !== "undefined") {
      payload.email = input.email;
    }

    if (typeof input.status !== "undefined") {
      payload.status = input.status;
    }

    if (typeof input.source !== "undefined") {
      payload.source = input.source;
    }

    const [updated] = await this.database
      .update(leads)
      .set(payload)
      .where(eq(leads.id, id))
      .returning();

    return updated ? mapLeadRow(updated) : undefined;
  }

  async deleteLead(id: string): Promise<boolean> {
    const deleted = await this.database.delete(leads).where(eq(leads.id, id)).returning();

    return deleted.length > 0;
  }

  async listOpportunities(): Promise<Opportunity[]> {
    const rows = await this.database.select().from(opportunities).orderBy(desc(opportunities.createdAt));
    return rows.map(mapOpportunityRow);
  }

  async getOpportunity(id: string): Promise<Opportunity | undefined> {
    const [row] = await this.database
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, id))
      .limit(1);

    return row ? mapOpportunityRow(row) : undefined;
  }

  async createOpportunity(input: OpportunityCreateInput): Promise<Opportunity> {
    const createdAt = input.createdAt ? new Date(input.createdAt) : new Date();
    const updatedAt = input.updatedAt ? new Date(input.updatedAt) : createdAt;

    const [created] = await this.database
      .insert(opportunities)
      .values({
        id: randomUUID(),
        accountId: input.accountId,
        title: input.title,
        stage: input.stage,
        value: input.value.toString(),
        probability: input.probability.toString(),
        closeDate: input.closeDate ? new Date(input.closeDate) : null,
        createdAt,
        updatedAt
      })
      .returning();

    return mapOpportunityRow(created);
  }

  async updateOpportunity(
    id: string,
    input: OpportunityUpdateInput
  ): Promise<Opportunity | undefined> {
    const payload: Partial<typeof opportunities.$inferInsert> = {
      updatedAt: input.updatedAt ? new Date(input.updatedAt) : new Date()
    };

    if (typeof input.accountId !== "undefined") {
      payload.accountId = input.accountId;
    }

    if (typeof input.title !== "undefined") {
      payload.title = input.title;
    }

    if (typeof input.stage !== "undefined") {
      payload.stage = input.stage;
    }

    if (typeof input.value !== "undefined") {
      payload.value = input.value.toString();
    }

    if (typeof input.probability !== "undefined") {
      payload.probability = input.probability.toString();
    }

    if (typeof input.closeDate !== "undefined") {
      payload.closeDate = input.closeDate ? new Date(input.closeDate) : null;
    }

    const [updated] = await this.database
      .update(opportunities)
      .set(payload)
      .where(eq(opportunities.id, id))
      .returning();

    return updated ? mapOpportunityRow(updated) : undefined;
  }

  async deleteOpportunity(id: string): Promise<boolean> {
    const deleted = await this.database.delete(opportunities).where(eq(opportunities.id, id)).returning();

    return deleted.length > 0;
  }

  async listActivities(): Promise<Activity[]> {
    const rows = await this.database
      .select({
        activity: clientActivities,
        account: accounts,
        assignee: users
      })
      .from(clientActivities)
      .leftJoin(accounts, eq(clientActivities.clientId, accounts.id))
      .leftJoin(users, eq(clientActivities.assignedTo, users.id))
      .orderBy(desc(clientActivities.dueDate), desc(clientActivities.createdAt));

    return rows.map(mapClientActivityRow);
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    const [row] = await this.database
      .select({
        activity: clientActivities,
        account: accounts,
        assignee: users
      })
      .from(clientActivities)
      .leftJoin(accounts, eq(clientActivities.clientId, accounts.id))
      .leftJoin(users, eq(clientActivities.assignedTo, users.id))
      .where(eq(clientActivities.id, id))
      .limit(1);

    return row ? mapClientActivityRow(row) : undefined;
  }

  async createActivity(input: ActivityCreateInput): Promise<Activity> {
    const now = new Date();
    const dueDate = new Date(input.dueDate);

    const [created] = await this.database
      .insert(clientActivities)
      .values({
        id: randomUUID(),
        title: input.title,
        clientId: input.clientId,
        assignedTo: input.assignedTo ?? null,
        type: input.type ?? clientActivityTypeEnum.enumValues[0],
        dueDate,
        status: input.status ?? clientActivityStatusEnum.enumValues[0],
        priority: input.priority ?? clientActivityPriorityEnum.enumValues[1],
        notes: input.notes ?? null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    const createdId = created.id;
    return this.getActivity(createdId).then((activity) => {
      if (!activity) {
        throw new Error("Failed to create activity");
      }

      return activity;
    });
  }

  async updateActivity(id: string, input: ActivityUpdateInput): Promise<Activity | undefined> {
    const payload: Partial<typeof clientActivities.$inferInsert> = {
      updatedAt: new Date()
    };

    if (typeof input.title !== "undefined") {
      payload.title = input.title;
    }

    if (typeof input.clientId !== "undefined") {
      payload.clientId = input.clientId;
    }

    if (typeof input.assignedTo !== "undefined") {
      payload.assignedTo = input.assignedTo;
    }

    if (typeof input.type !== "undefined") {
      payload.type = input.type;
    }

    if (typeof input.dueDate !== "undefined") {
      payload.dueDate = new Date(input.dueDate);
    }

    if (typeof input.status !== "undefined") {
      payload.status = input.status;
    }

    if (typeof input.priority !== "undefined") {
      payload.priority = input.priority;
    }

    if (typeof input.notes !== "undefined") {
      payload.notes = input.notes ?? null;
    }

    const [updated] = await this.database
      .update(clientActivities)
      .set(payload)
      .where(eq(clientActivities.id, id))
      .returning();

    if (!updated) {
      return undefined;
    }

    return this.getActivity(updated.id);
  }

  async deleteActivity(id: string): Promise<boolean> {
    const deleted = await this.database.delete(clientActivities).where(eq(clientActivities.id, id)).returning();

    return deleted.length > 0;
  }
}

export const createCRMService = (database: CRMDatabase = db): CRMService => {
  return new DrizzleCRMService(database);
};

declare module "fastify" {
  interface FastifyInstance {
    crmService: CRMService;
  }

  interface FastifyRequest {
    crmService: CRMService;
  }
}



