import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session-constants";
import { getApiUrl } from "@/src/lib/fetch-utils";

// Re-export for backward compatibility
export { SESSION_COOKIE_NAME };

const isProduction = process.env.NODE_ENV === "production";

type BackendRequestInit = RequestInit & {
	headers?: HeadersInit;
};

type BackendResult<TData = unknown> = {
	response: Response;
	payload: TData | null;
};

export const buildAuthUrl = (path: string): string => {
	const cleanPath = path.startsWith("/") ? path.slice(1) : path;
	return getApiUrl(`/auth/${cleanPath}`);
};

export const parseJsonPayload = async <T>(
	response: Response,
): Promise<T | null> => {
	try {
		return (await response.json()) as T;
	} catch {
		return null;
	}
};

export const forwardAuthRequest = async <T = unknown>(
	path: string,
	init: BackendRequestInit,
): Promise<BackendResult<T>> => {
	const headers = new Headers(init.headers ?? {});

	// Remove Content-Type header if it's an empty string (explicitly disabled)
	const contentType = headers.get("content-type");
	if (contentType === "") {
		headers.delete("content-type");
	}

	// Only set Content-Type to application/json if there's a body
	// and Content-Type is not already set
	if (
		!headers.has("content-type") &&
		init.body !== undefined &&
		init.body !== null
	) {
		headers.set("Content-Type", "application/json");
	}

	const url = buildAuthUrl(path);

	// Only log in development mode
	const isDevelopment = process.env.NODE_ENV === "development";

	if (isDevelopment) {
		console.log("[forwardAuthRequest] Sending request to:", url);
		console.log("[forwardAuthRequest] Method:", init.method);
	}

	let response: Response;

	try {
		response = await fetch(url, {
			...init,
			headers,
			cache: "no-store",
		});

		if (isDevelopment) {
			console.log(
				"[forwardAuthRequest] Response status:",
				response.status,
				response.statusText,
			);
		}
	} catch (error) {
		// If fetch fails (network error, connection refused, etc.)
		console.error("[forwardAuthRequest] Fetch failed:", error);
		console.error("[forwardAuthRequest] URL:", url);

		// Return a mock response that indicates the error
		const errorResponse = new Response(
			JSON.stringify({
				statusCode: 503,
				error: "SERVICE_UNAVAILABLE",
				message:
					"Backend API server nije dostupan. Proverite da li je server pokrenut.",
			}),
			{
				status: 503,
				statusText: "Service Unavailable",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		return {
			response: errorResponse,
			payload: {
				statusCode: 503,
				error: "SERVICE_UNAVAILABLE",
				message:
					"Backend API server nije dostupan. Proverite da li je server pokrenut.",
			} as T,
		};
	}

	const payload = await parseJsonPayload<T>(response);

	return {
		response,
		payload,
	};
};

export const createJsonError = (
	status: number,
	error: string,
	message: string,
) =>
	NextResponse.json(
		{
			statusCode: status,
			error,
			message,
		},
		{ status },
	);

export const backendErrorResponse = (
	response: Response,
	payload: { error?: string; message?: string } | null,
	fallbackError: string,
	fallbackMessage: string,
) =>
	NextResponse.json(
		{
			statusCode: response.status,
			error: typeof payload?.error === "string" ? payload.error : fallbackError,
			message:
				typeof payload?.message === "string"
					? payload.message
					: fallbackMessage,
		},
		{ status: response.status },
	);

export const setSessionCookie = (
	response: NextResponse,
	session: { token: string; expiresAt: string } | null | undefined,
) => {
	if (!session) {
		return;
	}

	response.cookies.set({
		name: SESSION_COOKIE_NAME,
		value: session.token,
		httpOnly: true,
		sameSite: "lax",
		secure: isProduction,
		expires: new Date(session.expiresAt),
		path: "/",
	});
};

export const clearSessionCookie = (response: NextResponse) => {
	response.cookies.set({
		name: SESSION_COOKIE_NAME,
		value: "",
		httpOnly: true,
		sameSite: "lax",
		secure: isProduction,
		expires: new Date(0),
		path: "/",
	});
};

export const readRequestJson = async <T>(
	request: NextRequest,
): Promise<T | null> => {
	try {
		return (await request.json()) as T;
	} catch {
		return null;
	}
};
