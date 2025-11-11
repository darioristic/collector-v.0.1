import type { Server as SocketIOServer } from "socket.io";

declare global {
	// eslint-disable-next-line no-var
	var __teamchat_io: SocketIOServer | undefined;
}

export const setSocketServer = (server: SocketIOServer) => {
	globalThis.__teamchat_io = server;
};

export const getSocketServer = (): SocketIOServer | null => {
	return globalThis.__teamchat_io ?? null;
};
