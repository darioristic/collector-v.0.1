import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocketUrl = (): string => {
	// Use environment variable or default to chat-service:4001
	const serviceUrl = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:4001";
	return serviceUrl;
};

export const getChatSocket = (): Socket => {
	if (!socket) {
		const socketUrl = getSocketUrl();
		socket = io(socketUrl, {
			path: "/socket/teamchat",
			transports: ["websocket"],
			withCredentials: true,
		});
	}
	return socket;
};

export const disconnectChatSocket = () => {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
};
