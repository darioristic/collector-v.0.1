import { cookies } from "next/headers";
import { cache } from "react";
import { SESSION_COOKIE_NAME } from "@/lib/session-constants";
import { getApiUrl } from "@/src/lib/fetch-utils";

export type AuthCompany = {
	id: string;
	name: string;
	slug: string;
	domain: string | null;
	role: string | null;
};

export type AuthSession = {
	token: string;
	expiresAt: string;
};

export type AuthUser = {
	id: string;
	email: string;
	name: string;
	status: string;
	defaultCompanyId: string | null;
	company: AuthCompany | null;
};

export type AuthPayload = {
	user: AuthUser;
	session: AuthSession;
};

type BackendResponse = {
	data?: AuthPayload;
	error?: string;
	message?: string;
};

export const getCurrentAuth = cache(async (): Promise<AuthPayload | null> => {
	const startTime = Date.now();

	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

		if (!sessionToken) {
			const allCookies = cookieStore.getAll();
			console.error("[auth] No session token found in cookies", {
				cookieName: SESSION_COOKIE_NAME,
				allCookies: allCookies.map((c) => c.name),
				cookieCount: allCookies.length,
			});
			return null;
		}

		console.log("[auth] Starting auth check for session token");
		const apiUrl = getApiUrl("/auth/me");
		console.log("[auth] Fetching from:", apiUrl);

		let response: Response;

		try {
			// Add timeout to prevent hanging requests (reduced to 3 seconds for faster failure)
			const controller = new AbortController();
			const timeoutId = setTimeout(() => {
				console.error("[auth] Request timeout triggered, aborting...");
				controller.abort();
			}, 3000); // 3 second timeout

			try {
				response = await fetch(apiUrl, {
					method: "GET",
					headers: {
						Authorization: `Bearer ${sessionToken}`,
						"x-session-token": sessionToken,
					},
					cache: "no-store",
					signal: controller.signal,
				});
				console.log("[auth] Fetch completed, status:", response.status);
			} finally {
				clearTimeout(timeoutId);
			}
		} catch (error) {
			if (error instanceof Error && error.name === "AbortError") {
				console.error("[auth] Request to /auth/me timed out after 3 seconds");
			} else {
				console.error("[auth] Failed to reach /auth/me endpoint", error);
			}
			return null;
		}

		const payload = (await response.json().catch((err) => {
			console.error("[auth] Failed to parse JSON response", err);
			return null;
		})) as BackendResponse | null;

		if (!response.ok) {
			if (response.status === 401) {
				console.error("[auth] Unauthorized (401) from backend API", {
					url: apiUrl,
					status: response.status,
					statusText: response.statusText,
					payload: payload ? JSON.stringify(payload) : "No payload",
					hasToken: !!sessionToken,
					tokenLength: sessionToken?.length ?? 0,
				});
				return null;
			}

			const message =
				(payload?.message ?? payload?.error)?.toString() ??
				`Auth check failed with status ${response.status}.`;

			console.error("[auth] Auth verification failed", {
				status: response.status,
				statusText: response.statusText,
				url: apiUrl,
				message,
				payload: payload ? JSON.stringify(payload) : "No payload",
			});
			return null;
		}

		if (!payload?.data) {
			console.warn(
				"[auth] Auth payload is missing data. Treating as unauthenticated.",
			);
			return null;
		}

		const elapsed = Date.now() - startTime;
		console.log(`[auth] Auth check successful in ${elapsed}ms`);
		return payload.data;
	} catch (error) {
		const elapsed = Date.now() - startTime;
		console.error(
			`[auth] Unexpected error in getCurrentAuth after ${elapsed}ms:`,
			error,
		);
		// Always return null on error to prevent blocking
		return null;
	}
});
