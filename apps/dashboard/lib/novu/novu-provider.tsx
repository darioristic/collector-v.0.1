"use client";

import { NovuProvider as NovuProviderBase } from "@novu/react";
import React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
	getNovuAppId,
	getNovuSubscriberId,
	isNovuConfigured,
} from "./novu-client";

interface NovuProviderProps {
	children: React.ReactNode;
}

/**
 * Novu provider wrapper that handles authentication
 *
 * Provides Novu API context (application + subscriber) for the rest of the app.
 * UI context for the bell is created inside the `NovuBell` component.
 */
export function NovuProvider({ children }: NovuProviderProps) {
	const { user } = useAuth();
	const [mounted, setMounted] = React.useState(false);
	React.useEffect(() => {
		setMounted(true);
	}, []);
	const appId = getNovuAppId();
	const subscriberId = getNovuSubscriberId(user?.id);
	const enabled = mounted && isNovuConfigured() && !!appId && !!subscriberId;
	if (!enabled) {
		return <>{children}</>;
	}

	// Use proxy route to avoid CORS issues
	const backendUrl =
		typeof window !== "undefined" ? "/api/novu" : undefined;

	return (
		<NovuProviderBase
			applicationIdentifier={appId}
			subscriberId={subscriberId}
			backendUrl={backendUrl}
		>
			{children}
		</NovuProviderBase>
	);
}
