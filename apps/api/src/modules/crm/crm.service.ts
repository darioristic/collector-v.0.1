import { randomUUID } from "node:crypto";

import type { Database } from "better-sqlite3";

import { getDatabase } from "../../lib/database";
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

const isoNow = () => new Date().toISOString();

const mapLeadRow = (row: any): Lead => ({
  id: row.id,
  name: row.name,
  email: row.email,
  status: row.status,
  source: row.source,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? null
});

const mapOpportunityRow = (row: any): Opportunity => ({
  id: row.id,
  accountId: row.account_id,
  title: row.title,
  stage: row.stage,
  value: row.value,
  probability: row.probability,
  closeDate: row.close_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? null
});

const mapActivityRow = (row: any): Activity => ({
  id: row.id,
  type: row.type,
  subject: row.subject,
  date: row.date,
  relatedTo: row.related_to,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? null
});

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

class SqliteCRMService implements CRMService {
  constructor(private readonly db: Database) {}

  async listLeads(): Promise<Lead[]> {
    const rows = this.db
      .prepare(
        `SELECT id, name, email, status, source, created_at, updated_at
         FROM leads
         ORDER BY datetime(created_at) DESC`
      )
      .all();

    return rows.map(mapLeadRow);
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const row = this.db
      .prepare(
        `SELECT id, name, email, status, source, created_at, updated_at
         FROM leads
         WHERE id = ?`
      )
      .get(id);

    return row ? mapLeadRow(row) : undefined;
  }

  async createLead(input: LeadCreateInput): Promise<Lead> {
    const id = `lead_${randomUUID()}`;
    const createdAt = input.createdAt ?? isoNow();
    const updatedAt = input.updatedAt ?? null;

    this.db
      .prepare(
        `INSERT INTO leads (id, name, email, status, source, created_at, updated_at)
         VALUES (@id, @name, @email, @status, @source, @createdAt, @updatedAt)`
      )
      .run({
        id,
        name: input.name,
        email: input.email,
        status: input.status,
        source: input.source,
        createdAt,
        updatedAt
      });

    return {
      id,
      name: input.name,
      email: input.email,
      status: input.status,
      source: input.source,
      createdAt,
      updatedAt
    };
  }

  async updateLead(id: string, input: LeadUpdateInput): Promise<Lead | undefined> {
    const existing = await this.getLead(id);

    if (!existing) {
      return undefined;
    }

    const updated: Lead = {
      ...existing,
      ...input,
      updatedAt: input.updatedAt ?? isoNow()
    };

    this.db
      .prepare(
        `UPDATE leads
         SET name = @name,
             email = @email,
             status = @status,
             source = @source,
             updated_at = @updatedAt
         WHERE id = @id`
      )
      .run({
        id,
        name: updated.name,
        email: updated.email,
        status: updated.status,
        source: updated.source,
        updatedAt: updated.updatedAt
      });

    return updated;
  }

  async deleteLead(id: string): Promise<boolean> {
    const result = this.db.prepare(`DELETE FROM leads WHERE id = ?`).run(id);
    return result.changes > 0;
  }

  async listOpportunities(): Promise<Opportunity[]> {
    const rows = this.db
      .prepare(
        `SELECT id, account_id, title, stage, value, probability, close_date, created_at, updated_at
         FROM opportunities
         ORDER BY datetime(created_at) DESC`
      )
      .all();

    return rows.map(mapOpportunityRow);
  }

  async getOpportunity(id: string): Promise<Opportunity | undefined> {
    const row = this.db
      .prepare(
        `SELECT id, account_id, title, stage, value, probability, close_date, created_at, updated_at
         FROM opportunities
         WHERE id = ?`
      )
      .get(id);

    return row ? mapOpportunityRow(row) : undefined;
  }

  async createOpportunity(input: OpportunityCreateInput): Promise<Opportunity> {
    const id = `opp_${randomUUID()}`;
    const createdAt = input.createdAt ?? isoNow();
    const updatedAt = input.updatedAt ?? null;

    this.db
      .prepare(
        `INSERT INTO opportunities (
            id,
            account_id,
            title,
            stage,
            value,
            probability,
            close_date,
            created_at,
            updated_at
         )
         VALUES (
           @id,
           @accountId,
           @title,
           @stage,
           @value,
           @probability,
           @closeDate,
           @createdAt,
           @updatedAt
         )`
      )
      .run({
        id,
        accountId: input.accountId,
        title: input.title,
        stage: input.stage,
        value: input.value,
        probability: input.probability,
        closeDate: input.closeDate,
        createdAt,
        updatedAt
      });

    return {
      id,
      accountId: input.accountId,
      title: input.title,
      stage: input.stage,
      value: input.value,
      probability: input.probability,
      closeDate: input.closeDate,
      createdAt,
      updatedAt
    };
  }

  async updateOpportunity(
    id: string,
    input: OpportunityUpdateInput
  ): Promise<Opportunity | undefined> {
    const existing = await this.getOpportunity(id);

    if (!existing) {
      return undefined;
    }

    const updated: Opportunity = {
      ...existing,
      ...input,
      updatedAt: input.updatedAt ?? isoNow()
    };

    this.db
      .prepare(
        `UPDATE opportunities
         SET account_id = @accountId,
             title = @title,
             stage = @stage,
             value = @value,
             probability = @probability,
             close_date = @closeDate,
             updated_at = @updatedAt
         WHERE id = @id`
      )
      .run({
        id,
        accountId: updated.accountId,
        title: updated.title,
        stage: updated.stage,
        value: updated.value,
        probability: updated.probability,
        closeDate: updated.closeDate,
        updatedAt: updated.updatedAt
      });

    return updated;
  }

  async deleteOpportunity(id: string): Promise<boolean> {
    const result = this.db.prepare(`DELETE FROM opportunities WHERE id = ?`).run(id);
    return result.changes > 0;
  }

  async listActivities(): Promise<Activity[]> {
    const rows = this.db
      .prepare(
        `SELECT id, type, subject, date, related_to, created_at, updated_at
         FROM activities
         ORDER BY datetime(date) DESC`
      )
      .all();

    return rows.map(mapActivityRow);
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    const row = this.db
      .prepare(
        `SELECT id, type, subject, date, related_to, created_at, updated_at
         FROM activities
         WHERE id = ?`
      )
      .get(id);

    return row ? mapActivityRow(row) : undefined;
  }

  async createActivity(input: ActivityCreateInput): Promise<Activity> {
    const id = `act_${randomUUID()}`;
    const createdAt = isoNow();
    const updatedAt = input.updatedAt ?? null;
    const date = input.date ?? isoNow();

    this.db
      .prepare(
        `INSERT INTO activities (id, type, subject, date, related_to, created_at, updated_at)
         VALUES (@id, @type, @subject, @date, @relatedTo, @createdAt, @updatedAt)`
      )
      .run({
        id,
        type: input.type,
        subject: input.subject,
        date,
        relatedTo: input.relatedTo,
        createdAt,
        updatedAt
      });

    return {
      id,
      type: input.type,
      subject: input.subject,
      date,
      relatedTo: input.relatedTo,
      createdAt,
      updatedAt
    };
  }

  async updateActivity(id: string, input: ActivityUpdateInput): Promise<Activity | undefined> {
    const existing = await this.getActivity(id);

    if (!existing) {
      return undefined;
    }

    const updated: Activity = {
      ...existing,
      ...input,
      date: input.date ?? existing.date,
      updatedAt: input.updatedAt ?? isoNow()
    };

    this.db
      .prepare(
        `UPDATE activities
         SET type = @type,
             subject = @subject,
             date = @date,
             related_to = @relatedTo,
             updated_at = @updatedAt
         WHERE id = @id`
      )
      .run({
        id,
        type: updated.type,
        subject: updated.subject,
        date: updated.date,
        relatedTo: updated.relatedTo,
        updatedAt: updated.updatedAt
      });

    return updated;
  }

  async deleteActivity(id: string): Promise<boolean> {
    const result = this.db.prepare(`DELETE FROM activities WHERE id = ?`).run(id);
    return result.changes > 0;
  }
}

export const createCRMService = (db: Database = getDatabase()): CRMService => {
  return new SqliteCRMService(db);
};

declare module "fastify" {
  interface FastifyInstance {
    crmService: CRMService;
  }

  interface FastifyRequest {
    crmService: CRMService;
  }
}



