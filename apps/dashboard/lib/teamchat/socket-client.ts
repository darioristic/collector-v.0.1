import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getTeamChatSocket = (): Socket => {
	if (!socket) {
		socket = io({
			path: "/api/teamchat/socket",
			transports: ["websocket"],
		});
	}
	return socket;
};

export const disconnectTeamChatSocket = () => {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
};
