import { and, eq } from "drizzle-orm";
import { companies } from "../schema/core";
import {
	chatConversations,
	chatMessages,
} from "../schema/chat";
import { teamchatUsers } from "../schema/teamchat";
import type { DashboardDatabase } from "./seed-runner";

type ChatSeedResult = {
	conversationsCreated: number;
	messagesCreated: number;
};

export async function seedChat(
	db: DashboardDatabase,
	_options: { force?: boolean } = {},
): Promise<ChatSeedResult> {
	// Get or create default company
	let [company] = await db.select().from(companies).limit(1);

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

	// Get teamchat users
	const allTeamchatUsers = await db
		.select()
		.from(teamchatUsers)
		.where(eq(teamchatUsers.companyId, company.id));

	if (allTeamchatUsers.length < 2) {
		return {
			conversationsCreated: 0,
			messagesCreated: 0,
		};
	}

	await db.transaction(async (tx) => {
		// Create conversations between pairs of users
		const conversations = [];

		// Create conversations between first few users
		for (let i = 0; i < Math.min(allTeamchatUsers.length - 1, 5); i++) {
			const user1 = allTeamchatUsers[i];
			const user2 = allTeamchatUsers[i + 1];

			// Ensure userId1 < userId2 for consistency
			const userId1 = user1.id < user2.id ? user1.id : user2.id;
			const userId2 = user1.id < user2.id ? user2.id : user1.id;

			const [conversation] = await tx
				.insert(chatConversations)
				.values({
					userId1,
					userId2,
					companyId: company.id,
					lastMessage: "Zdravo! 👋",
					lastMessageAt: new Date(),
				})
				.onConflictDoNothing()
				.returning();

			if (conversation) {
				conversations.push(conversation);
			} else {
				// Get existing conversation
				const [existing] = await tx
					.select()
					.from(chatConversations)
					.where(
						and(
							eq(chatConversations.userId1, userId1),
							eq(chatConversations.userId2, userId2),
							eq(chatConversations.companyId, company.id),
						),
					)
					.limit(1);
				if (existing) {
					conversations.push(existing);
				}
			}
		}

		// Create messages for each conversation
		const messagesToInsert = [];

		for (const conversation of conversations) {
			const user1 = allTeamchatUsers.find((u) => u.id === conversation.userId1);
			const user2 = allTeamchatUsers.find((u) => u.id === conversation.userId2);

			if (!user1 || !user2) continue;

			const sampleMessages = [
				{
					conversationId: conversation.id,
					senderId: conversation.userId1,
					content: `Zdravo ${user2.firstName}! Kako si?`,
					type: "text" as const,
					status: "read" as const,
				},
				{
					conversationId: conversation.id,
					senderId: conversation.userId2,
					content: `Zdravo ${user1.firstName}! Dobro sam, hvala! A ti?`,
					type: "text" as const,
					status: "read" as const,
				},
				{
					conversationId: conversation.id,
					senderId: conversation.userId1,
					content: "Odlično! Radujem se saradnji na projektu.",
					type: "text" as const,
					status: "delivered" as const,
				},
			];

			messagesToInsert.push(...sampleMessages);
		}

		if (messagesToInsert.length > 0) {
			await tx.insert(chatMessages).values(messagesToInsert);
		}
	});

	// Count created records
	const conversationsCount = await db
		.select()
		.from(chatConversations)
		.where(eq(chatConversations.companyId, company.id));
	const messagesCount = await db
		.select()
		.from(chatMessages)
		.innerJoin(
			chatConversations,
			eq(chatMessages.conversationId, chatConversations.id),
		)
		.where(eq(chatConversations.companyId, company.id));

	return {
		conversationsCreated: conversationsCount.length,
		messagesCreated: messagesCount.length,
	};
}
