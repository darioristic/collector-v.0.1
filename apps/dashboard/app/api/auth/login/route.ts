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

	const { response, payload } = await forwardAuthRequest<AuthBackendResponse>(
		"login",
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);

	if (!response.ok) {
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
