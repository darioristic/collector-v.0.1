import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import {
	backendErrorResponse,
	createJsonError,
	forwardAuthRequest,
	SESSION_COOKIE_NAME,
	setSessionCookie,
} from "../_utils";

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

export async function GET(_request: NextRequest) {
	const cookieStore = await cookies();
	const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

	if (!sessionToken) {
		return createJsonError(401, "TOKEN_REQUIRED", "Session token nedostaje.");
	}

	const { response, payload } = await forwardAuthRequest<AuthBackendResponse>(
		"me",
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${sessionToken}`,
				"x-session-token": sessionToken,
			},
		},
	);

	if (!response.ok) {
		return backendErrorResponse(
			response,
			payload,
			"AUTH_ME_FAILED",
			"Provera sesije nije uspela.",
		);
	}

	const nextResponse = NextResponse.json(payload, { status: response.status });
	setSessionCookie(nextResponse, payload?.data?.session);

	return nextResponse;
}
