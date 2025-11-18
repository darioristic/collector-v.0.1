import { getCurrentAuth } from "@/lib/auth";
import { ensureTeamChatSchemaReady } from "@/lib/teamchat/repository";
import { cn, generateMeta } from "@/lib/utils";

import type { BootstrapResponse } from "./api";
import { TeamChatClient } from "./team-chat-client";

export async function generateMetadata() {
	return generateMeta({
		title: "Team Chat - Collector Dashboard",
		description:
			"Team chat application for real-time communication with channels and direct messages. Built with shadcn/ui, Next.js and Tailwind CSS.",
		canonical: "/apps/teamchat",
	});
}

export default async function TeamChatPage() {
	const auth = await getCurrentAuth();

	if (!auth) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">Not authenticated</p>
			</div>
		);
	}

	await ensureTeamChatSchemaReady();

	// Fetch bootstrap data from API route
	const baseUrl =
		process.env.NEXT_PUBLIC_APP_URL ||
		(process.env.VERCEL_URL
			? `https://${process.env.VERCEL_URL}`
			: "http://localhost:3000");

	let initialData: BootstrapResponse;
	try {
		const { cookies } = await import("next/headers");
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_session")?.value;

		const response = await fetch(`${baseUrl}/api/teamchat/bootstrap`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				...(sessionToken && {
					Authorization: `Bearer ${sessionToken}`,
					"x-session-token": sessionToken,
				}),
			},
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error("Bootstrap failed");
		}

		const data = (await response.json()) as BootstrapResponse;
		initialData = data;
	} catch {
		// Fallback to empty state with correct types
		initialData = {
			currentUser: {
				id: auth.user.id,
				name: auth.user.name,
				email: auth.user.email,
				avatarUrl: null,
				status: "online",
			},
			channels: [],
			directMessageTargets: [],
		} as BootstrapResponse;
	}

	return (
		<div className={cn("flex h-full flex-col p-4")}>
			<TeamChatClient initialData={initialData} currentUserId={auth.user.id} />
		</div>
	);
}
