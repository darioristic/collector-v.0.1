import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const CHAT_SERVICE_URL =
	process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:4001";
const SESSION_COOKIE_NAME = "auth_session";

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

type RouteContext = {
	params: Promise<{
		id: string;
	}>;
};

export async function GET(request: NextRequest, context: RouteContext) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

		if (!sessionToken) {
			return unauthorized();
		}

		const { id: conversationId } = await context.params;
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

		const response = await fetch(url.toString(), {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${sessionToken}`,
				"x-session-token": sessionToken,
			},
			cache: "no-store",
		});

		if (!response.ok) {
			const error = await response
				.json()
				.catch(() => ({ error: "Preuzimanje poruka nije uspelo." }));
			return withNoStore(
				NextResponse.json(
					{
						error: error.error || "Preuzimanje poruka nije uspelo.",
					},
					{ status: response.status },
				),
			);
		}

		const data = await response.json();
		return withNoStore(NextResponse.json(data));
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("[chat-api] Error fetching messages:", errorMessage);
		return withNoStore(
			NextResponse.json(
				{
					error: "Preuzimanje poruka nije uspelo.",
				},
				{ status: 500 },
			),
		);
	}
}

export async function POST(request: NextRequest, context: RouteContext) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

		if (!sessionToken) {
			return unauthorized();
		}

		const { id: conversationId } = await context.params;
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
