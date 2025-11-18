import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

const CHAT_SERVICE_URL =
	process.env.CHAT_SERVICE_URL ||
	process.env.NEXT_PUBLIC_CHAT_SERVICE_URL ||
	"http://localhost:4001";

const withNoStore = (response: NextResponse) => {
	response.headers.set("Cache-Control", "no-store");
	return response;
};

const unauthorized = () =>
	withNoStore(
		NextResponse.json(
			{
				error: "Niste autorizovani.",
			},
			{ status: 401 },
		),
	);

export async function GET(
    request: NextRequest,
    context: { params: { id: string } },
) {
	try {
		const cookieStore = cookies();
		const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

		if (!sessionToken) {
			return unauthorized();
		}

        const conversationId = context.params?.id;
		if (!conversationId) {
			return withNoStore(
				NextResponse.json(
					{ error: "Nedostaje ID konverzacije." },
					{ status: 400 },
				),
			);
		}
		const limitParam = request.nextUrl.searchParams.get("limit");
		const limit = limitParam ? parseInt(limitParam, 10) : 50;

		if (isNaN(limit) || limit < 1 || limit > 100) {
			return withNoStore(
				NextResponse.json(
					{
						error: "Limit mora biti između 1 i 100.",
					},
					{ status: 400 },
				),
			);
		}

		const url = new URL(
			`${CHAT_SERVICE_URL}/api/conversations/${conversationId}/messages`,
		);
		url.searchParams.set("limit", limit.toString());

		let response: Response;
		try {
			response = await fetch(url.toString(), {
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
			console.error("[chat-api] Fetch error when fetching messages:", {
				conversationId,
				url: url.toString(),
				error: errorMessage,
			});

			// Handle network errors gracefully
			if (
				errorMessage.includes("Failed to fetch") ||
				errorMessage.includes("ECONNREFUSED") ||
				errorMessage.includes("connection refused")
			) {
				return withNoStore(
					NextResponse.json(
						{
							error:
								"Chat servis nije dostupan. Proverite da li je servis pokrenut na portu 4001.",
						},
						{ status: 503 },
					),
				);
			}

			return withNoStore(
				NextResponse.json(
					{
						error: "Preuzimanje poruka nije uspelo.",
						details: errorMessage,
					},
					{ status: 500 },
				),
			);
		}

		if (!response.ok) {
			let errorData: { error?: string; message?: string } = {};
			try {
				const text = await response.text();
				if (text) {
					errorData = JSON.parse(text) as typeof errorData;
				}
			} catch {
				// Ignore parse errors
			}

			const errorMessage =
				errorData.error ||
				errorData.message ||
				"Preuzimanje poruka nije uspelo.";

			console.error("[chat-api] Chat service returned error:", {
				conversationId,
				status: response.status,
				statusText: response.statusText,
				error: errorMessage,
			});

			return withNoStore(
				NextResponse.json(
					{
						error: errorMessage,
					},
					{ status: response.status },
				),
			);
		}

		let data: unknown;
		try {
			data = await response.json();
		} catch (parseError) {
			console.error("[chat-api] Failed to parse response:", {
				conversationId,
				error:
					parseError instanceof Error ? parseError.message : String(parseError),
			});
			return withNoStore(
				NextResponse.json(
					{
						error: "Neočekivan format odgovora od chat servisa.",
					},
					{ status: 500 },
				),
			);
		}

		return withNoStore(NextResponse.json(data));
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("[chat-api] Unexpected error fetching messages:", {
			error: errorMessage,
			stack: error instanceof Error ? error.stack : undefined,
		});
		return withNoStore(
			NextResponse.json(
				{
					error: "Preuzimanje poruka nije uspelo.",
					details: errorMessage,
				},
				{ status: 500 },
			),
		);
	}
}

export async function POST(
    request: NextRequest,
    context: { params: { id: string } },
) {
	try {
		const cookieStore = cookies();
		const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

		if (!sessionToken) {
			return unauthorized();
		}

        const conversationId = context.params?.id;
		if (!conversationId) {
			return withNoStore(
				NextResponse.json(
					{ error: "Nedostaje ID konverzacije." },
					{ status: 400 },
				),
			);
		}
		const json = await request.json().catch(() => null);

		if (!json || typeof json !== "object") {
			return withNoStore(
				NextResponse.json(
					{
						error: "Nevalidni podaci.",
					},
					{ status: 400 },
				),
			);
		}

		const content = json.content?.trim() || null;
		const type = json.type || "text";
		const fileUrl = json.fileUrl || null;
		const fileMetadata = json.fileMetadata || null;

		if (!content && !fileUrl) {
			return withNoStore(
				NextResponse.json(
					{
						error: "Poruka mora imati sadržaj ili fajl.",
					},
					{ status: 400 },
				),
			);
		}

		const response = await fetch(
			`${CHAT_SERVICE_URL}/api/conversations/${conversationId}/messages`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${sessionToken}`,
					"x-session-token": sessionToken,
				},
				body: JSON.stringify({
					content,
					type,
					fileUrl,
					fileMetadata,
				}),
				cache: "no-store",
			},
		);

		if (!response.ok) {
			const error = await response
				.json()
				.catch(() => ({ error: "Slanje poruke nije uspelo." }));
			return withNoStore(
				NextResponse.json(
					{
						error: error.error || "Slanje poruke nije uspelo.",
					},
					{ status: response.status },
				),
			);
		}

		const data = await response.json();
		return withNoStore(NextResponse.json(data));
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("[chat-api] Error creating message:", errorMessage);
		return withNoStore(
			NextResponse.json(
				{
					error: "Slanje poruke nije uspelo.",
				},
				{ status: 500 },
			),
		);
	}
}
