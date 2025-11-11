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
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const response = await fetch(getApiUrl("/auth/me"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "x-session-token": sessionToken
    },
    cache: "no-store"
  });

  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }

    const payload = (await response.json().catch(() => null)) as BackendResponse | null;
    const message = payload?.message ?? `Auth check failed with status ${response.status}.`;
    throw new Error(message);
  }

  const payload = (await response.json().catch(() => null)) as BackendResponse | null;

  if (!payload?.data) {
    return null;
  }

  return payload.data;
});


