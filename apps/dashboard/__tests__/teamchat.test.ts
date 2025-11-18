import { eq, sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { getDb } from "@/lib/db";
import { companies } from "@/lib/db/schema/core";
import {
	teamchatChannelMembers,
	teamchatChannels,
	teamchatMessages,
	teamchatUsers,
} from "@/lib/db/schema/teamchat";
import { createMessage, getChannelMessages } from "@/lib/teamchat/repository";

const companyId = "00000000-0000-0000-0000-000000000001";
const userA = {
	id: "00000000-0000-0000-0000-000000000101",
	email: "dario@example.com",
	name: "Dario Ristic",
	status: "online",
	defaultCompanyId: companyId,
	company: null,
};
const userB = {
	id: "00000000-0000-0000-0000-000000000102",
	email: "miha@example.com",
	name: "Miha Novak",
	status: "online",
	defaultCompanyId: companyId,
	company: null,
};
const company = {
	id: companyId,
	name: "Collector Labs",
	slug: "collector-labs",
	domain: "collectorlabs.test",
	role: null,
};

beforeAll(async () => {
	const db = await getDb();
	// ensure core companies/users exist
	const fs = await import("node:fs/promises");
	const path = `${process.cwd()}/lib/db/migrations/0000_create_users_and_companies.sql`;
	const ddl = await fs.readFile(path, "utf8");
	const statements = ddl
		.split(/;\s*[\r\n]+/)
		.map((s) => s.trim())
		.filter(Boolean);
	for (const stmt of statements) {
		await db.execute(sql.raw(`${stmt};`));
	}
	const readyDb = await (
		await import("@/lib/teamchat/repository")
	).ensureTeamChatSchemaReady();
	// clean all teamchat tables
	await readyDb.delete(teamchatMessages);
	await readyDb.delete(teamchatChannelMembers);
	await readyDb.delete(teamchatChannels);
	await readyDb.delete(teamchatUsers);
	await readyDb.delete(companies);

	// seed company and users
	await readyDb.insert(companies).values({
		id: company.id,
		name: company.name,
		slug: company.slug,
		domain: company.domain,
	});
	await readyDb.insert(teamchatUsers).values({
		id: userA.id,
		firstName: "Dario",
		lastName: "Ristic",
		email: userA.email,
		companyId,
		status: "online",
	});
	await readyDb.insert(teamchatUsers).values({
		id: userB.id,
		firstName: "Miha",
		lastName: "Novak",
		email: userB.email,
		companyId,
		status: "online",
	});
});

describe("TeamChat basic flow", () => {
	it("adds second user and creates DM channel", async () => {
		const db = await getDb();
		const [comp] = await db
			.select()
			.from(companies)
			.where(eq(companies.id, companyId))
			.limit(1);
		expect(comp).toBeTruthy();
		await db
			.insert(teamchatUsers)
			.values({
				id: userA.id,
				firstName: "Dario",
				lastName: "Ristic",
				email: userA.email,
				companyId,
				status: "online",
			})
			.onConflictDoNothing();
		await db
			.insert(teamchatUsers)
			.values({
				id: userB.id,
				firstName: "Miha",
				lastName: "Novak",
				email: userB.email,
				companyId,
				status: "online",
			})
			.onConflictDoNothing();

		const channelId = "00000000-0000-0000-0000-00000000c001";
		const metadata = JSON.stringify({
			type: "dm",
			userIds: [userA.id, userB.id],
		});
		await db
			.insert(teamchatChannels)
			.values({
				id: channelId,
				name: `DM: ${userA.id}-${userB.id}`,
				isPrivate: true,
				companyId,
				metadata,
			})
			.onConflictDoNothing();
		await db
			.insert(teamchatChannelMembers)
			.values([
				{ channelId, userId: userA.id },
				{ channelId, userId: userB.id },
			])
			.onConflictDoNothing();

		const db2 = await getDb();
		const [chan] = await db2
			.select()
			.from(teamchatChannels)
			.where(eq(teamchatChannels.id, channelId))
			.limit(1);
		expect(chan?.id).toBe(channelId);
		const members = await db2
			.select()
			.from(teamchatChannelMembers)
			.where(eq(teamchatChannelMembers.channelId, channelId));
		const memberIds = new Set(members.map((m) => m.userId));
		expect(memberIds.has(userA.id) && memberIds.has(userB.id)).toBe(true);
	});

	it("creates messages and retrieves history", async () => {
		const channelId = "00000000-0000-0000-0000-00000000c001";
		await createMessage(channelId, userA.id, "Hello Miha", null);
		await createMessage(channelId, userB.id, "Zdravo Dario", null);

		const history = await getChannelMessages(channelId, userA.id, 50);
		expect(history.length).toBeGreaterThanOrEqual(2);
		const contents = new Set(history.map((h) => h.content));
		expect(contents.has("Hello Miha")).toBe(true);
		expect(contents.has("Zdravo Dario")).toBe(true);
	});
});

describe("TeamChat performance", () => {
	it("handles 500 messages under reasonable time", async () => {
		const start = Date.now();
		const channelId = "00000000-0000-0000-0000-00000000c001";
		for (let i = 0; i < 500; i++) {
			await createMessage(
				channelId,
				i % 2 === 0 ? userA.id : userB.id,
				`msg-${i}`,
				null,
			);
		}
		const elapsed = Date.now() - start;
		expect(elapsed).toBeLessThan(8000);
		const history = await getChannelMessages(channelId, userA.id, 600);
		expect(history.length).toBeGreaterThanOrEqual(500);
	});
});
