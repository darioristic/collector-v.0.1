import { STATUS_CODES } from "node:http";

export type HttpErrorPayload = {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
};

const DEFAULT_ERROR = "Error";

export const createHttpError = (
  statusCode: number,
  message: string,
  options?: { error?: string; details?: unknown }
): HttpErrorPayload => {
  const statusText = options?.error ?? STATUS_CODES[statusCode] ?? DEFAULT_ERROR;

  return {
    statusCode,
    error: statusText,
    message,
    ...(options?.details !== undefined ? { details: options.details } : {})
  };
};

