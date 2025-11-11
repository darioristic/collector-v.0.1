import { LEAD_STATUSES } from "@crm/types";
import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";

import { db as defaultDb } from "../index";
import { accounts } from "../schema/accounts.schema";
import { clientActivities, leads } from "../schema/crm.schema";
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

	return Array.from({ length: 60 }, (_value, index) => {
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

export const seedCrm = async (database = defaultDb) => {
	await database.transaction(async (tx) => {
		const existingAccounts = await tx
			.select({ id: accounts.id })
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

		if (activitiesSeedData.length > 0) {
			await tx.insert(clientActivities).values(activitiesSeedData);
		}
	});
};
