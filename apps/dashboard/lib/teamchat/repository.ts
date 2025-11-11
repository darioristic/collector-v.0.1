import { and, asc, desc, eq, inArray, ne, max } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { getDb } from "@/lib/db";
import type { AuthCompany, AuthUser } from "@/lib/auth";
import {
	channelMembers,
	channels,
	companies,
	messages,
	users,
} from "@/lib/db/schema/teamchat";
import type {
	ChannelMemberSummary,
	ChannelMetadata,
	ChannelSummary,
	MessageWithAuthor,
	TeamChatBootstrap,
} from "@/lib/teamchat/types";

const CHANNEL_METADATA_GROUP: ChannelMetadata = { type: "group" };

const messageSender = alias(users, "message_sender");

type ChannelRecord = typeof channels.$inferSelect;
type CompanyRecord = typeof companies.$inferSelect;
type UserRecord = typeof users.$inferSelect;

type MessageRow = {
	id: string;
	content: string | null;
	fileUrl: string | null;
	channelId: string;
	createdAt: Date;
	senderId: string;
	senderFirstName: string;
	senderLastName: string;
	senderDisplayName: string | null;
	senderEmail: string;
	senderAvatarUrl: string | null;
};

const parseChannelMetadata = (value: string | null): ChannelMetadata | null => {
	if (!value) {
		return null;
	}
	try {
		const parsed = JSON.parse(value) as ChannelMetadata;
		if (parsed && typeof parsed === "object") {
			return parsed;
		}
		return null;
	} catch (error) {
		console.warn("[teamchat] Failed to parse channel metadata", error);
		return null;
	}
};

const serializeMetadata = (metadata: ChannelMetadata | null): string | null => {
	if (!metadata) {
		return null;
	}
	return JSON.stringify(metadata);
};

const buildDisplayName = (user: UserRecord): string => {
	const display = user.displayName?.trim();
	if (display && display.length > 0) {
		return display;
	}
	const parts = [user.firstName, user.lastName].filter(
		(part) => part && part.length > 0,
	);
	const full = parts.join(" ").trim();
	return full.length > 0 ? full : user.email;
};

const mapUserToSummary = (user: UserRecord): ChannelMemberSummary => ({
	id: user.id,
	name: buildDisplayName(user),
	email: user.email,
	avatarUrl: user.avatarUrl ?? null,
	status: user.status,
});

const mapMessageRowToDto = (row: MessageRow): MessageWithAuthor => ({
	id: row.id,
	content: row.content ?? null,
	fileUrl: row.fileUrl ?? null,
	attachment: row.fileUrl
		? {
				url: row.fileUrl,
				name: null,
				size: null,
				mimeType: null,
			}
		: null,
	senderId: row.senderId,
	senderName:
		row.senderDisplayName?.trim() ||
		[row.senderFirstName, row.senderLastName]
			.filter((value) => value && value.length > 0)
			.join(" ") ||
		row.senderEmail,
	senderEmail: row.senderEmail,
	senderAvatarUrl: row.senderAvatarUrl ?? null,
	channelId: row.channelId,
	createdAt: row.createdAt,
});

const upsertCompany = async (company: AuthCompany): Promise<CompanyRecord> => {
	const db = await getDb();
	const now = new Date();
	const slug =
		(company.slug ?? "").trim().length > 0 ? company.slug : company.id;
	const domain = company.domain?.trim() ?? null;

	await db
		.insert(companies)
		.values({
			id: company.id,
			name: company.name,
			slug,
			domain,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: companies.id,
			set: {
				name: company.name,
				slug,
				domain,
				updatedAt: now,
			},
		});

	const [record] = await db
		.select()
		.from(companies)
		.where(eq(companies.id, company.id))
		.limit(1);

	if (!record) {
		throw new Error("Ne postoji kompanija iz sesije.");
	}

	return record;
};

const normalizeRole = (role: string | null | undefined): "ADMIN" | "MEMBER" => {
	if (role === "ADMIN" || role === "OWNER" || role === "SUPERADMIN") {
		return "ADMIN";
	}
	return "MEMBER";
};

const splitName = (fullName: string | null | undefined) => {
	const fallback = "Korisnik";
	const trimmed = (fullName ?? "").trim();
	if (!trimmed) {
		return { firstName: fallback, lastName: "" };
	}
	const parts = trimmed.split(/\s+/);
	const firstName = parts.shift() ?? fallback;
	const lastName = parts.join(" ");
	return { firstName, lastName };
};

const upsertUser = async ({
	authUser,
	companyId,
}: {
	authUser: AuthUser;
	companyId: string;
}): Promise<UserRecord> => {
	const db = await getDb();
	const now = new Date();
	const role = normalizeRole(authUser.company?.role ?? null);
	const { firstName, lastName } = splitName(authUser.name);
	const displayName =
		(authUser.name ?? "").trim() || `${firstName} ${lastName}`.trim();

	await db
		.insert(users)
		.values({
			id: authUser.id,
			firstName,
			lastName,
			displayName,
			email: authUser.email,
			role,
			status: "online",
			avatarUrl: null,
			companyId,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: users.email,
			set: {
				id: authUser.id,
				firstName,
				lastName,
				displayName,
				email: authUser.email,
				role,
				status: "online",
				companyId,
				updatedAt: now,
			},
		});

	const [record] = await db
		.select()
		.from(users)
		.where(eq(users.id, authUser.id))
		.limit(1);
	if (!record) {
		throw new Error("Korisnik iz sesije nije pronađen.");
	}
	return record;
};

const ensureDefaultChannel = async ({
	companyId,
	userId,
}: {
	companyId: string;
	userId: string;
}) => {
	const db = await getDb();
	const now = new Date();

	const existing = await db
		.select()
		.from(channels)
		.where(and(eq(channels.companyId, companyId), eq(channels.name, "general")))
		.limit(1);

	if (existing.length > 0) {
		await db
			.insert(channelMembers)
			.values({
				channelId: existing[0].id,
				userId,
				joinedAt: now,
			})
			.onConflictDoNothing();
		return existing[0];
	}

	const [channel] = await db
		.insert(channels)
		.values({
			name: "general",
			isPrivate: false,
			metadata: serializeMetadata(CHANNEL_METADATA_GROUP),
			companyId,
			createdAt: now,
			updatedAt: now,
		})
		.returning();

	await db
		.insert(channelMembers)
		.values({
			channelId: channel.id,
			userId,
			joinedAt: now,
			lastReadAt: now,
		})
		.onConflictDoNothing();

	return channel;
};

const ensurePublicChannelMemberships = async (
	companyId: string,
	userId: string,
) => {
	const db = await getDb();
	const publicChannels = await db
		.select({ id: channels.id })
		.from(channels)
		.where(
			and(eq(channels.companyId, companyId), eq(channels.isPrivate, false)),
		);

	if (publicChannels.length === 0) {
		return;
	}

	await db
		.insert(channelMembers)
		.values(
			publicChannels.map((channel) => ({ channelId: channel.id, userId })),
		)
		.onConflictDoNothing();
};

const ensureMembership = async (channelId: string, userId: string) => {
	const db = await getDb();
	await db
		.insert(channelMembers)
		.values({
			channelId,
			userId,
		})
		.onConflictDoNothing();
};

const getAccessibleChannels = async ({
	companyId,
	userId,
}: {
	companyId: string;
	userId: string;
}): Promise<ChannelSummary[]> => {
	const db = await getDb();

	const channelRows = await db
		.select({
			id: channels.id,
			name: channels.name,
			isPrivate: channels.isPrivate,
			metadata: channels.metadata,
			createdAt: channels.createdAt,
			updatedAt: channels.updatedAt,
		})
		.from(channels)
		.where(eq(channels.companyId, companyId))
		.orderBy(desc(channels.updatedAt));

	if (channelRows.length === 0) {
		return [];
	}

	const channelIds = channelRows.map((channel) => channel.id);

	const memberRows = await db
		.select({
			channelId: channelMembers.channelId,
			userId: users.id,
			firstName: users.firstName,
			lastName: users.lastName,
			displayName: users.displayName,
			email: users.email,
			status: users.status,
			avatarUrl: users.avatarUrl,
		})
		.from(channelMembers)
		.innerJoin(users, eq(channelMembers.userId, users.id))
		.where(inArray(channelMembers.channelId, channelIds));

	const membersByChannel = new Map<string, ChannelMemberSummary[]>();
	for (const row of memberRows) {
		const list = membersByChannel.get(row.channelId) ?? [];
		list.push({
			id: row.userId,
			name:
				row.displayName?.trim() ||
				[row.firstName, row.lastName]
					.filter((value) => value && value.length > 0)
					.join(" ") ||
				row.email,
			email: row.email,
			avatarUrl: row.avatarUrl ?? null,
			status: row.status,
		});
		membersByChannel.set(row.channelId, list);
	}

	let lastMessageMap = new Map<string, MessageWithAuthor>();
	if (channelIds.length > 0) {
		const lastMessageSubquery = db
			.select({
				channelId: messages.channelId,
				lastCreatedAt: max(messages.createdAt).as("lastCreatedAt"),
			})
			.from(messages)
			.where(inArray(messages.channelId, channelIds))
			.groupBy(messages.channelId)
			.as("last_message");

		const lastMessageRows = await db
			.select({
				channelId: messages.channelId,
				id: messages.id,
				content: messages.content,
				fileUrl: messages.fileUrl,
				createdAt: messages.createdAt,
				senderId: messages.senderId,
				senderFirstName: messageSender.firstName,
				senderLastName: messageSender.lastName,
				senderDisplayName: messageSender.displayName,
				senderEmail: messageSender.email,
				senderAvatarUrl: messageSender.avatarUrl,
			})
			.from(messages)
			.innerJoin(
				lastMessageSubquery,
				and(
					eq(lastMessageSubquery.channelId, messages.channelId),
					eq(lastMessageSubquery.lastCreatedAt, messages.createdAt),
				),
			)
			.innerJoin(messageSender, eq(messages.senderId, messageSender.id));

		lastMessageMap = new Map(
			lastMessageRows.map((row) => [
				row.channelId,
				mapMessageRowToDto({
					id: row.id,
					content: row.content,
					fileUrl: row.fileUrl,
					channelId: row.channelId,
					createdAt: row.createdAt,
					senderId: row.senderId,
					senderFirstName: row.senderFirstName,
					senderLastName: row.senderLastName,
					senderDisplayName: row.senderDisplayName,
					senderEmail: row.senderEmail,
					senderAvatarUrl: row.senderAvatarUrl,
				}),
			]),
		);
	}

	return channelRows.reduce<ChannelSummary[]>((acc, channel) => {
		const members = membersByChannel.get(channel.id) ?? [];
		const metadata = parseChannelMetadata(channel.metadata);
		const lastMessage = lastMessageMap.get(channel.id) ?? null;

		const memberRecord = members.find((member) => member.id === userId);
		if (channel.isPrivate && !memberRecord) {
			return acc;
		}

		acc.push({
			id: channel.id,
			name: channel.name,
			isPrivate: channel.isPrivate,
			metadata,
			unreadCount: 0,
			lastMessageAt: lastMessage ? lastMessage.createdAt : null,
			lastMessagePreview:
				lastMessage?.content ?? (lastMessage?.fileUrl ? "Attachment" : null),
			members,
		});

		return acc;
	}, []);
};

const getDirectMessageTargets = async (
	companyId: string,
	excludeUserId: string,
) => {
	const db = await getDb();
	const rows = await db
		.select()
		.from(users)
		.where(and(eq(users.companyId, companyId), ne(users.id, excludeUserId)))
		.orderBy(asc(users.firstName), asc(users.lastName));

	return rows.map(mapUserToSummary);
};

export const listChannels = async ({
	companyId,
	userId,
}: {
	companyId: string;
	userId: string;
}): Promise<ChannelSummary[]> => {
	await ensureDefaultChannel({ companyId, userId });
	await ensurePublicChannelMemberships(companyId, userId);
	return getAccessibleChannels({ companyId, userId });
};

export const listDirectMessageTargets = async ({
	companyId,
	userId,
}: {
	companyId: string;
	userId: string;
}): Promise<ChannelMemberSummary[]> =>
	getDirectMessageTargets(companyId, userId);

export const bootstrapTeamChat = async ({
	authUser,
	authCompany,
}: {
	authUser: AuthUser;
	authCompany: AuthCompany;
}): Promise<TeamChatBootstrap> => {
	const company = await upsertCompany(authCompany);
	const currentUser = await upsertUser({ authUser, companyId: company.id });

	const channelsSummary = await listChannels({
		companyId: company.id,
		userId: currentUser.id,
	});

	return {
		currentUser: mapUserToSummary(currentUser),
		channels: channelsSummary,
		directMessageTargets: await getDirectMessageTargets(
			company.id,
			currentUser.id,
		),
	};
};

export const getChannelMessages = async ({
	companyId,
	channelId,
	userId,
	limit = 50,
}: {
	companyId: string;
	channelId: string;
	userId: string;
	limit?: number;
}): Promise<MessageWithAuthor[]> => {
	const db = await getDb();

	const channelRow = await db
		.select({
			id: channels.id,
			isPrivate: channels.isPrivate,
		})
		.from(channels)
		.where(and(eq(channels.id, channelId), eq(channels.companyId, companyId)))
		.limit(1)
		.then((rows) => rows[0]);

	if (!channelRow) {
		throw new Error("Kanal nije pronađen.");
	}

	if (channelRow.isPrivate) {
		const membership = await db
			.select({ userId: channelMembers.userId })
			.from(channelMembers)
			.where(
				and(
					eq(channelMembers.channelId, channelId),
					eq(channelMembers.userId, userId),
				),
			)
			.limit(1);

		if (membership.length === 0) {
			throw new Error("Nemate pristup ovom kanalu.");
		}
	}

	await ensureMembership(channelId, userId);

	const messageRows = await db
		.select({
			id: messages.id,
			content: messages.content,
			fileUrl: messages.fileUrl,
			channelId: messages.channelId,
			createdAt: messages.createdAt,
			senderId: messages.senderId,
			senderFirstName: messageSender.firstName,
			senderLastName: messageSender.lastName,
			senderDisplayName: messageSender.displayName,
			senderEmail: messageSender.email,
			senderAvatarUrl: messageSender.avatarUrl,
		})
		.from(messages)
		.innerJoin(messageSender, eq(messages.senderId, messageSender.id))
		.where(eq(messages.channelId, channelId))
		.orderBy(asc(messages.createdAt))
		.limit(limit);

	return messageRows.map((row) =>
		mapMessageRowToDto({
			id: row.id,
			content: row.content,
			fileUrl: row.fileUrl,
			channelId: row.channelId,
			createdAt: row.createdAt,
			senderId: row.senderId,
			senderFirstName: row.senderFirstName,
			senderLastName: row.senderLastName,
			senderDisplayName: row.senderDisplayName,
			senderEmail: row.senderEmail,
			senderAvatarUrl: row.senderAvatarUrl,
		}),
	);
};

type CreateMessageInput = {
	companyId: string;
	channelId: string;
	userId: string;
	content: string | null;
	fileUrl: string | null;
};

export const createMessage = async (
	input: CreateMessageInput,
): Promise<MessageWithAuthor> => {
	const db = await getDb();

	const channel = await db
		.select({ id: channels.id })
		.from(channels)
		.where(
			and(
				eq(channels.id, input.channelId),
				eq(channels.companyId, input.companyId),
			),
		)
		.limit(1);

	if (channel.length === 0) {
		throw new Error("Kanal nije pronađen.");
	}

	await ensureMembership(input.channelId, input.userId);

	const now = new Date();

	const [message] = await db
		.insert(messages)
		.values({
			channelId: input.channelId,
			senderId: input.userId,
			content: input.content,
			fileUrl: input.fileUrl,
			createdAt: now,
			updatedAt: now,
		})
		.returning();

	await db
		.update(channels)
		.set({ updatedAt: now })
		.where(eq(channels.id, input.channelId));

	await db
		.update(channelMembers)
		.set({ lastReadAt: now })
		.where(
			and(
				eq(channelMembers.channelId, input.channelId),
				eq(channelMembers.userId, input.userId),
			),
		);

	const fullMessageRow = await db
		.select({
			id: messages.id,
			content: messages.content,
			fileUrl: messages.fileUrl,
			channelId: messages.channelId,
			createdAt: messages.createdAt,
			senderId: messages.senderId,
			senderFirstName: messageSender.firstName,
			senderLastName: messageSender.lastName,
			senderDisplayName: messageSender.displayName,
			senderEmail: messageSender.email,
			senderAvatarUrl: messageSender.avatarUrl,
		})
		.from(messages)
		.innerJoin(messageSender, eq(messages.senderId, messageSender.id))
		.where(eq(messages.id, message.id))
		.limit(1)
		.then((rows) => rows[0]);

	if (!fullMessageRow) {
		throw new Error("Poruka nije pronađena nakon kreiranja.");
	}

	return mapMessageRowToDto({
		id: fullMessageRow.id,
		content: fullMessageRow.content,
		fileUrl: fullMessageRow.fileUrl,
		channelId: fullMessageRow.channelId,
		createdAt: fullMessageRow.createdAt,
		senderId: fullMessageRow.senderId,
		senderFirstName: fullMessageRow.senderFirstName,
		senderLastName: fullMessageRow.senderLastName,
		senderDisplayName: fullMessageRow.senderDisplayName,
		senderEmail: fullMessageRow.senderEmail,
		senderAvatarUrl: fullMessageRow.senderAvatarUrl,
	});
};

export const upsertDirectMessageChannel = async ({
	companyId,
	currentUserId,
	targetUserId,
}: {
	companyId: string;
	currentUserId: string;
	targetUserId: string;
}): Promise<ChannelRecord> => {
	const db = await getDb();
	const metadata = JSON.stringify({
		type: "dm",
		userIds: [currentUserId, targetUserId],
	});

	const existing = await db
		.select()
		.from(channels)
		.where(
			and(
				eq(channels.companyId, companyId),
				eq(channels.isPrivate, true),
				eq(channels.metadata, metadata),
			),
		)
		.limit(1);

	if (existing.length > 0) {
		await ensureMembership(existing[0].id, currentUserId);
		await ensureMembership(existing[0].id, targetUserId);
		return existing[0];
	}

	const now = new Date();
	const participants = await db
		.select()
		.from(users)
		.where(
			and(
				eq(users.companyId, companyId),
				inArray(users.id, [currentUserId, targetUserId]),
			),
		);

	if (participants.length < 2) {
		throw new Error("Nije moguće formirati direktnu konverzaciju.");
	}

	const target = participants.find((user) => user.id === targetUserId);
	if (!target) {
		throw new Error("Ciljani korisnik nije pronađen.");
	}

	const [channel] = await db
		.insert(channels)
		.values({
			name: buildDisplayName(target),
			isPrivate: true,
			metadata,
			companyId,
			createdAt: now,
			updatedAt: now,
		})
		.returning();

	await db
		.insert(channelMembers)
		.values([
			{
				channelId: channel.id,
				userId: currentUserId,
				joinedAt: now,
				lastReadAt: now,
			},
			{
				channelId: channel.id,
				userId: targetUserId,
				joinedAt: now,
				lastReadAt: now,
			},
		])
		.onConflictDoNothing();

	return channel;
};
