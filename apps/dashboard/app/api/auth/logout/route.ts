import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import {
	backendErrorResponse,
	clearSessionCookie,
	forwardAuthRequest,
	SESSION_COOKIE_NAME,
} from "../_utils";

export async function POST(_request: NextRequest) {
	const cookieStore = await cookies();
	const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

	if (!sessionToken) {
		const response = new NextResponse(null, { status: 204 });
		clearSessionCookie(response);
		return response;
	}

	const { response, payload } = await forwardAuthRequest("logout", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${sessionToken}`,
			"x-session-token": sessionToken,
			"Content-Type": "", // Explicitly prevent Content-Type header
		},
	});

	if (!response.ok) {
		return backendErrorResponse(
			response,
			payload,
			"AUTH_LOGOUT_FAILED",
			"Odjava nije uspela.",
		);
	}

	const nextResponse = new NextResponse(null, { status: 204 });
	clearSessionCookie(nextResponse);

	return nextResponse;
}
