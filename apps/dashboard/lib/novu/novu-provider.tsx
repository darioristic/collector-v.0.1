"use client";

import { NovuProvider as NovuProviderBase } from "@novu/react";
import { useAuth } from "@/components/providers/auth-provider";
import { getNovuSubscriberId, getNovuAppId, isNovuConfigured } from "./novu-client";

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
  const appId = getNovuAppId();
  const subscriberId = getNovuSubscriberId(user?.id);

  // Only render Novu provider if configured and user is authenticated
  if (!isNovuConfigured() || !appId || !subscriberId) {
    // Return children without Novu provider if not configured
    return <>{children}</>;
  }

  return (
    <NovuProviderBase applicationIdentifier={appId} subscriberId={subscriberId}>
      {children}
    </NovuProviderBase>
  );
}
