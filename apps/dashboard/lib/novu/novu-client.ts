"use client";


const NOVU_APP_ID = process.env.NEXT_PUBLIC_NOVU_APP_ID;

if (!NOVU_APP_ID) {
  console.warn(
    "NEXT_PUBLIC_NOVU_APP_ID is not set. Novu notifications will not work."
  );
}

/**
 * Get Novu subscriber ID from user ID
 * In Novu, subscriber ID is typically the user ID
 */
export function getNovuSubscriberId(userId: string | null | undefined): string | undefined {
  if (!userId) {
    return undefined;
  }
  return userId;
}

/**
 * Get Novu application identifier
 */
export function getNovuAppId(): string | undefined {
  return NOVU_APP_ID;
}

/**
 * Check if Novu is configured
 */
export function isNovuConfigured(): boolean {
  return !!NOVU_APP_ID;
}

