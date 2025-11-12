import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

export interface JWTPayload {
  userId: string;
  companyId: string;
  email: string;
  [key: string]: unknown;
}

export function validateJWT(token: string): JWTPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  try {
    const payload = jwt.verify(token, secret) as JWTPayload;
    return payload;
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    if (error instanceof TokenExpiredError) {
      throw new Error("Token expired");
    }
    throw error;
  }
}

export function extractTokenFromHeader(
  authHeader: string | undefined,
): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

