#!/usr/bin/env bun

/**
 * Standalone Socket.IO Server
 * 
 * Ovaj server pokreće socket.io servise za notifikacije i team chat
 * nezavisno od Next.js servera. Ovo omogućava bolju izolaciju i lakše
 * održavanje.
 */

import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

const port = parseInt(process.env.SOCKET_PORT || "4002", 10);
const hostname = process.env.SOCKET_HOST || "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";

console.log("[socket-server] ========================================");
console.log("[socket-server] SOCKET.IO SERVER STARTING");
console.log("[socket-server] ========================================");
console.log("[socket-server] Port:", port);
console.log("[socket-server] Host:", hostname);
console.log("[socket-server] Environment:", dev ? "development" : "production");

// Create HTTP server for Socket.IO
const httpServer = createServer();

// Notification Socket.IO Server
const notificationIo = new SocketIOServer(httpServer, {
	path: "/socket/notifications",
	addTrailingSlash: false,
	serveClient: false,
	cors: {
		origin: dev ? "*" : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
		methods: ["GET", "POST"],
		credentials: true,
	},
	allowEIO3: true,
});

// Team Chat Socket.IO Server
const teamchatIo = new SocketIOServer(httpServer, {
	path: "/socket/teamchat",
	addTrailingSlash: false,
	serveClient: false,
	cors: {
		origin: dev ? "*" : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
		methods: ["GET", "POST"],
		credentials: true,
	},
	allowEIO3: true,
});

// Notification Socket Handlers
notificationIo.on("connection", (socket) => {
	console.log("[socket-server] Notification socket connected:", socket.id);

	const handshakeUserId =
		typeof socket.handshake.query.userId === "string"
			? socket.handshake.query.userId
			: null;

	const joinUserRoom = (sock: typeof socket, userId: string | null) => {
		if (userId) {
			sock.join(`user:${userId}`);
			console.log(`[socket-server] User ${userId} joined notification room`);
		}
	};

	joinUserRoom(socket, handshakeUserId);

	socket.on("join", (payload: { userId?: string }) => {
		joinUserRoom(socket, payload?.userId ?? null);
	});

	socket.on("disconnect", () => {
		console.log("[socket-server] Notification socket disconnected:", socket.id);
	});

	socket.on("error", (err) => {
		console.error("[socket-server] Notification socket error:", err);
	});
});

notificationIo.engine.on("connection_error", (err) => {
	console.error("[socket-server] Notification socket engine error:", err);
});

// Team Chat Socket Handlers
teamchatIo.on("connection", (socket) => {
	console.log("[socket-server] TeamChat socket connected:", socket.id);

	const channelId =
		typeof socket.handshake.query.channelId === "string"
			? socket.handshake.query.channelId
			: null;

	if (channelId) {
		socket.join(`channel:${channelId}`);
		console.log(`[socket-server] Socket joined channel: ${channelId}`);
	}

	socket.on("join", (payload: { channelId?: string }) => {
		if (payload?.channelId) {
			socket.join(`channel:${payload.channelId}`);
			console.log(`[socket-server] Socket joined channel: ${payload.channelId}`);
		}
	});

	socket.on("disconnect", () => {
		console.log("[socket-server] TeamChat socket disconnected:", socket.id);
	});

	socket.on("error", (err) => {
		console.error("[socket-server] TeamChat socket error:", err);
	});
});

teamchatIo.engine.on("connection_error", (err) => {
	console.error("[socket-server] TeamChat socket engine error:", err);
});

// HTTP endpoint for emitting notifications (used by Next.js API routes)
httpServer.on("request", (req, res) => {
	if (req.method === "POST" && req.url === "/api/notifications/emit") {
		let body = "";
		req.on("data", (chunk) => {
			body += chunk.toString();
		});
		req.on("end", () => {
			try {
				const { userId, event, payload } = JSON.parse(body);
				if (userId && event) {
					notificationIo.to(`user:${userId}`).emit(event, payload);
					res.writeHead(200, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ success: true }));
				} else {
					res.writeHead(400, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ error: "Missing userId or event" }));
				}
            } catch {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Invalid JSON" }));
            }
		});
	} else {
		res.writeHead(404, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: "Not found" }));
	}
});

// Start server
httpServer.listen(port, hostname, () => {
	console.log("[socket-server] ========================================");
	console.log(`[socket-server] Socket.IO server listening on http://${hostname}:${port}`);
	console.log("[socket-server] Notification path: /socket/notifications");
	console.log("[socket-server] TeamChat path: /socket/teamchat");
	console.log("[socket-server] HTTP API: /api/notifications/emit");
	console.log("[socket-server] ========================================");
});

// Graceful shutdown
process.on("SIGTERM", () => {
	console.log("[socket-server] SIGTERM received, shutting down gracefully...");
	httpServer.close(() => {
		console.log("[socket-server] Server closed");
		process.exit(0);
	});
});

process.on("SIGINT", () => {
	console.log("[socket-server] SIGINT received, shutting down gracefully...");
	httpServer.close(() => {
		console.log("[socket-server] Server closed");
		process.exit(0);
	});
});

