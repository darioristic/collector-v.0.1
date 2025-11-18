import {
  DEFAULT_SERVER_ERROR_MESSAGE,
  createSafeActionClient,
} from "next-safe-action";
import { z } from "zod";
import { getDb } from "@/lib/db";

export const actionClient = createSafeActionClient({
  handleReturnedServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

export const actionClientWithMeta = createSafeActionClient({
  handleReturnedServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  defineMetadataSchema() {
    return z.object({
      name: z.string(),
      track: z
        .object({
          event: z.string(),
          channel: z.string(),
        })
        .optional(),
    });
  },
});

// TODO: Add proper authentication and user context
// This is a placeholder implementation
export const authActionClient = actionClientWithMeta.use(
  async ({ next, metadata }) => {
    // TODO: Replace with actual authentication logic
    // For now, we'll throw an error to indicate this needs to be implemented
    const db = await getDb();

    // Placeholder user context - replace with actual auth
    const userId = "placeholder-user-id"; // TODO: Get from auth session
    const companyId = 1; // TODO: Get from user's company

    return next({
      ctx: {
        db,
        userId,
        companyId,
      },
    });
  }
);
