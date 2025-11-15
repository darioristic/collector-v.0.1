"use server";

import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { type Deal, deals } from "@/lib/db/schema/deals";
import { getApiUrl, ensureResponse } from "@/src/lib/fetch-utils";
import type { OrderCreateInput } from "@crm/types";

import { DEAL_STAGES, type DealStage } from "./constants";
import {
	type DealFiltersValues,
	type DealFormValues,
	dealFiltersSchema,
	dealFormSchema,
	dealUpdateSchema,
	stageUpdateSchema,
} from "./schemas";

export type { DealStage } from "./constants";

export interface DealStageSummary {
	stage: DealStage;
	count: number;
}

export type DealInput = DealFormValues;
export type DealFilters = DealFiltersValues;

const revalidateDeals = () => revalidatePath("/crm/deals");

const dbPromise = getDb();

export async function fetchDeals(params?: DealFilters) {
	const db = await dbPromise;
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
			or(
				ilike(deals.title, pattern),
				ilike(deals.company, pattern),
				ilike(deals.owner, pattern),
			),
		);
	}

	const baseQuery = db.select().from(deals);
	const query =
		conditions.length === 0
			? baseQuery
			: baseQuery.where(
					conditions.length === 1 ? conditions[0] : and(...conditions),
				);

	const rows = await query.orderBy(
		desc(deals.updatedAt),
		desc(deals.createdAt),
	);

	return rows;
}

export async function fetchDealMetadata() {
	const db = await dbPromise;
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

	const [owners, stageCounts] = await Promise.all([
		ownersPromise,
		countsPromise,
	]);

	const normalizedStages: DealStageSummary[] = DEAL_STAGES.map((stage) => ({
		stage,
		count: 0,
	}));

	stageCounts.forEach((item) => {
		const index = normalizedStages.findIndex(
			(summary) => summary.stage === item.stage,
		);
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
	const db = await dbPromise;
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
	const db = await dbPromise;
	if (!id) {
		throw new Error("Deal id is required.");
	}

	const data = dealUpdateSchema.parse(input);

	const payload: Partial<Deal> = {
		...data,
		value: data.value !== undefined ? Number(data.value) : undefined,
		closeDate:
			data.closeDate instanceof Date || data.closeDate === null
				? data.closeDate
				: undefined,
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
	const db = await dbPromise;
	if (!id) {
		throw new Error("Deal id is required.");
	}

	await db.delete(deals).where(eq(deals.id, id));

	revalidateDeals();
}

export async function updateDealStage(args: Record<string, unknown>) {
	const db = await dbPromise;
	const payload = stageUpdateSchema.parse(args);

	// Get current deal to check if stage is changing to "Closed Won"
	const [currentDeal] = await db
		.select()
		.from(deals)
		.where(eq(deals.id, payload.id))
		.limit(1);

	if (!currentDeal) {
		throw new Error("Deal not found");
	}

	const wasClosedWon = currentDeal.stage === "Closed Won";
	const willBeClosedWon = payload.stage === "Closed Won";

	const [deal] = await db
		.update(deals)
		.set({ stage: payload.stage, updatedAt: new Date() })
		.where(eq(deals.id, payload.id))
		.returning();

	if (!deal) {
		throw new Error("Failed to update deal");
	}

	revalidateDeals();

	// Automatically create Order when deal stage changes to "Closed Won"
	if (!wasClosedWon && willBeClosedWon) {
		try {
			await createOrderFromDeal(deal);
		} catch (error) {
			// Log error but don't fail the deal update
			console.error("Failed to automatically create order for closed won deal:", error);
		}
	}

	return deal;
}

export async function bulkUpdateDealStages(
	updates: Array<Record<string, unknown>>,
) {
	const db = await dbPromise;
	if (updates.length === 0) {
		return [];
	}

	const parsed = updates.map((item) => stageUpdateSchema.parse(item));

	const result = await db.transaction(async (tx) => {
		const updated: Deal[] = [];
		for (const item of parsed) {
			const [currentDeal] = await tx
				.select()
				.from(deals)
				.where(eq(deals.id, item.id))
				.limit(1);

			const wasClosedWon = currentDeal?.stage === "Closed Won";
			const willBeClosedWon = item.stage === "Closed Won";

			const [deal] = await tx
				.update(deals)
				.set({ stage: item.stage, updatedAt: new Date() })
				.where(eq(deals.id, item.id))
				.returning();
			
			if (deal) {
				updated.push(deal);

				// Automatically create Order when deal stage changes to "Closed Won"
				if (!wasClosedWon && willBeClosedWon) {
					try {
						await createOrderFromDeal(deal);
					} catch (error) {
						// Log error but don't fail the deal update
						console.error(`Failed to automatically create order for deal ${deal.id}:`, error);
					}
				}
			}
		}
		return updated;
	});

	revalidateDeals();

	return result;
}

/**
 * Helper function to create an Order from a Deal
 */
async function createOrderFromDeal(deal: Deal): Promise<void> {
	// Try to find account by company name
	let companyId: string | undefined;
	try {
		const accountsResponse = await fetch(getApiUrl("accounts"), {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		});

		if (accountsResponse.ok) {
			const accountsData = await accountsResponse.json();
			const account = Array.isArray(accountsData.data)
				? accountsData.data.find((acc: { name: string }) => 
						acc.name.toLowerCase() === deal.company.toLowerCase()
					)
				: null;
			
			if (account) {
				companyId = account.id;
			}
		}
	} catch (error) {
		console.warn("Failed to find account by company name:", error);
	}

	// Calculate totals from deal value (tax = 20%)
	const subtotal = deal.value;
	    const _tax = subtotal * 0.2;

	// Generate order number
	const orderNumber = `ORD-${Date.now()}-${deal.id.slice(0, 8).toUpperCase()}`;

	// Create order input
	const orderInput: OrderCreateInput = {
		orderNumber,
		companyId,
		orderDate: new Date().toISOString().split("T")[0],
		currency: "EUR",
		status: "pending",
		notes: `Auto-generated from deal: ${deal.title}`,
		items: [
			{
				description: deal.title,
				quantity: 1,
				unitPrice: subtotal,
			},
		],
	};

	// Create order via API
	const response = await ensureResponse(
		fetch(getApiUrl("sales/orders"), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(orderInput),
		}),
	);

	if (!response.ok) {
		throw new Error(`Failed to create order: ${response.statusText}`);
	}
}
