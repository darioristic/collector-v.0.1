import { randomUUID } from "node:crypto";

import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

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
  LeadListFilters,
  LeadListResult,
  LeadUpdateInput,
  Opportunity,
  OpportunityCreateInput,
  OpportunityUpdateInput
} from "@crm/types";

/**
 * Interfejs za CRM servis koji upravlja leads, opportunities i aktivnostima.
 * 
 * CRM servis omogućava:
 * - Upravljanje leadovima (potencijalnim klijentima)
 * - Upravljanje prodajnim prilikama (opportunities)
 * - Upravljanje aktivnostima povezanim sa klijentima
 */
export interface CRMService {
  /**
   * Vraća listu leadova sa filtriranjem i paginacijom na DB nivou.
   * 
   * @param filters - Filteri za filtriranje i paginaciju
   * @returns Promise koji se razrešava u LeadListResult sa paginacijom
   */
  listLeads(filters?: LeadListFilters): Promise<LeadListResult>;
  
  /**
   * Vraća lead po ID-u.
   * 
   * @param id - UUID leada
   * @returns Promise koji se razrešava u lead ili undefined ako nije pronađen
   */
  getLead(id: string): Promise<Lead | undefined>;
  
  /**
   * Kreira novi lead.
   * 
   * @param input - Podaci za kreiranje leada
   * @returns Promise koji se razrešava u kreirani lead
   */
  createLead(input: LeadCreateInput): Promise<Lead>;
  
  /**
   * Ažurira postojeći lead.
   * 
   * @param id - UUID leada
   * @param input - Podaci za ažuriranje (parcijalni)
   * @returns Promise koji se razrešava u ažurirani lead ili undefined ako nije pronađen
   */
  updateLead(id: string, input: LeadUpdateInput): Promise<Lead | undefined>;
  
  /**
   * Briše lead iz sistema.
   * 
   * @param id - UUID leada
   * @returns Promise koji se razrešava u true ako je uspešno obrisan, false inače
   */
  deleteLead(id: string): Promise<boolean>;

  /**
   * Vraća listu svih prodajnih prilika sortiranih po datumu kreiranja (najnovije prve).
   * 
   * @returns Promise koji se razrešava u niz prodajnih prilika
   */
  listOpportunities(): Promise<Opportunity[]>;
  
  /**
   * Vraća prodajnu priliku po ID-u.
   * 
   * @param id - UUID prodajne prilike
   * @returns Promise koji se razrešava u prodajnu priliku ili undefined ako nije pronađena
   */
  getOpportunity(id: string): Promise<Opportunity | undefined>;
  
  /**
   * Kreira novu prodajnu priliku.
   * 
   * @param input - Podaci za kreiranje prodajne prilike
   * @returns Promise koji se razrešava u kreiranu prodajnu priliku
   */
  createOpportunity(input: OpportunityCreateInput): Promise<Opportunity>;
  
  /**
   * Ažurira postojeću prodajnu priliku.
   * 
   * @param id - UUID prodajne prilike
   * @param input - Podaci za ažuriranje (parcijalni)
   * @returns Promise koji se razrešava u ažuriranu prodajnu priliku ili undefined ako nije pronađena
   */
  updateOpportunity(id: string, input: OpportunityUpdateInput): Promise<Opportunity | undefined>;
  
  /**
   * Briše prodajnu priliku iz sistema.
   * 
   * @param id - UUID prodajne prilike
   * @returns Promise koji se razrešava u true ako je uspešno obrisana, false inače
   */
  deleteOpportunity(id: string): Promise<boolean>;

  /**
   * Vraća listu svih aktivnosti sortiranih po due date i datumu kreiranja.
   * 
   * @returns Promise koji se razrešava u niz aktivnosti
   */
  listActivities(): Promise<Activity[]>;
  
  /**
   * Vraća aktivnost po ID-u sa informacijama o klijentu i dodeljenom korisniku.
   * 
   * @param id - UUID aktivnosti
   * @returns Promise koji se razrešava u aktivnost ili undefined ako nije pronađena
   */
  getActivity(id: string): Promise<Activity | undefined>;
  
  /**
   * Kreira novu aktivnost povezanu sa klijentom.
   * 
   * @param input - Podaci za kreiranje aktivnosti
   * @returns Promise koji se razrešava u kreiranu aktivnost
   */
  createActivity(input: ActivityCreateInput): Promise<Activity>;
  
  /**
   * Ažurira postojeću aktivnost.
   * 
   * @param id - UUID aktivnosti
   * @param input - Podaci za ažuriranje (parcijalni)
   * @returns Promise koji se razrešava u ažuriranu aktivnost ili undefined ako nije pronađena
   */
  updateActivity(id: string, input: ActivityUpdateInput): Promise<Activity | undefined>;
  
  /**
   * Briše aktivnost iz sistema.
   * 
   * @param id - UUID aktivnosti
   * @returns Promise koji se razrešava u true ako je uspešno obrisana, false inače
   */
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

/**
 * Drizzle implementacija CRM servisa.
 * 
 * Koristi Drizzle ORM za pristup bazi podataka i automatski mapira
 * rezultate u tipizovane objekte sa validacijom enum vrednosti.
 */
class DrizzleCRMService implements CRMService {
  /**
   * Kreira novu instancu DrizzleCRMService-a.
   * 
   * @param database - Drizzle database instanca (podrazumevano: globalna db)
   * @param cache - Cache service instance (opcionalno)
   */
  constructor(
    private readonly database: CRMDatabase = db,
    private readonly cache?: import("../../lib/cache.service").CacheService
  ) {}

  async listLeads(filters?: LeadListFilters): Promise<LeadListResult> {
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;

    // Build WHERE conditions
    const whereConditions = [];

    if (filters?.status) {
      whereConditions.push(eq(leads.status, filters.status));
    }

    if (filters?.source) {
      whereConditions.push(ilike(leads.source, `%${filters.source}%`));
    }

    if (filters?.search) {
      whereConditions.push(
        or(
          ilike(leads.name, `%${filters.search}%`),
          ilike(leads.email, `%${filters.search}%`)
        )
      );
    }

    // Build query with join for assignee (owner) and count(*) over() for total count
    let query = this.database
      .select({
        lead: leads,
        assignee: users,
        totalCount: sql<number>`count(*) over()`.as('totalCount')
      })
      .from(leads)
      .leftJoin(users, eq(leads.ownerId, users.id));

    // Apply WHERE clause if we have conditions
    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Apply ORDER BY, LIMIT, and OFFSET
    const results = await query
      .orderBy(desc(leads.createdAt))
      .limit(limit)
      .offset(offset);

    // Extract total count from first row (all rows have same totalCount)
    const totalCount = results[0]?.totalCount ?? 0;

    // Map results to Lead objects
    const data = results.map((r) => mapLeadRow(r.lead));

    return {
      data,
      pagination: {
        total: totalCount,
        limit,
        offset
      }
    };
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
    // Get current lead to check if status is changing to "qualified"
    const [currentLead] = await this.database
      .select()
      .from(leads)
      .where(eq(leads.id, id))
      .limit(1);

    if (!currentLead) {
      return undefined;
    }

    const wasQualified = currentLead.status === "qualified";
    const willBeQualified = input.status === "qualified";

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

    if (!updated) {
      return undefined;
    }

    // Automatically create Opportunity when lead status changes to "qualified"
    if (!wasQualified && willBeQualified && updated.accountId) {
      try {
        const opportunityTitle = updated.name || updated.email || `Opportunity for ${updated.email}`;
        
        await this.createOpportunity({
          accountId: updated.accountId,
          leadId: updated.id,
          title: opportunityTitle,
          stage: "qualification",
          value: 0,
          probability: 50,
          closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          ownerId: updated.ownerId ?? undefined
        });
      } catch (error) {
        // Log error but don't fail the lead update
        console.error("Failed to automatically create opportunity for qualified lead:", error);
      }
    }

    return mapLeadRow(updated);
  }

  async deleteLead(id: string): Promise<boolean> {
    const deleted = await this.database.delete(leads).where(eq(leads.id, id)).returning();

    return deleted.length > 0;
  }

  async listOpportunities(): Promise<Opportunity[]> {
    const cacheKey = "crm:opportunities:list";
    
    if (this.cache) {
      const cached = await this.cache.get<Opportunity[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const rows = await this.database.select().from(opportunities).orderBy(desc(opportunities.createdAt));
    const result = rows.map(mapOpportunityRow);

    if (this.cache) {
      await this.cache.set(cacheKey, result, { ttl: 300 }); // 5 minutes
    }

    return result;
  }

  async getOpportunity(id: string): Promise<Opportunity | undefined> {
    const [row] = await this.database
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, id))
      .limit(1);

    return row ? mapOpportunityRow(row) : undefined;
  }

  async createOpportunity(input: OpportunityCreateInput & { leadId?: string; ownerId?: string }): Promise<Opportunity> {
    const createdAt = input.createdAt ? new Date(input.createdAt) : new Date();
    const updatedAt = input.updatedAt ? new Date(input.updatedAt) : createdAt;

    const [created] = await this.database
      .insert(opportunities)
      .values({
        id: randomUUID(),
        accountId: input.accountId,
        leadId: input.leadId ?? null,
        ownerId: input.ownerId ?? null,
        title: input.title,
        stage: input.stage,
        value: input.value.toString(),
        probability: input.probability.toString(),
        closeDate: input.closeDate ? new Date(input.closeDate) : null,
        createdAt,
        updatedAt
      })
      .returning();

    const result = mapOpportunityRow(created);

    // Invalidate cache
    if (this.cache) {
      await this.cache.delete("crm:opportunities:list");
    }

    return result;
  }

  async updateOpportunity(
    id: string,
    input: OpportunityUpdateInput
  ): Promise<Opportunity | undefined> {
    // Invalidate cache before update
    if (this.cache) {
      await this.cache.delete("crm:opportunities:list");
    }
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
    const cacheKey = "crm:activities:list";
    
    if (this.cache) {
      const cached = await this.cache.get<Activity[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

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

    const result = rows.map(mapClientActivityRow);

    if (this.cache) {
      await this.cache.set(cacheKey, result, { ttl: 300 }); // 5 minutes
    }

    return result;
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
    // Invalidate cache before create
    if (this.cache) {
      await this.cache.delete("crm:activities:list");
    }

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
    // Invalidate cache before update
    if (this.cache) {
      await this.cache.delete("crm:activities:list");
    }
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

/**
 * Factory funkcija za kreiranje CRMService instance.
 * 
 * @param database - Opciona database instanca (podrazumevano: globalna db)
 * @returns Nova CRMService instanca
 */
export const createCRMService = (
  database: CRMDatabase = db,
  cache?: import("../../lib/cache.service").CacheService
): CRMService => {
  return new DrizzleCRMService(database, cache);
};

declare module "fastify" {
  interface FastifyInstance {
    crmService: CRMService;
  }

  interface FastifyRequest {
    crmService: CRMService;
  }
}



