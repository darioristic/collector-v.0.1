import type { FastifyRequest } from "fastify";

import type { RequestMetadata } from "./auth.types";

const BEARER_PREFIX = "bearer ";
const SESSION_COOKIE_NAME = "auth_session";

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const slugify = (value: string): string => {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const extractTokenFromCookie = (cookieHeader: string | undefined): string | null => {
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(";").map((chunk) => chunk.trim());

  for (const part of parts) {
    if (part.toLowerCase().startsWith(`${SESSION_COOKIE_NAME}=`)) {
      const value = part.slice(SESSION_COOKIE_NAME.length + 1);
      return decodeURIComponent(value);
    }
  }

  return null;
};

export const extractSessionToken = (request: FastifyRequest): string | null => {
  const authorization = request.headers.authorization;

  if (authorization && authorization.toLowerCase().startsWith(BEARER_PREFIX)) {
    return authorization.slice(BEARER_PREFIX.length).trim();
  }

  const headerToken = request.headers["x-session-token"];

  if (typeof headerToken === "string" && headerToken.length > 0) {
    return headerToken;
  }

  return extractTokenFromCookie(request.headers.cookie);
};

export const createRequestMetadata = (request: FastifyRequest): RequestMetadata => ({
  ipAddress: request.ip ?? null,
  userAgent: typeof request.headers["user-agent"] === "string" ? request.headers["user-agent"] : null
});


