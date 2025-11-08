import type { FastifyError, FastifyPluginAsync } from "fastify";

import { createHttpError } from "../lib/errors";

const errorHandlerPlugin: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error, request, reply) => {
    request.log.error(
      {
        err: error,
        url: request.url,
        method: request.method
      },
      "Unhandled error while processing request"
    );

    if (reply.sent) {
      return;
    }

    const validationErrors = (error as FastifyError).validation;
    const statusCode = (error.statusCode as number | undefined) ?? (validationErrors ? 400 : 500);
    const message =
      validationErrors && validationErrors.length > 0
        ? "Validation failed"
        : error.message ?? "Unexpected error";

    const response = createHttpError(statusCode, message, {
      error: error.name,
      details: validationErrors ?? error.cause
    });

    void reply.status(statusCode).send(response);
  });
};

export default errorHandlerPlugin;

