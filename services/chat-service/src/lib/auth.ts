import { sql } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db/index.js";

// Extract token from Authorization header
function extractTokenFromHeader(authHeader: string | undefined): string | null {
	if (!authHeader) {
		return null;
	}

	const parts = authHeader.split(" ");
	if (parts.length !== 2 || parts[0] !== "Bearer") {
		return null;
	}

	return parts[1];
}

export interface SessionUser {
	userId: string;
	companyId: string;
	email: string;
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
		request.log.warn(
			{
				authorization: request.headers.authorization ? "present" : "missing",
				xSessionToken: request.headers["x-session-token"]
					? "present"
					: "missing",
			},
			"No token found in request",
		);
		return reply.code(401).send({ error: "Unauthorized" });
	}

	try {
		request.log.debug(
			{ tokenLength: token.length },
			"Validating session token",
		);
		// Validate session token from database using raw SQL
		// Chat service uses the same database as API, so we can access auth_sessions and users tables
		// Use Drizzle's sql template which handles parameterization automatically
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
			| {
					userId: string;
					companyId: string | null;
					expiresAt: Date;
					userEmail: string;
			  }
			| undefined;

		if (!session) {
			request.log.warn(
				{ tokenLength: token.length, tokenPrefix: token.substring(0, 10) },
				"Session not found or expired",
			);
			return reply.code(401).send({ error: "Invalid or expired token" });
		}

		// Get companyId from session or from company_users
		let companyId = session.companyId;
		if (!companyId) {
			const companyResult = await db.execute(sql`
        SELECT company_id as "companyId"
        FROM company_users
        WHERE user_id = ${session.userId}
        LIMIT 1
      `);
			companyId =
				(companyResult.rows[0] as { companyId: string } | undefined)
					?.companyId || null;
		}

		if (!companyId) {
			return reply
				.code(401)
				.send({ error: "User is not associated with any company" });
		}

		request.user = {
			userId: session.userId,
			companyId: companyId,
			email: session.userEmail,
		};
	} catch (error) {
		request.log.error({ err: error }, "Auth middleware error");
		return reply.code(401).send({ error: "Invalid or expired token" });
	}
}
