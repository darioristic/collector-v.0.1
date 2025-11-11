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
  app.post("/register", { schema: registerSchema }, async (request, reply) => {
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

  app.post("/login", { schema: loginSchema }, async (request, reply) => {
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

  app.post("/forgot-password", { schema: forgotPasswordSchema }, async (request, reply) => {
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


