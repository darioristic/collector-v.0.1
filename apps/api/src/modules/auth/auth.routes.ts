import type { FastifyPluginAsync, FastifyReply } from "fastify";

import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  meSchema,
  registerSchema,
  resetPasswordSchema
} from "./auth.schema";
import { AuthService, AuthServiceError } from "./auth.service";
import {
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput
} from "./auth.types";
import { createRequestMetadata, extractSessionToken } from "./auth.utils";

type AuthRoutesOptions = {
  service: AuthService;
};

const sendServiceError = (reply: FastifyReply, error: AuthServiceError) =>
  reply.status(error.statusCode).send({
    statusCode: error.statusCode,
    error: error.code,
    message: error.message
  });

const authRoutes: FastifyPluginAsync<AuthRoutesOptions> = async (app, { service }) => {
  app.post("/register", {
    schema: registerSchema,
    config: {
      rateLimit: {
        max: 3, // Max 3 registration attempts
        timeWindow: '1 hour', // Per hour
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Previše pokušaja registracije. Pokušajte ponovo za 1 sat.'
        })
      }
    }
  }, async (request, reply) => {
    try {
      const body = request.body as RegisterInput;
      const metadata = createRequestMetadata(request);
      const payload = await service.register(body, metadata);
      return reply.status(201).send({ data: payload });
    } catch (error) {
      if (error instanceof AuthServiceError) {
        return sendServiceError(reply, error);
      }

      throw error;
    }
  });

  app.post("/login", {
    schema: loginSchema,
    config: {
      rateLimit: {
        max: 5, // Max 5 login attempts
        timeWindow: '15 minutes', // Per 15 minutes
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Previše pokušaja prijave. Pokušajte ponovo za 15 minuta.'
        })
      }
    }
  }, async (request, reply) => {
    try {
      const body = request.body as LoginInput;
      const metadata = createRequestMetadata(request);
      const payload = await service.login(body, metadata);
      return reply.status(200).send({ data: payload });
    } catch (error) {
      if (error instanceof AuthServiceError) {
        return sendServiceError(reply, error);
      }

      throw error;
    }
  });

  app.get("/me", { schema: meSchema }, async (request, reply) => {
    try {
      const token = extractSessionToken(request);

      if (!token) {
        return reply.status(401).send({
          statusCode: 401,
          error: "TOKEN_REQUIRED",
          message: "Session token nedostaje."
        });
      }

      const payload = await service.me(token);
      return reply.status(200).send({ data: payload });
    } catch (error) {
      if (error instanceof AuthServiceError) {
        return sendServiceError(reply, error);
      }

      throw error;
    }
  });

  app.post("/logout", { schema: logoutSchema }, async (request, reply) => {
    try {
      const token = extractSessionToken(request);

      if (!token) {
        return reply.status(400).send({
          statusCode: 400,
          error: "TOKEN_REQUIRED",
          message: "Session token nedostaje."
        });
      }

      await service.logout(token);
      return reply.status(204).send();
    } catch (error) {
      if (error instanceof AuthServiceError) {
        return sendServiceError(reply, error);
      }

      throw error;
    }
  });

  app.post("/forgot-password", {
    schema: forgotPasswordSchema,
    config: {
      rateLimit: {
        max: 3, // Max 3 forgot password attempts
        timeWindow: '1 hour', // Per hour
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Previše pokušaja resetovanja lozinke. Pokušajte ponovo za 1 sat.'
        })
      }
    }
  }, async (request, reply) => {
    try {
      const body = request.body as ForgotPasswordInput;
      const payload = await service.forgotPassword(body);
      return reply.status(200).send({ data: payload });
    } catch (error) {
      if (error instanceof AuthServiceError) {
        return sendServiceError(reply, error);
      }

      throw error;
    }
  });

  app.post("/reset-password", { schema: resetPasswordSchema }, async (request, reply) => {
    try {
      const body = request.body as ResetPasswordInput;
      const metadata = createRequestMetadata(request);
      const payload = await service.resetPassword(body, metadata);
      return reply.status(200).send({ data: payload });
    } catch (error) {
      if (error instanceof AuthServiceError) {
        return sendServiceError(reply, error);
      }

      throw error;
    }
  });
};

export default authRoutes;


