import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

export interface JWTPayload {
	userId: string;
	companyId: string;
	email: string;
	[key: string]: unknown;
}

export function validateJWT(token: string): JWTPayload {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("JWT_SECRET is not configured");
	}

	try {
		const payload = jwt.verify(token, secret) as JWTPayload;
		return payload;
  } catch (error) {
    const err = error as { name?: string };
    if (err?.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }
    if (err?.name === "TokenExpiredError") {
      throw new Error("Token expired");
    }
    throw error;
  }
}

export function extractTokenFromHeader(
	authHeader: string | undefined,
): string | null {
	if (!authHeader) {
		return null;
	}

	const parts = authHeader.split(" ");
	if (parts.length !== 2 || parts[0] !== "Bearer") {
		return null;
	}

	return parts[1];
}

declare module "fastify" {
	interface FastifyRequest {
		user?: JWTPayload;
	}
}

export async function authMiddleware(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<void> {
	const token = extractTokenFromHeader(request.headers.authorization);

	if (!token) {
		return reply.code(401).send({ error: "Unauthorized" });
	}

	try {
		const payload = validateJWT(token);
		request.user = payload;
	} catch {
		return reply.code(401).send({ error: "Invalid or expired token" });
	}
}
