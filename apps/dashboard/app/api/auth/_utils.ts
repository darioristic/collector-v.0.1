import { NextResponse, type NextRequest } from "next/server";

import { getApiUrl } from "@/src/lib/fetch-utils";

export const SESSION_COOKIE_NAME = "auth_session";
const isProduction = process.env.NODE_ENV === "production";

type BackendRequestInit = RequestInit & {
  headers?: HeadersInit;
};

type BackendResult<TData = unknown> = {
  response: Response;
  payload: TData | null;
};

export const buildAuthUrl = (path: string): string => {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return getApiUrl(`/auth/${cleanPath}`);
};

export const parseJsonPayload = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

export const forwardAuthRequest = async <T = unknown>(
  path: string,
  init: BackendRequestInit
): Promise<BackendResult<T>> => {
  const headers = new Headers(init.headers ?? {});

  if (!headers.has("content-type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildAuthUrl(path), {
    ...init,
    headers,
    cache: "no-store"
  });

  const payload = await parseJsonPayload<T>(response);

  return {
    response,
    payload
  };
};

export const createJsonError = (status: number, error: string, message: string) =>
  NextResponse.json(
    {
      statusCode: status,
      error,
      message
    },
    { status }
  );

export const backendErrorResponse = (
  response: Response,
  payload: any,
  fallbackError: string,
  fallbackMessage: string
) =>
  NextResponse.json(
    {
      statusCode: response.status,
      error: typeof payload?.error === "string" ? payload.error : fallbackError,
      message: typeof payload?.message === "string" ? payload.message : fallbackMessage
    },
    { status: response.status }
  );

export const setSessionCookie = (
  response: NextResponse,
  session: { token: string; expiresAt: string } | null | undefined
) => {
  if (!session) {
    return;
  }

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: session.token,
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    expires: new Date(session.expiresAt),
    path: "/"
  });
};

export const clearSessionCookie = (response: NextResponse) => {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    expires: new Date(0),
    path: "/"
  });
};

export const readRequestJson = async <T>(request: NextRequest): Promise<T | null> => {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
};


