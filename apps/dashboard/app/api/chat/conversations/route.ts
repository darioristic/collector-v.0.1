import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

const CHAT_SERVICE_URL =
	process.env.CHAT_SERVICE_URL ||
	process.env.NEXT_PUBLIC_CHAT_SERVICE_URL ||
	"http://localhost:4001";

export async function GET(_request: NextRequest) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

		if (!sessionToken) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		let response: Response;
		try {
			response = await fetch(`${CHAT_SERVICE_URL}/api/conversations`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${sessionToken}`,
					"x-session-token": sessionToken,
				},
				cache: "no-store",
			});
		} catch (fetchError) {
			const errorMessage =
				fetchError instanceof Error ? fetchError.message : String(fetchError);
			// Log as warning since this is an expected scenario when chat service is not running
			console.warn("[chat-api] Chat service unavailable (fetch failed):", {
				url: `${CHAT_SERVICE_URL}/api/conversations`,
				error: errorMessage,
				note: "This is expected if chat service is not running. Start it with: bun run dev",
			});
			return NextResponse.json(
				{
					error:
						"Chat servis nije dostupan. Proverite da li je servis pokrenut.",
					details: errorMessage,
				},
				{ status: 503 },
			);
		}

		const status = response.status;
		const statusText = response.statusText;
		const contentType = response.headers.get("content-type");

		let responseText = "";
		try {
			responseText = await response.text();
		} catch (readError) {
			console.error("[chat-api] Failed to read response body", {
				status,
				statusText,
				error:
					readError instanceof Error ? readError.message : String(readError),
			});
			return NextResponse.json(
				{
					error: "Neuspešno čitanje odgovora od chat servisa.",
					details:
						readError instanceof Error ? readError.message : String(readError),
				},
				{ status: 500 },
			);
		}

		if (!response.ok) {
			let errorData: { error?: string; details?: unknown } = {};
			const trimmedText = responseText?.trim();

			if (trimmedText) {
				try {
					const parsed = JSON.parse(trimmedText);
					if (parsed && typeof parsed === "object") {
						errorData = parsed as typeof errorData;
					} else {
						errorData = { error: trimmedText };
					}
				} catch {
					errorData = { error: trimmedText };
				}
			}

			const errorMessage = errorData.error || `HTTP ${status}: ${statusText}`;

			// Log 503 as warning (service unavailable is expected), other errors as errors
			const isServiceUnavailable = status === 503;
			const logMethod = isServiceUnavailable ? console.warn : console.error;
			const logPrefix = isServiceUnavailable
				? "[chat-api] Chat service unavailable"
				: "[chat-api] Error response from chat service";

			logMethod(logPrefix, {
				status,
				statusText,
				url: `${CHAT_SERVICE_URL}/api/conversations`,
				...(isServiceUnavailable
					? { note: "Chat service is not running" }
					: {}),
				...(isServiceUnavailable
					? {}
					: {
							contentType,
							errorData:
								Object.keys(errorData).length > 0 ? errorData : undefined,
							responseTextPreview:
								trimmedText && trimmedText.length > 200
									? `${trimmedText.substring(0, 200)}...`
									: trimmedText,
							responseTextLength: trimmedText?.length || 0,
						}),
			});

			const errorResponse: { error: string; details?: unknown } = {
				error: errorMessage,
			};

			if (errorData.details) {
				errorResponse.details = errorData.details;
			}

			return NextResponse.json(errorResponse, { status });
		}

		if (!contentType?.includes("application/json")) {
			console.error("[chat-api] Invalid content type", {
				status,
				statusText,
				contentType,
				responseTextPreview: responseText.substring(0, 200),
			});
			return NextResponse.json(
				{
					error: "Očekivani JSON odgovor nije primljen od chat servisa.",
					details: `Content-Type: ${contentType || "unknown"}`,
				},
				{ status: 500 },
			);
		}

		if (!responseText || !responseText.trim()) {
			console.error("[chat-api] Empty response body", {
				status,
				statusText,
				contentType,
			});
			return NextResponse.json(
				{ error: "Prazan odgovor od chat servisa." },
				{ status: 500 },
			);
		}

		let data: unknown;
		try {
			data = JSON.parse(responseText);
		} catch (parseError) {
			console.error("[chat-api] Failed to parse JSON response", {
				status,
				statusText,
				contentType,
				responseTextPreview: responseText.substring(0, 500),
				parseError:
					parseError instanceof Error ? parseError.message : String(parseError),
			});
			return NextResponse.json(
				{
					error: "Neuspešno parsiranje JSON odgovora od chat servisa.",
					details:
						parseError instanceof Error
							? parseError.message
							: String(parseError),
				},
				{ status: 500 },
			);
		}

		return NextResponse.json(data);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;
		console.error("[chat-api] Unexpected error fetching conversations", {
			error: errorMessage,
			stack: errorStack,
			errorType: typeof error,
		});
		return NextResponse.json(
			{
				error: "Preuzimanje konverzacija nije uspelo.",
				details: errorMessage,
			},
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

		if (!sessionToken) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		let body: unknown;
		try {
			body = await request.json();
		} catch (parseError) {
			console.error("[chat-api] Failed to parse request body", {
				error:
					parseError instanceof Error ? parseError.message : String(parseError),
			});
			return NextResponse.json(
				{ error: "Nevalidan format zahteva." },
				{ status: 400 },
			);
		}

		if (
			!body ||
			typeof body !== "object" ||
			(!("targetUserId" in body) && !("targetEmail" in body))
		) {
			return NextResponse.json(
				{
					error: "Nevalidni podaci. targetUserId ili targetEmail je obavezan.",
				},
				{ status: 400 },
			);
		}

		const { targetUserId, targetEmail } = body as {
			targetUserId?: unknown;
			targetEmail?: unknown;
		};

		if (targetEmail && typeof targetEmail !== "string") {
			return NextResponse.json(
				{ error: "Nevalidni podaci. targetEmail mora biti string." },
				{ status: 400 },
			);
		}
		if (!targetEmail && (!targetUserId || typeof targetUserId !== "string")) {
			return NextResponse.json(
				{ error: "Nevalidni podaci. targetUserId mora biti string." },
				{ status: 400 },
			);
		}

		let response: Response;
		try {
			response = await fetch(`${CHAT_SERVICE_URL}/api/conversations`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${sessionToken}`,
					"x-session-token": sessionToken,
				},
				body: JSON.stringify(targetEmail ? { targetEmail } : { targetUserId }),
				cache: "no-store",
			});
		} catch (fetchError) {
			const errorMessage =
				fetchError instanceof Error ? fetchError.message : String(fetchError);
			// Log as warning since this is an expected scenario when chat service is not running
			console.warn("[chat-api] Chat service unavailable (fetch failed):", {
				url: `${CHAT_SERVICE_URL}/api/conversations`,
				error: errorMessage,
				note: "This is expected if chat service is not running. Start it with: bun run dev",
			});
			return NextResponse.json(
				{
					error:
						"Chat servis nije dostupan. Proverite da li je servis pokrenut.",
					details: errorMessage,
				},
				{ status: 503 },
			);
		}

		const status = response.status;
		const statusText = response.statusText;
		const contentType = response.headers.get("content-type");

		let responseText = "";
		try {
			responseText = await response.text();
		} catch (readError) {
			console.error("[chat-api] Failed to read response body", {
				status,
				statusText,
				error:
					readError instanceof Error ? readError.message : String(readError),
			});
			return NextResponse.json(
				{
					error: "Neuspešno čitanje odgovora od chat servisa.",
					details:
						readError instanceof Error ? readError.message : String(readError),
				},
				{ status: 500 },
			);
		}

		if (!response.ok) {
			let errorData: { error?: string; details?: unknown } = {};
			const trimmedText = responseText?.trim();

			if (trimmedText) {
				try {
					const parsed = JSON.parse(trimmedText);
					if (parsed && typeof parsed === "object") {
						errorData = parsed as typeof errorData;
					} else {
						errorData = { error: trimmedText };
					}
				} catch {
					errorData = { error: trimmedText };
				}
			}

			const errorMessage = errorData.error || `HTTP ${status}: ${statusText}`;

			// Log 503 as warning (service unavailable is expected), other errors as errors
			const isServiceUnavailable = status === 503;
			const logMethod = isServiceUnavailable ? console.warn : console.error;
			const logPrefix = isServiceUnavailable
				? "[chat-api] Chat service unavailable"
				: "[chat-api] Error response from chat service";

			logMethod(logPrefix, {
				status,
				statusText,
				url: `${CHAT_SERVICE_URL}/api/conversations`,
				...(isServiceUnavailable
					? { note: "Chat service is not running" }
					: {}),
				...(isServiceUnavailable
					? {}
					: {
							contentType,
							errorData:
								Object.keys(errorData).length > 0 ? errorData : undefined,
							responseTextPreview:
								trimmedText && trimmedText.length > 200
									? `${trimmedText.substring(0, 200)}...`
									: trimmedText,
							responseTextLength: trimmedText?.length || 0,
						}),
			});

			const errorResponse: { error: string; details?: unknown } = {
				error: errorMessage,
			};

			if (errorData.details) {
				errorResponse.details = errorData.details;
			}

			return NextResponse.json(errorResponse, { status });
		}

		if (!contentType?.includes("application/json")) {
			console.error("[chat-api] Invalid content type", {
				status,
				statusText,
				contentType,
				responseTextPreview: responseText.substring(0, 200),
			});
			return NextResponse.json(
				{
					error: "Očekivani JSON odgovor nije primljen od chat servisa.",
					details: `Content-Type: ${contentType || "unknown"}`,
				},
				{ status: 500 },
			);
		}

		if (!responseText || !responseText.trim()) {
			console.error("[chat-api] Empty response body", {
				status,
				statusText,
				contentType,
			});
			return NextResponse.json(
				{ error: "Prazan odgovor od chat servisa." },
				{ status: 500 },
			);
		}

		let data: unknown;
		try {
			data = JSON.parse(responseText);
		} catch (parseError) {
			console.error("[chat-api] Failed to parse JSON response", {
				status,
				statusText,
				contentType,
				responseTextPreview: responseText.substring(0, 500),
				parseError:
					parseError instanceof Error ? parseError.message : String(parseError),
			});
			return NextResponse.json(
				{
					error: "Neuspešno parsiranje JSON odgovora od chat servisa.",
					details:
						parseError instanceof Error
							? parseError.message
							: String(parseError),
				},
				{ status: 500 },
			);
		}

		return NextResponse.json(data);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;
		console.error("[chat-api] Unexpected error creating conversation", {
			error: errorMessage,
			stack: errorStack,
			errorType: typeof error,
		});
		return NextResponse.json(
			{
				error: "Kreiranje konverzacije nije uspelo.",
				details: errorMessage,
			},
			{ status: 500 },
		);
	}
}
