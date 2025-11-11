import type { NextApiRequest } from "next";
import type { NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import type { Socket } from "net";
import { Server as SocketIOServer } from "socket.io";

import { setNotificationSocketServer } from "@/lib/socket";

type NextApiResponseWithSocket = NextApiResponse & {
	socket: Socket & {
		server: HTTPServer & {
			notificationIo?: SocketIOServer;
		};
	};
};

export const config = {
	api: {
		bodyParser: false,
	},
};

const joinUserRoom = (
	socket: import("socket.io").Socket,
	userId: string | null,
) => {
	if (typeof userId === "string" && userId.length > 0) {
		socket.join(`user:${userId}`);
	}
};

const handler = (_req: NextApiRequest, res: NextApiResponseWithSocket) => {
	if (!res.socket.server.notificationIo) {
		const io = new SocketIOServer(res.socket.server, {
			path: "/api/notifications/socket",
			addTrailingSlash: false,
			serveClient: false,
			cors: {
				origin: process.env.NOTIFICATIONS_SOCKET_CORS ?? "*",
			},
		});

		io.on("connection", (socket) => {
			const handshakeUserId =
				typeof socket.handshake.query.userId === "string"
					? socket.handshake.query.userId
					: null;

			joinUserRoom(socket, handshakeUserId);

			socket.on("join", (payload: { userId?: string }) => {
				joinUserRoom(socket, payload?.userId ?? null);
			});
		});

		res.socket.server.notificationIo = io;
		setNotificationSocketServer(io);
	}

	res.end();
};

export default handler;
