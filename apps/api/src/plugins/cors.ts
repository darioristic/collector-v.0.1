import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";

const STATIC_ALLOWED_ORIGINS = new Set([
	"http://localhost:3000",
	"http://localhost:3001",
	"https://localhost:3000",
	"https://localhost:3001",
	"http://127.0.0.1:3000",
	"http://127.0.0.1:3001",
	"https://127.0.0.1:3000",
	"https://127.0.0.1:3001",
	"http://0.0.0.0:3000",
	"http://0.0.0.0:3001",
	"https://0.0.0.0:3000",
	"https://0.0.0.0:3001",
	"http://192.168.0.3:3000",
	"https://192.168.0.3:3000",
]);

const envOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
	.split(",")
	.map((value) => value.trim())
	.filter(Boolean);

for (const origin of envOrigins) {
	STATIC_ALLOWED_ORIGINS.add(origin);
}

const isDevelopment = process.env.NODE_ENV !== "production";

const isLocalhostLike = (origin: string) => {
	try {
		const url = new URL(origin);
		return ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
	} catch {
		return false;
	}
};

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const ALLOWED_HEADERS = [
	"Accept",
	"Accept-Language",
	"Content-Type",
	"Authorization",
	"X-Requested-With",
	"X-CSRF-Token",
];
const EXPOSED_HEADERS = ["Content-Disposition"];

const isOriginAllowed = (origin: string | undefined): boolean => {
	if (!origin) return true;
	if (STATIC_ALLOWED_ORIGINS.has(origin)) return true;
	if (isDevelopment && isLocalhostLike(origin)) return true;
	return false;
};

const corsPlugin: FastifyPluginAsync = async (fastify) => {
	// Add CORS headers to all requests
	fastify.addHook('onRequest', (request: FastifyRequest, reply: FastifyReply, done) => {
		const origin = request.headers.origin;

		// Always add CORS headers for allowed origins
		if (origin && isOriginAllowed(origin)) {
			reply.header('Access-Control-Allow-Origin', origin);
			reply.header('Access-Control-Allow-Credentials', 'true');
			reply.header('Access-Control-Expose-Headers', EXPOSED_HEADERS.join(', '));
		}

		// Handle preflight OPTIONS requests
		if (request.method === 'OPTIONS') {
			reply.header('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
			reply.header('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
			reply.header('Access-Control-Max-Age', '3600');
			reply.code(204).send();
		} else {
			done();
		}
	});
};

export default fp(corsPlugin, {
	name: 'cors-plugin',
	fastify: '4.x'
});
