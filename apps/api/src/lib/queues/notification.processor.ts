import { Worker, Job } from "bullmq";
import { createRedisConnection } from "./notification.queue.js";
import { novuService } from "../novu/novu.service.js";
import type { NotificationJobData } from "../novu/novu.types.js";
import { db } from "../../db/index.js";

/**
 * Process notification job
 */
async function processNotificationJob(
  job: Job<NotificationJobData>
): Promise<void> {
  const { payload, workflowId } = job.data;

  console.log(`Processing notification job ${job.id} for workflow ${workflowId}`, {
    userId: payload.userId,
    notificationType: payload.notificationType,
  });

  try {
    await novuService.sendNotification(db, payload);
    console.log(`✅ Notification job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`❌ Notification job ${job.id} failed:`, error);
    throw error; // Re-throw to trigger retry mechanism
  }
}

/**
 * Create notification worker
 * This worker processes jobs from the notification queue
 */
export function createNotificationWorker(): Worker<NotificationJobData> {
  const worker = new Worker<NotificationJobData>(
    "notifications",
    async (job) => {
      return processNotificationJob(job);
    },
    {
      connection: createRedisConnection(),
      concurrency: 5, // Process up to 5 jobs concurrently
      limiter: {
        max: 100, // Max 100 jobs
        duration: 1000, // Per second
      },
    }
  );

  worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(`❌ Job ${job?.id} failed:`, error);
  });

  worker.on("error", (error) => {
    console.error("Worker error:", error);
  });

  console.log("✅ Notification worker started");

  return worker;
}

/**
 * Global worker instance
 */
let notificationWorker: Worker<NotificationJobData> | null = null;

/**
 * Initialize notification worker
 */
export function initializeNotificationWorker(): Worker<NotificationJobData> {
  if (!notificationWorker) {
    notificationWorker = createNotificationWorker();
  }
  return notificationWorker;
}

/**
 * Close notification worker
 */
export async function closeNotificationWorker(): Promise<void> {
  if (notificationWorker) {
    await notificationWorker.close();
    notificationWorker = null;
    console.log("✅ Notification worker closed");
  }
}

