import { type NextRequest, NextResponse } from "next/server";

import {
	backendErrorResponse,
	createJsonError,
	forwardAuthRequest,
	readRequestJson,
	setSessionCookie,
} from "../_utils";

type LoginBody = {
	email: string;
	password: string;
};

type AuthBackendResponse = {
	data?: {
		user: Record<string, unknown>;
		session?: {
			token: string;
			expiresAt: string;
		};
	};
	statusCode?: number;
	error?: string;
	message?: string;
};

export async function POST(request: NextRequest) {
	const body = await readRequestJson<LoginBody>(request);

	if (!body) {
		return createJsonError(400, "INVALID_BODY", "Nevalidan payload.");
	}

	// Try employees login first (new authentication system)
	try {
		// Import and call employees login handler directly
		const { POST: employeesLoginPOST } = await import("../employees-login/route");
		const employeesLoginResponse = await employeesLoginPOST(request);

        if (employeesLoginResponse.ok) {
            return employeesLoginResponse;
        }

		// If employees login fails with 401/403, return that error
		if (
			employeesLoginResponse.status === 401 ||
			employeesLoginResponse.status === 403
		) {
			return employeesLoginResponse;
		}
	} catch (error) {
		// If employees login endpoint doesn't exist or fails, fall back to API
		if (process.env.NODE_ENV === "development") {
			console.warn(
				"[Next.js API /auth/login] Employees login failed, falling back to API:",
				error,
			);
		}
	}

	// Fallback to API server authentication
	const { response, payload } = await forwardAuthRequest<AuthBackendResponse>(
		"login",
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);

	if (!response.ok) {
		// Log error details in development
		if (process.env.NODE_ENV === "development") {
			console.error("[Next.js API /auth/login] Login failed:", {
				status: response.status,
				error: payload?.error,
				message: payload?.message,
			});
		}

		return backendErrorResponse(
			response,
			payload,
			"AUTH_LOGIN_FAILED",
			"Prijava nije uspela.",
		);
	}

	const nextResponse = NextResponse.json(payload, { status: response.status });
	setSessionCookie(nextResponse, payload?.data?.session);

	return nextResponse;
}
