import { LEAD_STATUSES } from "@crm/types";
import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";

import { db as defaultDb } from "../index";
import { accounts } from "../schema/accounts.schema";
import { activities, clientActivities, crmNotes, deals, leads, opportunities } from "../schema/crm.schema";
import { users } from "../schema/settings.schema";

const formatSeedUuid = (value: number) =>
	`00000000-0000-0000-0000-${String(value).padStart(12, "0")}`;

const leadFirstNames = [
	"Jovana",
	"Marko",
	"Mina",
	"Nikola",
	"Petar",
	"Isidora",
	"Danilo",
	"Vuk",
	"Tijana",
	"Aleksa",
	"Luka",
	"Sara",
] as const;

const leadLastNames = [
	"Petrović",
	"Janković",
	"Ilić",
	"Kovačević",
	"Stanković",
	"Milić",
	"Đorđević",
	"Ristić",
	"Lazarević",
	"Radulović",
	"Mirković",
	"Simić",
] as const;

const leadSources = [
	"Website lead forma",
	"LinkedIn kampanja",
	"Preporuka partnera",
	"Email nurturing",
	"Industrijski događaj",
	"Webinar registracija",
	"Inbound poziv",
	"Outbound kampanja",
] as const;

const ACTIVITY_TYPES = ["call", "meeting", "task", "follow_up"] as const;
const ACTIVITY_PRIORITIES = ["high", "medium", "low"] as const;
const ACTIVITY_STATUSES = [
	"scheduled",
	"in_progress",
	"completed",
	"missed",
] as const;
const ACTIVITY_TITLES = [
	"Discovery Call",
	"Quarterly Review Meeting",
	"Send Updated Proposal",
	"Follow-up on Contract",
	"Implementation Kickoff",
	"Share Onboarding Materials",
	"Executive Alignment",
	"Renewal Preparation",
	"Check-in Call",
	"Schedule Product Demo",
	"Collect Feedback",
	"Confirm Budget Approval",
	"Draft Scope of Work",
	"Post-Meeting Summary",
	"Review Action Items",
] as const;

type LeadSeedEntry = {
	id: string;
	accountId: string | null;
	name: string;
	email: string;
	status: (typeof LEAD_STATUSES)[number];
	source: string;
	createdAt: Date;
	updatedAt: Date;
};

const buildLeadSeeds = (accountIds: string[]): LeadSeedEntry[] => {
	const baseDate = new Date(2025, 0, 15, 9, 0, 0);

	const count = parseInt(process.env.SEED_LEADS_COUNT || "50", 10);

	return Array.from({ length: count }, (_value, index) => {
		const firstName = leadFirstNames[index % leadFirstNames.length];
		const lastName = leadLastNames[(index * 3) % leadLastNames.length];
		const name = `${firstName} ${lastName}`;
		const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index + 1}@prospects.example`;
		const status = LEAD_STATUSES[index % LEAD_STATUSES.length];
		const source = leadSources[(index * 2) % leadSources.length];
		const accountId =
			accountIds.length > 0
				? (accountIds[index % accountIds.length] ?? null)
				: null;

		const createdAt = new Date(baseDate);
		createdAt.setDate(baseDate.getDate() - index);
		createdAt.setHours(9 + (index % 4), 15, 0, 0);

		const updatedAt = new Date(createdAt);
		updatedAt.setDate(createdAt.getDate() + (index % 6));
		updatedAt.setHours(14, (index % 4) * 10, 0, 0);

		return {
			id: formatSeedUuid(5000 + index),
			accountId,
			name,
			email,
			status,
			source,
			createdAt,
			updatedAt,
		};
	});
};

type ActivitySeedEntry = {
	id: string;
	title: string;
	clientId: string;
	assignedTo: string | null;
	type: (typeof ACTIVITY_TYPES)[number];
	dueDate: Date;
	status: (typeof ACTIVITY_STATUSES)[number];
	priority: (typeof ACTIVITY_PRIORITIES)[number];
	notes: string | null;
	createdAt: Date;
	updatedAt: Date;
};

const addDays = (date: Date, days: number) => {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
};

const buildActivitySeeds = (
	accountIds: string[],
	userIds: string[],
): ActivitySeedEntry[] => {
	const now = new Date();
	const rangeStart = addDays(now, -30);
	const rangeEnd = addDays(now, 60);

	return Array.from({ length: 60 }, (_value, index) => {
		const dueDate = faker.date.between({ from: rangeStart, to: rangeEnd });
		dueDate.setHours(8 + (index % 9), (index % 4) * 15, 0, 0);

		const createdAt = addDays(dueDate, -faker.number.int({ min: 2, max: 14 }));
		createdAt.setHours(9, 0, 0, 0);

		const updatedAt = addDays(createdAt, faker.number.int({ min: 0, max: 5 }));
		updatedAt.setHours(16, 0, 0, 0);

		return {
			id: faker.string.uuid(),
			title: faker.helpers.arrayElement(ACTIVITY_TITLES),
			clientId: faker.helpers.arrayElement(accountIds),
			assignedTo:
				userIds.length > 0 ? faker.helpers.arrayElement(userIds) : null,
			type: faker.helpers.arrayElement(ACTIVITY_TYPES),
			dueDate,
			status: faker.helpers.arrayElement(ACTIVITY_STATUSES),
			priority: faker.helpers.arrayElement(ACTIVITY_PRIORITIES),
			notes: index % 3 === 0 ? null : faker.lorem.sentence(),
			createdAt,
			updatedAt,
		};
	});
};

type DealSeedEntry = {
	id: string;
	title: string;
	company: string;
	owner: string;
	stage: "Lead" | "Qualified" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost";
	value: number;
	closeDate: Date;
	notes: string | null;
	createdAt: Date;
	updatedAt: Date;
};

const DEAL_STAGES: DealSeedEntry["stage"][] = [
	"Lead",
	"Qualified",
	"Proposal",
	"Negotiation",
	"Closed Won",
	"Closed Lost",
];

const buildDealSeeds = (
	accountsData: Array<{ id: string; name: string }>,
	owners: Array<{ name: string | null }>,
): DealSeedEntry[] => {
	const baseDate = new Date(2025, 2, 1, 10, 0, 0);

	return Array.from({ length: 50 }, (_value, index) => {
		const account = accountsData[index % accountsData.length];
		const ownerRecord = owners.length > 0 ? owners[index % owners.length] : null;
		const ownerName =
			ownerRecord?.name ??
			faker.helpers.arrayElement([
				"Milica Petrović",
				"Vladimir Ilić",
				"Maja Obradović",
				"Filip Ristić",
			]);

		const stage = DEAL_STAGES[index % DEAL_STAGES.length];
		const valueBase = 15000 + index * 750 + faker.number.int({ min: 0, max: 5000 });
		const createdAt = new Date(baseDate);
		createdAt.setDate(baseDate.getDate() - index);
		createdAt.setHours(9 + (index % 5), (index % 3) * 20, 0, 0);

		const closeDate = new Date(createdAt);
		closeDate.setDate(closeDate.getDate() + 30 + (index % 12));
		closeDate.setHours(15, (index % 4) * 10, 0, 0);

		const updatedAt = new Date(closeDate);
		updatedAt.setDate(updatedAt.getDate() - (index % 10));
		updatedAt.setHours(11 + (index % 4), (index % 6) * 5, 0, 0);

		return {
			id: formatSeedUuid(8000 + index),
			title: `${account.name} - strateški ugovor #${index + 1}`,
			company: account.name,
			owner: ownerName,
			stage,
			value: Number(valueBase.toFixed(2)),
			closeDate,
			notes:
				index % 4 === 0
					? null
					: faker.helpers.arrayElement([
							"Potrebno dostaviti finalnu ponudu.",
							"Kupac traži dodatnu prezentaciju rešenja.",
							"Pregovaramo o roku implementacije.",
							"Čeka se potvrda budžeta od finansija.",
					  ]),
			createdAt,
			updatedAt,
		};
	});
};

export const seedCrm = async (database = defaultDb) => {
	await database.execute(sql`
		DO $$
		BEGIN
			CREATE TYPE "deal_stage" AS ENUM (
				'Lead',
				'Qualified',
				'Proposal',
				'Negotiation',
				'Closed Won',
				'Closed Lost'
			);
		EXCEPTION
			WHEN duplicate_object THEN NULL;
		END $$;
	`);

	await database.execute(sql`
		CREATE TABLE IF NOT EXISTS "deals" (
			"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
			"title" text NOT NULL,
			"company" text NOT NULL,
			"owner" text NOT NULL,
			"stage" "deal_stage" NOT NULL,
			"value" double precision NOT NULL DEFAULT 0,
			"close_date" timestamptz,
			"notes" text,
			"created_at" timestamptz NOT NULL DEFAULT now(),
			"updated_at" timestamptz NOT NULL DEFAULT now()
		);
	`);

	await database.execute(sql`
		CREATE INDEX IF NOT EXISTS "deals_stage_idx" ON "deals" ("stage");
	`);
	await database.execute(sql`
		CREATE INDEX IF NOT EXISTS "deals_owner_idx" ON "deals" ("owner");
	`);
	await database.execute(sql`
		CREATE INDEX IF NOT EXISTS "deals_created_idx" ON "deals" ("created_at");
	`);

	await database.transaction(async (tx) => {
		const resetLeads = process.env.SEED_RESET_LEADS === "true";
		if (resetLeads) {
			await tx.delete(leads);
		}
		const existingAccounts = await tx
			.select({ id: accounts.id, name: accounts.name })
			.from(accounts);

		if (existingAccounts.length === 0) {
			throw new Error("Seed Accounts mora biti pokrenut pre CRM seeda.");
		}

		const accountIds = existingAccounts.map((record) => record.id);
		let existingUsers = await tx
			.select({ id: users.id, name: users.name, email: users.email })
			.from(users);

		if (existingUsers.length === 0) {
			const userSeedData = Array.from({ length: 6 }, () => ({
				id: faker.string.uuid(),
				name: faker.person.fullName(),
				email: faker.internet.email({ provider: "crm.example" }),
				status: "active" as const,
			}));

			await tx.insert(users).values(userSeedData).onConflictDoNothing({
				target: users.email,
			});

			existingUsers = await tx
				.select({ id: users.id, name: users.name, email: users.email })
				.from(users);
		}

		const userIds = existingUsers.map((record) => record.id);
		const leadsSeedData = buildLeadSeeds(accountIds);
		const activitiesSeedData = buildActivitySeeds(accountIds, userIds);
		const dealsSeedData = buildDealSeeds(existingAccounts, existingUsers);

		await Promise.all(
			leadsSeedData.map((entry) =>
				tx
					.insert(leads)
					.values({
						id: entry.id,
						accountId: entry.accountId,
						ownerId: null,
						name: entry.name,
						email: entry.email,
						status: entry.status,
						source: entry.source,
						createdAt: entry.createdAt,
						updatedAt: entry.updatedAt,
					})
					.onConflictDoUpdate({
						target: leads.email,
						set: {
							accountId: entry.accountId,
							name: entry.name,
							status: entry.status,
							source: entry.source,
							updatedAt: sql`NOW()`,
						},
					}),
			),
		);

		await tx.delete(clientActivities);
		await tx.delete(deals);

		if (activitiesSeedData.length > 0) {
			await tx.insert(clientActivities).values(activitiesSeedData);
		}

		if (dealsSeedData.length > 0) {
			await tx
				.insert(deals)
				.values(
					dealsSeedData.map((entry) => ({
						id: entry.id,
						title: entry.title,
						company: entry.company,
						owner: entry.owner,
						stage: entry.stage,
						value: entry.value,
						closeDate: entry.closeDate,
						notes: entry.notes,
						createdAt: entry.createdAt,
						updatedAt: entry.updatedAt,
					})),
				)
				.onConflictDoUpdate({
					target: deals.id,
					set: {
						title: sql`excluded.title`,
						company: sql`excluded.company`,
						owner: sql`excluded.owner`,
						stage: sql`excluded.stage`,
						value: sql`excluded.value`,
						closeDate: sql`excluded.close_date`,
						notes: sql`excluded.notes`,
						updatedAt: sql`NOW()`,
					},
				});
		}

		// Create opportunities from leads
		const insertedLeads = await tx
			.select({ id: leads.id, accountId: leads.accountId, email: leads.email, name: leads.name })
			.from(leads)
			.limit(50);

		const opportunityStages = ["prospecting", "qualification", "proposal", "negotiation", "closedWon", "closedLost"] as const;
		const opportunitiesData = [];

		for (let i = 0; i < Math.min(45, insertedLeads.length); i++) {
			const lead = insertedLeads[i];
			const accountId = lead.accountId || accountIds[i % accountIds.length];
			const ownerId = userIds.length > 0 ? userIds[i % userIds.length] : null;
			const stage = opportunityStages[i % opportunityStages.length];
			const value = 10000 + (i * 1500) + faker.number.int({ min: 0, max: 10000 });
			const probability = stage === "closedWon" ? 100 : stage === "closedLost" ? 0 : (i % 4) * 25 + 25;

			const closeDate = stage === "closedWon" || stage === "closedLost"
				? addDays(new Date(), -faker.number.int({ min: 1, max: 90 }))
				: addDays(new Date(), faker.number.int({ min: 30, max: 120 }));

			const createdAt = addDays(new Date(), -faker.number.int({ min: 10, max: 180 }));

			opportunitiesData.push({
				id: faker.string.uuid(),
				accountId,
				leadId: lead.id,
				ownerId,
				title: `${lead.name} - Opportunity #${i + 1}`,
				stage,
				value: value.toFixed(2),
				probability: probability.toFixed(2),
				closeDate,
				createdAt,
				updatedAt: addDays(createdAt, faker.number.int({ min: 1, max: 30 }))
			});
		}

		if (opportunitiesData.length > 0) {
			await tx.insert(opportunities).values(opportunitiesData);
		}

		// Create activities for leads and opportunities
		const insertedOpportunities = await tx
			.select({ id: opportunities.id, title: opportunities.title })
			.from(opportunities)
			.limit(40);

		const activityTypes = ["call", "email", "meeting", "task"] as const;
		const activitiesData = [];

		for (let i = 0; i < 35; i++) {
			const isForOpportunity = i % 2 === 0 && insertedOpportunities.length > 0;
			const relatedId = isForOpportunity
				? insertedOpportunities[i % insertedOpportunities.length]?.id
				: insertedLeads[i % insertedLeads.length]?.id;

			if (!relatedId) continue;

			const ownerId = userIds.length > 0 ? userIds[i % userIds.length] : null;
			const type = activityTypes[i % activityTypes.length];
			const date = addDays(new Date(), -faker.number.int({ min: 0, max: 60 }));

			activitiesData.push({
				id: faker.string.uuid(),
				type,
				subject: faker.helpers.arrayElement(ACTIVITY_TITLES),
				notes: i % 3 === 0 ? faker.lorem.sentence() : null,
				date,
				ownerId,
				relatedTo: isForOpportunity ? `opportunity:${relatedId}` : `lead:${relatedId}`,
				createdAt: addDays(date, -faker.number.int({ min: 1, max: 5 })),
				updatedAt: date
			});
		}

		if (activitiesData.length > 0) {
			await tx.insert(activities).values(activitiesData);
		}

		// Create CRM notes for leads and opportunities
		const notesData = [];

		// Notes for leads
		for (let i = 0; i < Math.min(15, insertedLeads.length); i++) {
			const lead = insertedLeads[i];
			const authorId = userIds.length > 0 ? userIds[i % userIds.length] : null;

			notesData.push({
				id: faker.string.uuid(),
				leadId: lead.id,
				opportunityId: null,
				authorId,
				body: faker.lorem.paragraph(),
				createdAt: addDays(new Date(), -faker.number.int({ min: 1, max: 30 }))
			});
		}

		// Notes for opportunities
		for (let i = 0; i < Math.min(15, insertedOpportunities.length); i++) {
			const opp = insertedOpportunities[i];
			const authorId = userIds.length > 0 ? userIds[i % userIds.length] : null;

			notesData.push({
				id: faker.string.uuid(),
				leadId: null,
				opportunityId: opp.id,
				authorId,
				body: faker.lorem.paragraph(),
				createdAt: addDays(new Date(), -faker.number.int({ min: 1, max: 30 }))
			});
		}

		if (notesData.length > 0) {
			await tx.insert(crmNotes).values(notesData);
		}
	});
};
