import type { NextApiRequest } from "next";
import type { NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import type { Socket } from "net";
import { Server as SocketIOServer } from "socket.io";

import { setSocketServer } from "@/lib/teamchat/socket-server";

type NextApiResponseWithSocket = NextApiResponse & {
	socket: Socket & {
		server: HTTPServer & {
			io?: SocketIOServer;
		};
	};
};

export const config = {
	api: {
		bodyParser: false,
	},
};

const handler = (_req: NextApiRequest, res: NextApiResponseWithSocket) => {
	if (!res.socket.server.io) {
		const io = new SocketIOServer(res.socket.server, {
			path: "/api/teamchat/socket",
			addTrailingSlash: false,
			serveClient: false,
			cors: {
				origin: "*",
			},
		});

		io.on("connection", (socket) => {
			socket.on("channel:join", ({ channelId }: { channelId: string }) => {
				if (channelId) {
					socket.join(channelId);
					socket.emit("channel:joined", { channelId });
				}
			});
		});

		res.socket.server.io = io;
		setSocketServer(io);
	}

	res.end();
};

export default handler;
