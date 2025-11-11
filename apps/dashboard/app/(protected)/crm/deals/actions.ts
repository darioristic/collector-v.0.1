"use server";

import { db } from "@/lib/db";
import { deals, type Deal } from "@/lib/db/schema/deals";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { DEAL_STAGES, type DealStage } from "./constants";
import {
  dealFiltersSchema,
  dealFormSchema,
  dealUpdateSchema,
  stageUpdateSchema,
  type DealFiltersValues,
  type DealFormValues,
} from "./schemas";

export type { DealStage } from "./constants";

export interface DealStageSummary {
  stage: DealStage;
  count: number;
}

export type DealInput = DealFormValues;
export type DealFilters = DealFiltersValues;

const revalidateDeals = () => revalidatePath("/crm/deals");

export async function fetchDeals(params?: DealFilters) {
  const filters = dealFiltersSchema.parse(params);

  const conditions = [];

  if (filters?.stage) {
    conditions.push(eq(deals.stage, filters.stage));
  }

  if (filters?.owner) {
    conditions.push(eq(deals.owner, filters.owner));
  }

  if (filters?.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(
      or(ilike(deals.title, pattern), ilike(deals.company, pattern), ilike(deals.owner, pattern)),
    );
  }

  const baseQuery = db.select().from(deals);
  const query =
    conditions.length === 0
      ? baseQuery
      : baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions));

  const rows = await query.orderBy(desc(deals.updatedAt), desc(deals.createdAt));

  return rows;
}

export async function fetchDealMetadata() {
  const ownersPromise = db
    .select({ owner: deals.owner })
    .from(deals)
    .groupBy(deals.owner)
    .orderBy(deals.owner);

  const countsPromise = db
    .select({
      stage: deals.stage,
      total: count(deals.id),
    })
    .from(deals)
    .groupBy(deals.stage);

  const [owners, stageCounts] = await Promise.all([ownersPromise, countsPromise]);

  const normalizedStages: DealStageSummary[] = DEAL_STAGES.map((stage) => ({
    stage,
    count: 0,
  }));

  stageCounts.forEach((item) => {
    const index = normalizedStages.findIndex((summary) => summary.stage === item.stage);
    if (index !== -1) {
      normalizedStages[index] = {
        stage: normalizedStages[index].stage,
        count: Number(item.total ?? 0),
      };
    }
  });

  return {
    owners: owners.map((item) => item.owner).filter(Boolean),
    stages: normalizedStages,
  };
}

export async function createDeal(input: DealFormValues) {
  const data = dealFormSchema.parse(input);

  const [deal] = await db
    .insert(deals)
    .values({
      title: data.title,
      company: data.company,
      owner: data.owner,
      stage: data.stage,
      value: Number(data.value),
      closeDate: data.closeDate ?? null,
      notes: data.notes ?? null,
    })
    .returning();

  revalidateDeals();

  return deal;
}

export async function updateDeal(id: string, input: Record<string, unknown>) {
  if (!id) {
    throw new Error("Deal id is required.");
  }

  const data = dealUpdateSchema.parse(input);

  const payload: Partial<Deal> = {
    ...data,
    value: data.value !== undefined ? Number(data.value) : undefined,
    closeDate:
      data.closeDate instanceof Date || data.closeDate === null ? data.closeDate : undefined,
    notes: data.notes ?? null,
    updatedAt: new Date(),
  };

  const [deal] = await db
    .update(deals)
    .set(payload)
    .where(eq(deals.id, id))
    .returning();

  revalidateDeals();

  return deal;
}

export async function deleteDeal(id: string) {
  if (!id) {
    throw new Error("Deal id is required.");
  }

  await db.delete(deals).where(eq(deals.id, id));

  revalidateDeals();
}

export async function updateDealStage(args: Record<string, unknown>) {
  const payload = stageUpdateSchema.parse(args);

  const [deal] = await db
    .update(deals)
    .set({ stage: payload.stage, updatedAt: new Date() })
    .where(eq(deals.id, payload.id))
    .returning();

  revalidateDeals();

  return deal;
}

export async function bulkUpdateDealStages(updates: Array<Record<string, unknown>>) {
  if (updates.length === 0) {
    return [];
  }

  const parsed = updates.map((item) => stageUpdateSchema.parse(item));

  const result = await db.transaction(async (tx) => {
    const updated: Deal[] = [];
    for (const item of parsed) {
      const [deal] = await tx
        .update(deals)
        .set({ stage: item.stage, updatedAt: new Date() })
        .where(eq(deals.id, item.id))
        .returning();
      if (deal) {
        updated.push(deal);
      }
    }
    return updated;
  });

  revalidateDeals();

  return result;
}

