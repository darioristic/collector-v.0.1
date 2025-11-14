import { eq } from "drizzle-orm";
import { companies, users } from "../schema/core";
import {
	teamchatChannels,
	teamchatChannelMembers,
	teamchatMessages,
	teamchatUsers,
} from "../schema/teamchat";
import type { DashboardDatabase } from "./seed-runner";

type TeamchatSeedResult = {
	usersCreated: number;
	channelsCreated: number;
	membersCreated: number;
	messagesCreated: number;
};

export async function seedTeamchat(
	db: DashboardDatabase,
	_options: { force?: boolean } = {},
): Promise<TeamchatSeedResult> {
  let [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, 'collector-labs'))
    .limit(1);

  if (!company) {
    const [newCompany] = await db
      .insert(companies)
      .values({
        name: "Default Company",
        slug: "default-company",
        domain: null,
      })
      .returning();
    company = newCompany;
  }

	// Get all users
	const allUsers = await db.select().from(users);

	if (allUsers.length === 0) {
		return {
			usersCreated: 0,
			channelsCreated: 0,
			membersCreated: 0,
			messagesCreated: 0,
		};
	}

	await db.transaction(async (tx) => {
		// Create teamchat users from regular users
		const teamchatUserMap = new Map<string, string>();

		for (const user of allUsers) {
			const nameParts = user.name.split(" ");
			const firstName = nameParts[0] || "";
			const lastName = nameParts.slice(1).join(" ") || "";

			const [teamchatUser] = await tx
				.insert(teamchatUsers)
				.values({
					firstName,
					lastName,
					displayName: user.name,
					email: user.email,
					role: "MEMBER",
					status: "offline",
					companyId: company.id,
				})
				.onConflictDoUpdate({
					target: teamchatUsers.email,
					set: {
						firstName,
						lastName,
						displayName: user.name,
						updatedAt: new Date(),
					},
				})
				.returning();

			if (teamchatUser) {
				teamchatUserMap.set(user.id, teamchatUser.id);
			}
		}

		// Create channels
		const channelsData = [
			{ name: "general", isPrivate: false },
			{ name: "random", isPrivate: false },
			{ name: "development", isPrivate: false },
			{ name: "design", isPrivate: false },
			{ name: "marketing", isPrivate: false },
		];

		const channelMap = new Map<string, string>();

		for (const channelData of channelsData) {
			const [channel] = await tx
				.insert(teamchatChannels)
				.values({
					name: channelData.name,
					isPrivate: channelData.isPrivate,
					companyId: company.id,
				})
				.onConflictDoNothing()
				.returning();

			if (channel) {
				channelMap.set(channelData.name, channel.id);
			} else {
				// Get existing channel
				const [existing] = await tx
					.select()
					.from(teamchatChannels)
					.where(eq(teamchatChannels.name, channelData.name))
					.limit(1);
				if (existing) {
					channelMap.set(channelData.name, existing.id);
				}
			}
		}

		// Add all teamchat users to general and random channels
		const generalChannelId = channelMap.get("general");
		const randomChannelId = channelMap.get("random");

		if (generalChannelId && randomChannelId) {
			const membersToInsert = Array.from(teamchatUserMap.values()).flatMap(
				(userId) => [
					{
						channelId: generalChannelId,
						userId,
					},
					{
						channelId: randomChannelId,
						userId,
					},
				],
			);

			if (membersToInsert.length > 0) {
				await tx
					.insert(teamchatChannelMembers)
					.values(membersToInsert)
					.onConflictDoNothing();
			}
		}

		// Create some sample messages in general channel
		if (generalChannelId && teamchatUserMap.size > 0) {
			const userIds = Array.from(teamchatUserMap.values());
			const sampleMessages = [
				{
					content: "Dobrodošli u Collector Dashboard! 👋",
					senderId: userIds[0],
					channelId: generalChannelId,
				},
				{
					content: "Hvala! Radujem se saradnji!",
					senderId: userIds[1 % userIds.length],
					channelId: generalChannelId,
				},
				{
					content: "Ako imate pitanja, slobodno pitajte.",
					senderId: userIds[0],
					channelId: generalChannelId,
				},
				{
					content: "Kada je sastanak tima?",
					senderId: userIds[2 % userIds.length],
					channelId: generalChannelId,
				},
				{
					content: "Sastanak je zakazan za petak u 10:00.",
					senderId: userIds[0],
					channelId: generalChannelId,
				},
			];

			await tx.insert(teamchatMessages).values(sampleMessages);
		}
	});

	// Count created records
	const usersCount = await db
		.select()
		.from(teamchatUsers)
		.where(eq(teamchatUsers.companyId, company.id));
	const channelsCount = await db
		.select()
		.from(teamchatChannels)
		.where(eq(teamchatChannels.companyId, company.id));
	const messagesCount = await db
		.select()
		.from(teamchatMessages)
		.innerJoin(
			teamchatChannels,
			eq(teamchatMessages.channelId, teamchatChannels.id),
		)
		.where(eq(teamchatChannels.companyId, company.id));

	return {
		usersCreated: usersCount.length,
		channelsCreated: channelsCount.length,
		membersCreated: 0, // Hard to count without complex query
		messagesCreated: messagesCount.length,
	};
}
