import type { FastifyReply, FastifyRequest } from "fastify";
import { eq, and } from "drizzle-orm";
import type { AuthenticatedRequest } from "../../../types/auth.js";
import { db } from "../../../db/index.js";
import { userNotificationPreferences } from "../../../db/schema/notifications.schema.js";
import type { NotificationPreferenceType } from "../../../lib/novu/novu.types.js";

type GetPreferencesQuery = {
  type?: NotificationPreferenceType;
};

type UpdatePreferencesBody = {
  preferences: Array<{
    notificationType: NotificationPreferenceType;
    emailEnabled: boolean;
    inAppEnabled: boolean;
  }>;
};

/**
 * GET /notifications/preferences - Get user notification preferences
 */
export async function getPreferences(
  request: FastifyRequest<{
    Querystring: GetPreferencesQuery;
  }> & AuthenticatedRequest,
  reply: FastifyReply
) {
  const userId = request.user.id;
  const { type } = request.query;

  try {
    if (type) {
      // Get preference for specific type
      const [preference] = await db
        .select()
        .from(userNotificationPreferences)
        .where(
          and(
            eq(userNotificationPreferences.userId, userId),
            eq(userNotificationPreferences.notificationType, type)
          )
        )
        .limit(1);

      if (!preference) {
        // Return default preferences
        return reply.status(200).send({
          userId,
          notificationType: type,
          emailEnabled: true,
          inAppEnabled: true,
        });
      }

      return reply.status(200).send({
        userId: preference.userId,
        notificationType: preference.notificationType,
        emailEnabled: preference.emailEnabled,
        inAppEnabled: preference.inAppEnabled,
      });
    }

    // Get all preferences for user
    const preferences = await db
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, userId));

    // Return all preferences with defaults for missing types
    const allTypes: NotificationPreferenceType[] = [
      "invoice",
      "payment",
      "transaction",
      "daily_summary",
      "quote",
      "deal",
      "project",
      "task",
      "system",
    ];

    const preferencesMap = new Map(
      preferences.map((p) => [
        p.notificationType as NotificationPreferenceType,
        p,
      ])
    );

    const result = allTypes.map((notificationType) => {
      const pref = preferencesMap.get(notificationType);
      return {
        userId,
        notificationType,
        emailEnabled: pref?.emailEnabled ?? true,
        inAppEnabled: pref?.inAppEnabled ?? true,
      };
    });

    return reply.status(200).send({
      preferences: result,
    });
  } catch (error) {
    request.log.error(error, "Failed to fetch notification preferences");
    return reply.status(500).send({
      error: "Failed to fetch notification preferences",
    });
  }
}

/**
 * PATCH /notifications/preferences - Update user notification preferences
 */
export async function updatePreferences(
  request: FastifyRequest<{
    Body: UpdatePreferencesBody;
  }> & AuthenticatedRequest,
  reply: FastifyReply
) {
  const userId = request.user.id;
  const { preferences } = request.body;

  if (!preferences || preferences.length === 0) {
    return reply.status(400).send({
      error: "Preferences array is required",
    });
  }

  try {
    const results = [];

    for (const pref of preferences) {
      // Check if preference exists
      const [existing] = await db
        .select()
        .from(userNotificationPreferences)
        .where(
          and(
            eq(userNotificationPreferences.userId, userId),
            eq(
              userNotificationPreferences.notificationType,
              pref.notificationType
            )
          )
        )
        .limit(1);

      if (existing) {
        // Update existing preference
        const [updated] = await db
          .update(userNotificationPreferences)
          .set({
            emailEnabled: pref.emailEnabled,
            inAppEnabled: pref.inAppEnabled,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userNotificationPreferences.userId, userId),
              eq(
                userNotificationPreferences.notificationType,
                pref.notificationType
              )
            )
          )
          .returning();

        results.push(updated);
      } else {
        // Create new preference
        const [created] = await db
          .insert(userNotificationPreferences)
          .values({
            userId,
            notificationType: pref.notificationType,
            emailEnabled: pref.emailEnabled,
            inAppEnabled: pref.inAppEnabled,
          })
          .returning();

        results.push(created);
      }
    }

    return reply.status(200).send({
      preferences: results.map((r) => ({
        userId: r.userId,
        notificationType: r.notificationType,
        emailEnabled: r.emailEnabled,
        inAppEnabled: r.inAppEnabled,
      })),
    });
  } catch (error) {
    request.log.error(error, "Failed to update notification preferences");
    return reply.status(500).send({
      error: "Failed to update notification preferences",
    });
  }
}

/**
 * GET /notifications/preferences/:type - Get preference for specific type
 */
export async function getPreferenceByType(
  request: FastifyRequest<{
    Params: { type: NotificationPreferenceType };
  }> & AuthenticatedRequest,
  reply: FastifyReply
) {
  const userId = request.user.id;
  const { type } = request.params;

  try {
    const [preference] = await db
      .select()
      .from(userNotificationPreferences)
      .where(
        and(
          eq(userNotificationPreferences.userId, userId),
          eq(userNotificationPreferences.notificationType, type)
        )
      )
      .limit(1);

    if (!preference) {
      // Return default preferences
      return reply.status(200).send({
        userId,
        notificationType: type,
        emailEnabled: true,
        inAppEnabled: true,
      });
    }

    return reply.status(200).send({
      userId: preference.userId,
      notificationType: preference.notificationType,
      emailEnabled: preference.emailEnabled,
      inAppEnabled: preference.inAppEnabled,
    });
  } catch (error) {
    request.log.error(error, "Failed to fetch notification preference");
    return reply.status(500).send({
      error: "Failed to fetch notification preference",
    });
  }
}

