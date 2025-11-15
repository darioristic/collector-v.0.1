import { db } from "../db/index.js";
import { companies } from "../db/schema/core.js";
import { teamchatUsers, teamchatChannels, teamchatChannelMembers, } from "../db/schema/teamchat.js";
import { eq, and } from "drizzle-orm";
import { listChannels, listDirectMessageTargets } from "../lib/teamchat-repository.js";
import { authMiddleware } from "../lib/auth.js";
const bootstrapRoutes = async (fastify) => {
    fastify.addHook("onRequest", authMiddleware);
    fastify.get("/", async (request, reply) => {
        if (!request.user) {
            return reply.code(401).send({ error: "Unauthorized" });
        }
        try {
            // Upsert company
            const [company] = await db
                .insert(companies)
                .values({
                id: request.user.companyId,
                name: request.user.companyId, // You may want to fetch this from main API
                slug: request.user.companyId,
                domain: null,
            })
                .onConflictDoUpdate({
                target: companies.id,
                set: {
                    updatedAt: new Date(),
                },
            })
                .returning();
            if (!company) {
                throw new Error("Failed to upsert company");
            }
            // Upsert user
            const userName = request.user.email.split("@")[0].split(".");
            const firstName = userName[0] || "";
            const lastName = userName.slice(1).join(" ") || "";
            const [user] = await db
                .insert(teamchatUsers)
                .values({
                id: request.user.userId,
                firstName,
                lastName,
                email: request.user.email,
                companyId: company.id,
                status: "online",
            })
                .onConflictDoUpdate({
                target: teamchatUsers.email,
                set: {
                    firstName,
                    lastName,
                    companyId: company.id,
                    updatedAt: new Date(),
                },
            })
                .returning();
            if (!user) {
                throw new Error("Failed to upsert user");
            }
            // Ensure general channel exists
            const [generalChannel] = await db
                .insert(teamchatChannels)
                .values({
                name: "general",
                isPrivate: false,
                companyId: company.id,
                metadata: null,
            })
                .onConflictDoNothing()
                .returning();
            if (generalChannel) {
                // Add all users to general channel
                const allUsers = await db
                    .select({ id: teamchatUsers.id })
                    .from(teamchatUsers)
                    .where(eq(teamchatUsers.companyId, company.id));
                await db
                    .insert(teamchatChannelMembers)
                    .values(allUsers.map((u) => ({
                    channelId: generalChannel.id,
                    userId: u.id,
                })))
                    .onConflictDoNothing();
            }
            else {
                // Find existing general channel
                const [existing] = await db
                    .select()
                    .from(teamchatChannels)
                    .where(and(eq(teamchatChannels.name, "general"), eq(teamchatChannels.companyId, company.id)))
                    .limit(1);
                if (existing) {
                    // Ensure user is member
                    await db
                        .insert(teamchatChannelMembers)
                        .values({
                        channelId: existing.id,
                        userId: user.id,
                    })
                        .onConflictDoNothing();
                }
            }
            // Get channels
            const cache = fastify.cache;
            const channels = await listChannels(company.id, user.id, cache);
            // Get direct message targets
            const directMessageTargets = await listDirectMessageTargets(company.id, user.id, cache);
            return reply.send({
                currentUser: {
                    id: user.id,
                    name: user.displayName ||
                        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                        user.email,
                    email: user.email,
                    avatarUrl: user.avatarUrl,
                    status: user.status,
                },
                channels,
                directMessageTargets,
            });
        }
        catch (error) {
            request.log.error(error, "Failed to bootstrap teamchat");
            return reply.code(500).send({ error: "Bootstrap nije uspeo." });
        }
    });
};
export default bootstrapRoutes;
