import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";

export interface JWTPayload {
    userId: string;
    companyId: string;
    email: string;
    [key: string]: unknown;
}

export interface SessionUser {
    userId: string;
    companyId: string;
    email: string;
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
        user?: SessionUser;
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

    // Try JWT first
    try {
        const payload = validateJWT(token);
        request.user = {
            userId: payload.userId,
            companyId: payload.companyId,
            email: payload.email,
        };
        return;
    } catch (_jwtError) {
        // Fallback: treat token as session token (same as chat service)
        try {
            const result = await db.execute(sql`
                SELECT 
                    s.user_id as "userId",
                    s.company_id as "companyId",
                    s.expires_at as "expiresAt",
                    u.email as "userEmail"
                FROM auth_sessions s
                INNER JOIN users u ON s.user_id = u.id
                WHERE s.token = ${token}
                    AND s.expires_at > NOW()
                LIMIT 1
            `);

            const session = result.rows[0] as
                | { userId: string; companyId: string | null; expiresAt: Date; userEmail: string }
                | undefined;

            if (!session) {
                return reply.code(401).send({ error: "Invalid or expired token" });
            }

            let companyId = session.companyId;
            if (!companyId) {
                const companyResult = await db.execute(sql`
                    SELECT company_id as "companyId"
                    FROM company_users
                    WHERE user_id = ${session.userId}
                    LIMIT 1
                `);
                companyId = (companyResult.rows[0] as { companyId: string } | undefined)?.companyId || null;
            }

            if (!companyId) {
                return reply.code(401).send({ error: "User is not associated with any company" });
            }

            request.user = {
                userId: session.userId,
                companyId,
                email: session.userEmail,
            };
            return;
        } catch (_sessionError) {
            return reply.code(401).send({ error: "Invalid or expired token" });
        }
    }
}
