import jwt from "jsonwebtoken";
export function validateJWT(token) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }
    try {
        const payload = jwt.verify(token, secret);
        return payload;
    }
    catch (error) {
        const err = error;
        if (err?.name === "JsonWebTokenError") {
            throw new Error("Invalid token");
        }
        if (err?.name === "TokenExpiredError") {
            throw new Error("Token expired");
        }
        throw error;
    }
}
export function extractTokenFromHeader(authHeader) {
    if (!authHeader) {
        return null;
    }
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return null;
    }
    return parts[1];
}
export async function authMiddleware(request, reply) {
    const token = extractTokenFromHeader(request.headers.authorization);
    if (!token) {
        return reply.code(401).send({ error: "Unauthorized" });
    }
    try {
        const payload = validateJWT(token);
        request.user = payload;
    }
    catch {
        return reply.code(401).send({ error: "Invalid or expired token" });
    }
}
