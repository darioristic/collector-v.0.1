"use client";

import { Bell } from "@novu/react";
import dynamic from "next/dynamic";
import { useAuth } from "@/components/providers/auth-provider";
import {
	getNovuAppId,
	getNovuSubscriberId,
	isNovuConfigured,
} from "@/lib/novu/novu-client";

const NovuInbox = dynamic(() => import("@novu/react").then((m) => m.Inbox), {
	ssr: false,
	loading: () => null,
});

/**
 * Novu notification bell component
 * Renders the Bell inside Novu's Inbox so it has the required UI context.
 */
export function NovuBell() {
	const { user } = useAuth();
	const appId = getNovuAppId();
	const subscriberId = getNovuSubscriberId(user?.id);
	const enabled = isNovuConfigured() && !!appId && !!subscriberId;

	if (!enabled) return null;

	return (
		<NovuInbox applicationIdentifier={appId} subscriberId={subscriberId}>
			<Bell />
		</NovuInbox>
	);
}
