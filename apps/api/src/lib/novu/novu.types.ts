/**
 * Notification preference types
 */
export type NotificationPreferenceType =
  | "invoice"
  | "payment"
  | "transaction"
  | "daily_summary"
  | "quote"
  | "deal"
  | "project"
  | "task"
  | "system";

/**
 * Notification channel types
 */
export type NotificationChannel = "email" | "in_app";

/**
 * Base notification payload
 */
export interface BaseNotificationPayload {
  userId: string;
  companyId: string;
  notificationType: NotificationPreferenceType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Email notification payload
 */
export interface EmailNotificationPayload extends BaseNotificationPayload {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

/**
 * In-app notification payload
 */
export interface InAppNotificationPayload extends BaseNotificationPayload {
  cta?: {
    type: "redirect";
    data: {
      url: string;
    };
  };
}

/**
 * Multi-channel notification payload
 */
export interface MultiChannelNotificationPayload extends BaseNotificationPayload {
  email?: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
  };
  inApp?: {
    cta?: {
      type: "redirect";
      data: {
        url: string;
      };
    };
  };
  channels?: NotificationChannel[];
  fallback?: boolean; // If true, fallback to email if in-app fails
}

/**
 * Notification job data for queue
 */
export interface NotificationJobData {
  payload: MultiChannelNotificationPayload;
  workflowId: string;
  retryCount?: number;
}

/**
 * User notification preferences
 */
export interface UserNotificationPreferences {
  userId: string;
  notificationType: NotificationPreferenceType;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

