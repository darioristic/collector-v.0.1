import { extractTokenFromHeader, validateJWT } from "../lib/auth.js";
export function setupSocketHandlers(io, _redis) {
    io.use(async (socket, next) => {
        const token = extractTokenFromHeader(socket.handshake.headers.authorization);
        if (!token) {
            const userId = socket.handshake.query.userId;
            if (typeof userId === "string" && userId) {
                // Allow connection with userId in query for backward compatibility
                socket.data.userId = userId;
                return next();
            }
            return next(new Error("Authentication error"));
        }
        try {
            const payload = validateJWT(token);
            socket.data.user = payload;
            socket.data.userId = payload.userId;
            next();
        }
        catch {
            next(new Error("Authentication error"));
        }
    });
    io.on("connection", (socket) => {
        const userId = socket.data.userId;
        if (!userId) {
            socket.disconnect();
            return;
        }
        console.log(`[notification-service] Socket connected: ${socket.id} (user: ${userId})`);
        // Join user's notification room
        socket.join(`user:${userId}`);
        socket.on("join", (payload) => {
            const targetUserId = payload?.userId || userId;
            if (targetUserId) {
                socket.join(`user:${targetUserId}`);
                console.log(`[notification-service] Socket joined user room: ${targetUserId}`);
            }
        });
        socket.on("disconnect", () => {
            console.log(`[notification-service] Socket disconnected: ${socket.id}`);
        });
        socket.on("error", (err) => {
            console.error(`[notification-service] Socket error: ${err}`);
        });
    });
}
