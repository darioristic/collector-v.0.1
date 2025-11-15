import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";

export const sanitizeString = (input: string, maxLength: number): string => {
  const value = input.trim();
  return value.length > maxLength ? value.slice(0, maxLength) : value;
};

export const createSearchPreValidation = (
  limit: number,
  fieldName = "search",
) => {
  return (
    request: FastifyRequest,
    _reply: FastifyReply,
    done: HookHandlerDoneFunction,
  ) => {
    const query = request.query as Record<string, unknown> | undefined;
    const q = query?.[fieldName];
    if (typeof q === "string") {
      (request.query as Record<string, unknown>)[fieldName] = sanitizeString(q, limit);
    }
    done();
  };
};