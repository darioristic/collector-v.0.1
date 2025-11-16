import { Queue, QueueOptions } from "bullmq";
import Redis from "ioredis";
import { env } from "../env.js";
import type { NotificationJobData } from "../novu/novu.types.js";

/**
 * Create Redis connection for BullMQ
 */
export function createRedisConnection(): Redis {
  const redisUrl = env.REDIS_URL;

  try {
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    redis.on("error", (error) => {
      console.error("Redis connection error:", error);
    });

    redis.on("connect", () => {
      console.log("✅ Redis connected for BullMQ");
    });

    return redis;
  } catch (error) {
    console.error("Failed to create Redis connection:", error);
    throw error;
  }
}

/**
 * Redis connection instance
 */
const redisConnection = createRedisConnection();

/**
 * Queue options
 */
const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
};

/**
 * Notification queue instance
 * This queue processes notification jobs asynchronously
 */
export const notificationQueue = new Queue<NotificationJobData>(
  "notifications",
  queueOptions
);

/**
 * Initialize the notification queue
 */
export function initializeNotificationQueue(): void {
  console.log("✅ Notification queue initialized");

  // Log queue metrics periodically in development
  if (process.env.NODE_ENV === "development") {
    setInterval(async () => {
      const [waiting, active, completed, failed] = await Promise.all([
        notificationQueue.getWaitingCount(),
        notificationQueue.getActiveCount(),
        notificationQueue.getCompletedCount(),
        notificationQueue.getFailedCount(),
      ]);

      if (waiting > 0 || active > 0 || failed > 0) {
        console.log("📊 Queue metrics:", {
          waiting,
          active,
          completed,
          failed,
        });
      }
    }, 30000); // Every 30 seconds
  }
}

/**
 * Gracefully close queue connections
 */
export async function closeNotificationQueue(): Promise<void> {
  await notificationQueue.close();
  await redisConnection.quit();
  console.log("✅ Notification queue closed");
}

