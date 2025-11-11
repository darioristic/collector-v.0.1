import { cache } from "react";
import { cookies } from "next/headers";

import { getApiUrl } from "@/src/lib/fetch-utils";

export const SESSION_COOKIE_NAME = "auth_session";

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
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  let response: Response;

  try {
    response = await fetch(getApiUrl("/auth/me"), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "x-session-token": sessionToken
      },
      cache: "no-store"
    });
  } catch (error) {
    console.error("[auth] Failed to reach /auth/me endpoint", error);
    return null;
  }

  const payload = (await response.json().catch(() => null)) as BackendResponse | null;

  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }

    const message =
      (payload?.message ?? payload?.error)?.toString() ??
      `Auth check failed with status ${response.status}.`;

    console.error("[auth] Auth verification failed", {
      status: response.status,
      message
    });
    return null;
  }

  if (!payload?.data) {
    console.warn("[auth] Auth payload is missing data. Treating as unauthenticated.");
    return null;
  }

  return payload.data;
});


