import type {
  FastifyPluginAsync,
  RouteHandlerMethod,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import type { AuthenticatedUser } from "../../../types/auth";
import {
  getPreferenceByTypeSchema,
  getPreferencesSchema,
  updatePreferencesSchema,
} from "./preferences.schema.js";
import {
  getPreferenceByType,
  getPreferences,
  updatePreferences,
} from "./preferences.controller.js";

// Middleware to extract user from headers and attach to request
const authenticateUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = request.headers["x-user-id"] as string | undefined;
  const userEmail = request.headers["x-user-email"] as string | undefined;
  const userName = request.headers["x-user-name"] as string | undefined;
  const companyId = request.headers["x-company-id"] as string | undefined;

  if (!userId || !companyId) {
    return reply.status(401).send({
      error: "Unauthorized",
      message: "Missing authentication headers (x-user-id, x-company-id)",
    });
  }

  // Attach user to request
  (request as FastifyRequest & { user: AuthenticatedUser }).user = {
    id: userId,
    email: userEmail || "",
    name: userName || "",
    companyId: companyId,
  };
};

const preferencesRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply authentication middleware to all routes
  fastify.addHook("preHandler", authenticateUser);

  fastify.get(
    "/",
    { schema: getPreferencesSchema },
    getPreferences as RouteHandlerMethod
  );

  fastify.patch(
    "/",
    { schema: updatePreferencesSchema },
    updatePreferences as RouteHandlerMethod
  );

  fastify.get(
    "/:type",
    { schema: getPreferenceByTypeSchema },
    getPreferenceByType as RouteHandlerMethod
  );
};

export default preferencesRoutes;

