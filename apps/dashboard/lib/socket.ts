import type { Server as SocketIOServer } from "socket.io";

declare global {
	// eslint-disable-next-line no-var
	var __notification_io: SocketIOServer | undefined;
}

export const setNotificationSocketServer = (server: SocketIOServer) => {
	globalThis.__notification_io = server;
};

export const getNotificationSocketServer = (): SocketIOServer | null => {
	return globalThis.__notification_io ?? null;
};

export const emitNotification = (
	userId: string,
	event: string,
	payload: unknown,
) => {
	if (typeof userId !== "string" || userId.length === 0) {
		return;
	}

	const server = getNotificationSocketServer();
	if (!server) {
		return;
	}

	server.to(`user:${userId}`).emit(event, payload);
};

