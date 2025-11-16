import { getNovuClient } from "./novu.client.js";
import type {
  EmailNotificationPayload,
  InAppNotificationPayload,
  MultiChannelNotificationPayload,
  NotificationPreferenceType,
  UserNotificationPreferences,
} from "./novu.types.js";
import { NOTIFICATION_TYPE_TO_WORKFLOW } from "./novu.templates.js";
import type { AppDatabase } from "../../db/index.js";
import { userNotificationPreferences } from "../../db/schema/notifications.schema.js";
import { eq, and } from "drizzle-orm";

export class NovuService {
  /**
   * Get user notification preferences for a specific type
   */
  async getUserPreferences(
    db: AppDatabase,
    userId: string,
    notificationType: NotificationPreferenceType
  ): Promise<UserNotificationPreferences | null> {
    const [preference] = await db
      .select()
      .from(userNotificationPreferences)
      .where(
        and(
          eq(userNotificationPreferences.userId, userId),
          eq(userNotificationPreferences.notificationType, notificationType)
        )
      )
      .limit(1);

    if (!preference) {
      // Return default preferences (both enabled)
      return {
        userId,
        notificationType,
        emailEnabled: true,
        inAppEnabled: true,
      };
    }

    return {
      userId: preference.userId,
      notificationType: preference.notificationType as NotificationPreferenceType,
      emailEnabled: preference.emailEnabled,
      inAppEnabled: preference.inAppEnabled,
    };
  }

  /**
   * Send notification via Novu workflow
   */
  async sendNotification(
    db: AppDatabase,
    payload: MultiChannelNotificationPayload
  ): Promise<void> {
    const workflowId = NOTIFICATION_TYPE_TO_WORKFLOW[payload.notificationType];

    if (!workflowId) {
      throw new Error(
        `No workflow found for notification type: ${payload.notificationType}`
      );
    }

    // Check user preferences
    const preferences = await this.getUserPreferences(
      db,
      payload.userId,
      payload.notificationType
    );

    // Build subscriber data
    const subscriberId = payload.userId;
    const _subscriberData: Record<string, unknown> = {
      userId: payload.userId,
      companyId: payload.companyId,
      ...payload.metadata,
    };

    // Build payload data for Novu
    const novuPayload: Record<string, unknown> = {
      title: payload.title,
      message: payload.message,
      link: payload.link || "",
      ...payload.metadata,
    };

    // Determine which channels to use based on preferences and payload
    const channels: string[] = [];

    if (payload.email && preferences?.emailEnabled) {
      channels.push("email");
      novuPayload.email = {
        to: Array.isArray(payload.email.to)
          ? payload.email.to
          : [payload.email.to],
        subject: payload.email.subject,
        html: payload.email.html,
        text: payload.email.text,
      };
    }

    if (payload.inApp && preferences?.inAppEnabled) {
      channels.push("in_app");
      if (payload.inApp.cta) {
        novuPayload.cta = payload.inApp.cta;
      }
    }

    // If channels are specified in payload, use those (but still respect preferences)
    if (payload.channels) {
      const filteredChannels = payload.channels.filter((channel) => {
        if (channel === "email") {
          return preferences?.emailEnabled && payload.email;
        }
        if (channel === "in_app") {
          return preferences?.inAppEnabled && payload.inApp;
        }
        return false;
      });
      if (filteredChannels.length > 0) {
        channels.splice(0, channels.length, ...filteredChannels);
      }
    }

    if (channels.length === 0) {
      console.warn(
        `No enabled channels for user ${payload.userId} and type ${payload.notificationType}`
      );
      return;
    }

    const novu = getNovuClient();

    try {
      await novu.trigger(workflowId, {
        to: {
          subscriberId,
        },
        payload: novuPayload,
        actor: {
          subscriberId,
        },
      });
    } catch (error) {
      console.error("Failed to send notification via Novu:", error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(
    db: AppDatabase,
    payload: EmailNotificationPayload
  ): Promise<void> {
    const multiChannelPayload: MultiChannelNotificationPayload = {
      ...payload,
      email: {
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      },
      channels: ["email"],
    };

    await this.sendNotification(db, multiChannelPayload);
  }

  /**
   * Send in-app notification
   */
  async sendInApp(
    db: AppDatabase,
    payload: InAppNotificationPayload
  ): Promise<void> {
    const multiChannelPayload: MultiChannelNotificationPayload = {
      ...payload,
      inApp: {
        cta: payload.cta,
      },
      channels: ["in_app"],
    };

    await this.sendNotification(db, multiChannelPayload);
  }

  /**
   * Send notification with fallback (try in-app first, fallback to email)
   */
  async sendWithFallback(
    db: AppDatabase,
    payload: MultiChannelNotificationPayload
  ): Promise<void> {
    const preferences = await this.getUserPreferences(
      db,
      payload.userId,
      payload.notificationType
    );

    // Try in-app first if enabled
    if (preferences?.inAppEnabled && payload.inApp) {
      try {
        await this.sendInApp(db, {
          ...payload,
          cta: payload.inApp.cta,
        });
        return;
      } catch (error) {
        console.warn("In-app notification failed, falling back to email:", error);
        // Fall through to email
      }
    }

    // Fallback to email if enabled
    if (preferences?.emailEnabled && payload.email) {
      await this.sendEmail(db, {
        ...payload,
        to: payload.email.to,
        subject: payload.email.subject,
        html: payload.email.html,
        text: payload.email.text,
      });
    }
  }
}

export const novuService = new NovuService();

