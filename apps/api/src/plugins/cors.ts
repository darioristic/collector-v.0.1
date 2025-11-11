import type { FastifyPluginAsync, FastifyReply } from "fastify";

const defaultOrigins = new Set([
	"http://localhost:3000",
	"http://localhost:3001",
	"http://127.0.0.1:3000",
	"http://127.0.0.1:3001",
	"http://0.0.0.0:3000",
	"http://0.0.0.0:3001",
]);

const envOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
	.split(",")
	.map((value) => value.trim())
	.filter(Boolean);

const allowedOrigins = new Set([...defaultOrigins, ...envOrigins]);

const isOriginAllowed = (origin: string): boolean => {
	if (allowedOrigins.has(origin)) {
		return true;
	}

	if (process.env.NODE_ENV !== "production") {
		try {
			const parsed = new URL(origin);

			if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
				return true;
			}
		} catch {
			return false;
		}
	}

	return false;
};

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const ALLOWED_HEADERS = ["Content-Type", "Authorization"];

const applyCorsHeaders = (reply: FastifyReply, origin: string) => {
	reply.header("Access-Control-Allow-Origin", origin);
	reply.header("Access-Control-Allow-Credentials", "true");
	reply.header("Access-Control-Allow-Methods", ALLOWED_METHODS.join(","));
	reply.header("Access-Control-Allow-Headers", ALLOWED_HEADERS.join(","));
	reply.header("Vary", "Origin");
};

const corsPlugin: FastifyPluginAsync = async (fastify) => {
	fastify.addHook("onRequest", (request, reply, done) => {
		const originHeader = request.headers.origin;

		if (!originHeader) {
			fastify.log.trace("CORS: no origin header present");
			done();
			return;
		}

		if (!isOriginAllowed(originHeader)) {
			fastify.log.warn({ origin: originHeader }, "Blocked CORS request");
			done();
			return;
		}

		fastify.log.debug({ origin: originHeader }, "CORS: applying headers");
		applyCorsHeaders(reply, originHeader);

		if (request.method === "OPTIONS") {
			reply.code(204).header("Content-Length", "0").send();
			return;
		}

		done();
	});
};

export default corsPlugin;
