import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
// Extract token from Authorization header
function extractTokenFromHeader(authHeader) {
    if (!authHeader) {
        return null;
    }
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return null;
    }
    return parts[1];
}
// Extract session token from cookie header
function extractTokenFromCookie(cookieHeader) {
    if (!cookieHeader) {
        return null;
    }
    // Parse cookies from header like: "cookie1=value1; cookie2=value2"
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const sessionCookie = cookies.find((c) => c.startsWith("auth_session="));
    if (!sessionCookie) {
        return null;
    }
    // Extract value after "auth_session="
    const token = sessionCookie.split("=")[1];
    return token ? decodeURIComponent(token) : null;
}
export function setupSocketHandlers(io, redis) {
    console.log("[chat-service] 🔧 Setting up Socket.IO middleware and handlers");
    io.use(async (socket, next) => {
        console.log("[chat-service] 🔐 Socket authentication middleware triggered", {
            socketId: socket.id,
            hasAuthHeader: !!socket.handshake.headers.authorization,
            hasAuthObject: !!socket.handshake.auth,
            hasQuery: !!socket.handshake.query,
            hasCookie: !!socket.handshake.headers.cookie,
            transport: socket.conn.transport.name,
        });
        // Try to get token from Authorization header first (for HTTP transport)
        let token = extractTokenFromHeader(socket.handshake.headers.authorization);
        // If not in header, try to get from auth object (Socket.IO auth)
        if (!token && socket.handshake.auth) {
            token = socket.handshake.auth?.token || null;
        }
        // If still not found, try query parameter (for WebSocket transport)
        if (!token && socket.handshake.query) {
            token = socket.handshake.query?.token || null;
        }
        // If still not found, try to get from cookie header (for httpOnly cookies)
        if (!token && socket.handshake.headers.cookie) {
            token = extractTokenFromCookie(socket.handshake.headers.cookie);
            if (token) {
                console.log("[chat-service] 🍪 Token extracted from cookie header");
            }
        }
        if (!token) {
            console.error("[chat-service] ❌ Socket authentication failed: No token found", {
                hasAuthHeader: !!socket.handshake.headers.authorization,
                authHeaderValue: socket.handshake.headers.authorization
                    ? `${socket.handshake.headers.authorization.substring(0, 20)}...`
                    : "none",
                hasAuthObject: !!socket.handshake.auth,
                authObjectKeys: socket.handshake.auth
                    ? Object.keys(socket.handshake.auth)
                    : [],
                hasQuery: !!socket.handshake.query,
                queryKeys: socket.handshake.query
                    ? Object.keys(socket.handshake.query)
                    : [],
                hasCookie: !!socket.handshake.headers.cookie,
                cookiePreview: socket.handshake.headers.cookie
                    ? socket.handshake.headers.cookie.substring(0, 100) + "..."
                    : "none",
            });
            return next(new Error("Authentication error"));
        }
        console.log("[chat-service] ✅ Socket authentication token found:", `${token.substring(0, 10)}...`);
        try {
            // Validate session token from database (same as auth middleware)
            const result = await db.execute(sql `
				SELECT 
					s.user_id as "userId",
					s.company_id as "companyId",
					s.expires_at as "expiresAt",
					u.email as "userEmail"
				FROM auth_sessions s
				INNER JOIN users u ON s.user_id = u.id
				WHERE s.token = ${token}
					AND s.expires_at > NOW()
				LIMIT 1
			`);
            const session = result.rows[0];
            if (!session) {
                return next(new Error("Authentication error"));
            }
            // Get companyId from session or from company_users
            let companyId = session.companyId;
            if (!companyId) {
                const companyResult = await db.execute(sql `
					SELECT company_id as "companyId"
					FROM company_users
					WHERE user_id = ${session.userId}
					LIMIT 1
				`);
                companyId =
                    companyResult.rows[0]
                        ?.companyId || null;
            }
            if (!companyId) {
                return next(new Error("User is not associated with any company"));
            }
            socket.data.user = {
                userId: session.userId,
                companyId: companyId,
                email: session.userEmail,
            };
            next();
        }
        catch (error) {
            console.error("[chat-service] Socket auth error:", error);
            next(new Error("Authentication error"));
        }
    });
    io.on("connection", async (socket) => {
        const user = socket.data.user;
        if (!user) {
            socket.disconnect();
            return;
        }
        console.log(`[chat-service] Socket connected: ${socket.id} (user: ${user.userId}, company: ${user.companyId})`);
        // Join user's notification room and company room first
        socket.join(`user:${user.userId}`);
        socket.join(`company:${user.companyId}`);
        // Update user status to online (this will emit status update to all users in company)
        await updateUserStatus(user.userId, user.companyId, "online", io, redis);
        // Send initial statuses of all users in company to the newly connected user
        try {
            const companyUsers = await db.execute(sql `
				SELECT 
					id,
					status
				FROM teamchat_users
				WHERE company_id = ${user.companyId}
					AND id != ${user.userId}
			`);
            // Emit initial statuses to the newly connected user only (not to all)
            for (const row of companyUsers.rows) {
                const userStatus = row;
                // Send directly to this socket only
                socket.emit("user:status:update", {
                    userId: userStatus.id,
                    status: userStatus.status,
                    timestamp: new Date().toISOString(),
                });
            }
            console.log(`[chat-service] Sent initial statuses for ${companyUsers.rows.length} users to user ${user.userId}`);
        }
        catch (error) {
            console.error("[chat-service] Error sending initial statuses:", error);
        }
        // Handle channel joins
        socket.on("join", (payload) => {
            if (payload?.channelId) {
                socket.join(`channel:${payload.channelId}`);
                socket.join(`company:${user.companyId}:channel:${payload.channelId}`);
                console.log(`[chat-service] Socket ${socket.id} joined channel: ${payload.channelId}`);
            }
            if (payload?.conversationId) {
                socket.join(`chat:${payload.conversationId}`);
                console.log(`[chat-service] Socket ${socket.id} joined conversation: ${payload.conversationId}`);
            }
        });
        // Presence sync: respond with current statuses for all company users
        socket.on("users:online:request", async (_payload) => {
            try {
                const companyUsers = await db.execute(sql `
						SELECT id as "userId", status
						FROM teamchat_users
						WHERE company_id = ${user.companyId}
					`);
                const users = companyUsers.rows.map((row) => ({ userId: row.userId, status: row.status || "offline" }));
                // Emit only to the requesting socket
                socket.emit("users:online", { users });
                console.log(`[chat-service] Sent users:online list (${users.length}) to user ${user.userId}`);
            }
            catch (error) {
                console.error("[chat-service] Error responding to users:online:request", error);
            }
        });
        // Handle leaving rooms
        socket.on("leave", (payload) => {
            if (payload?.channelId) {
                socket.leave(`channel:${payload.channelId}`);
                socket.leave(`company:${user.companyId}:channel:${payload.channelId}`);
                console.log(`[chat-service] Socket ${socket.id} left channel: ${payload.channelId}`);
            }
            if (payload?.conversationId) {
                socket.leave(`chat:${payload.conversationId}`);
                console.log(`[chat-service] Socket ${socket.id} left conversation: ${payload.conversationId}`);
            }
        });
        socket.on("disconnect", async () => {
            console.log(`[chat-service] Socket disconnected: ${socket.id}`);
            // Check if user has any other active connections
            const sockets = await io.in(`user:${user.userId}`).fetchSockets();
            if (sockets.length === 0) {
                // No other connections, set status to offline
                await updateUserStatus(user.userId, user.companyId, "offline", io, redis);
            }
        });
        socket.on("error", (err) => {
            console.error(`[chat-service] Socket error: ${err}`);
        });
    });
}
/**
 * Update user status in database and emit status update event
 */
async function updateUserStatus(userId, companyId, status, io, redis) {
    try {
        // Update status in database
        await db.execute(sql `
			UPDATE teamchat_users
			SET status = ${status},
				updated_at = NOW()
			WHERE id = ${userId}
				AND company_id = ${companyId}
		`);
        // Emit status update to company room
        io.to(`company:${companyId}`).emit("user:status:update", {
            userId,
            status,
            timestamp: new Date().toISOString(),
        });
        // Publish status update to Redis for notification service
        await redis.publish("events:user_status_update", JSON.stringify({
            userId,
            companyId,
            status,
            timestamp: new Date().toISOString(),
        }));
        console.log(`[chat-service] User ${userId} status updated to ${status}`);
    }
    catch (error) {
        console.error(`[chat-service] Error updating user status:`, error);
    }
}
