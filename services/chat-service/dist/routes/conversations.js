import { getConversations, } from "../lib/repository.js";
import { sql } from "drizzle-orm";
import { isUuid } from "../lib/validation.js";
import { authMiddleware } from "../lib/auth.js";
const conversationsRoutes = async (fastify) => {
    fastify.addHook("onRequest", authMiddleware);
    fastify.addHook("preValidation", async (request, reply) => {
        const params = request.params;
        if (params && typeof params === "object" && "id" in params) {
            const id = params.id;
            if (typeof id === "string" && !isUuid(id)) {
                return reply.code(400).send({ error: "Nevalidan ID konverzacije." });
            }
        }
    });
    fastify.get("/", async (request, reply) => {
        if (!request.user) {
            return reply.code(401).send({ error: "Unauthorized" });
        }
        try {
            const cache = fastify.cache;
            const conversations = await getConversations({
                companyId: request.user.companyId,
                userId: request.user.userId,
                cache,
            });
            return reply.send({ conversations });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            request.log.error({ err: error, companyId: request.user.companyId, userId: request.user.userId }, "Failed to fetch conversations");
            return reply.code(500).send({
                error: "Failed to fetch conversations",
                details: process.env.NODE_ENV === "development" ? errorMessage : undefined
            });
        }
    });
    fastify.post("/", async (request, reply) => {
        if (!request.user) {
            return reply.code(401).send({ error: "Unauthorized" });
        }
        const body = request.body;
        if (!body || typeof body !== "object" || (!body.targetUserId && !body.targetEmail)) {
            return reply.code(400).send({
                error: "Nevalidni podaci. targetUserId ili targetEmail je obavezan.",
            });
        }
        try {
            const cache = fastify.cache;
            let targetId = body.targetUserId;
            if (!targetId && body.targetEmail) {
                try {
                    const res = await fastify.db.execute(sql `SELECT id FROM users WHERE email = ${body.targetEmail} LIMIT 1`);
                    targetId = res.rows[0]?.id;
                }
                catch (lookupError) {
                    request.log.warn({ err: lookupError, email: body.targetEmail }, "Failed to resolve target user by email");
                }
            }
            // Fallback: resolve or create teamchat user by email in the current company
            if (!targetId && body.targetEmail) {
                try {
                    const { teamchatUsers } = await import("../db/schema/teamchat.js");
                    const { db } = await import("../db/index.js");
                    const { and, eq } = await import("drizzle-orm");
                    const [existing] = await db
                        .select({ id: teamchatUsers.id })
                        .from(teamchatUsers)
                        .where(and(eq(teamchatUsers.companyId, request.user.companyId), eq(teamchatUsers.email, body.targetEmail)))
                        .limit(1);
                    if (existing) {
                        targetId = existing.id;
                    }
                    else {
                        const [created] = await db
                            .insert(teamchatUsers)
                            .values({
                            email: body.targetEmail,
                            firstName: body.targetEmail.split("@")[0],
                            lastName: "",
                            companyId: request.user.companyId,
                            status: "offline",
                        })
                            .returning({ id: teamchatUsers.id });
                        targetId = created?.id;
                    }
                }
                catch (fallbackError) {
                    request.log.error({ err: fallbackError }, "Failed to resolve or create teamchat user by email");
                }
            }
            if (!targetId) {
                return reply.code(404).send({ error: "Korisnik nije pronađen po datim podacima." });
            }
            const { db } = await import("../db/index.js");
            const { and, eq } = await import("drizzle-orm");
            const { chatConversations } = await import("../db/schema/chat.js");
            const { teamchatUsers } = await import("../db/schema/teamchat.js");
            const { alias } = await import("drizzle-orm/pg-core");
            const companyId = request.user.companyId;
            const currentEmail = request.user.email;
            // Resolve teamchat IDs by email within company; create if missing
            const getOrCreateTeamchatIdByEmail = async (email) => {
                const [existing] = await db
                    .select({ id: teamchatUsers.id })
                    .from(teamchatUsers)
                    .where(and(eq(teamchatUsers.companyId, companyId), eq(teamchatUsers.email, email)))
                    .limit(1);
                if (existing)
                    return existing.id;
                const [created] = await db
                    .insert(teamchatUsers)
                    .values({
                    email,
                    firstName: email.split("@")[0] || "",
                    lastName: "",
                    companyId,
                    status: "offline",
                })
                    .returning({ id: teamchatUsers.id });
                return created.id;
            };
            const teamchatIdCurrent = await getOrCreateTeamchatIdByEmail(currentEmail);
            const teamchatIdTarget = await getOrCreateTeamchatIdByEmail(body.targetEmail);
            const userId1 = teamchatIdCurrent < teamchatIdTarget ? teamchatIdCurrent : teamchatIdTarget;
            const userId2 = teamchatIdCurrent < teamchatIdTarget ? teamchatIdTarget : teamchatIdCurrent;
            const [existing] = await db
                .select({ id: chatConversations.id })
                .from(chatConversations)
                .where(and(eq(chatConversations.companyId, companyId), eq(chatConversations.userId1, userId1), eq(chatConversations.userId2, userId2)))
                .limit(1);
            let conversationId = existing?.id || null;
            if (!conversationId) {
                const now = new Date();
                const [created] = await db
                    .insert(chatConversations)
                    .values({ userId1, userId2, companyId, createdAt: now, updatedAt: now })
                    .returning({ id: chatConversations.id });
                conversationId = created?.id ?? null;
            }
            if (!conversationId) {
                throw new Error("Failed to create conversation record");
            }
            const user1Alias = alias(teamchatUsers, "user1");
            const user2Alias = alias(teamchatUsers, "user2");
            const [conv] = await db
                .select({
                id: chatConversations.id,
                userId1: chatConversations.userId1,
                userId2: chatConversations.userId2,
                companyId: chatConversations.companyId,
                lastMessageAt: chatConversations.lastMessageAt,
                lastMessage: chatConversations.lastMessage,
                createdAt: chatConversations.createdAt,
                updatedAt: chatConversations.updatedAt,
                user1Id: user1Alias.id,
                user1FirstName: user1Alias.firstName,
                user1LastName: user1Alias.lastName,
                user1DisplayName: user1Alias.displayName,
                user1Email: user1Alias.email,
                user1AvatarUrl: user1Alias.avatarUrl,
                user1Status: user1Alias.status,
                user2Id: user2Alias.id,
                user2FirstName: user2Alias.firstName,
                user2LastName: user2Alias.lastName,
                user2DisplayName: user2Alias.displayName,
                user2Email: user2Alias.email,
                user2AvatarUrl: user2Alias.avatarUrl,
                user2Status: user2Alias.status,
            })
                .from(chatConversations)
                .innerJoin(user1Alias, eq(chatConversations.userId1, user1Alias.id))
                .innerJoin(user2Alias, eq(chatConversations.userId2, user2Alias.id))
                .where(eq(chatConversations.id, conversationId))
                .limit(1);
            const conversation = conv && {
                id: conv.id,
                userId1: conv.userId1,
                userId2: conv.userId2,
                companyId: conv.companyId,
                lastMessageAt: conv.lastMessageAt ? conv.lastMessageAt.toISOString() : null,
                lastMessage: conv.lastMessage,
                unreadCount: 0,
                createdAt: conv.createdAt.toISOString(),
                updatedAt: conv.updatedAt.toISOString(),
                user1: {
                    id: conv.user1Id,
                    firstName: conv.user1FirstName,
                    lastName: conv.user1LastName,
                    displayName: conv.user1DisplayName,
                    email: conv.user1Email,
                    avatarUrl: conv.user1AvatarUrl,
                    status: conv.user1Status,
                },
                user2: {
                    id: conv.user2Id,
                    firstName: conv.user2FirstName,
                    lastName: conv.user2LastName,
                    displayName: conv.user2DisplayName,
                    email: conv.user2Email,
                    avatarUrl: conv.user2AvatarUrl,
                    status: conv.user2Status,
                },
            };
            return reply.send({ conversation });
        }
        catch (error) {
            const body = (request.body ?? null);
            request.log.error({ err: error, body, userId: request.user?.userId, companyId: request.user?.companyId }, "Failed to create conversation");
            return reply.code(500).send({ error: "Kreiranje konverzacije nije uspelo." });
        }
    });
};
export default conversationsRoutes;
