import { Novu } from "@novu/node";
import { env } from "../env.js";

let novuInstance: Novu | null = null;

/**
 * Get or create Novu client singleton instance
 */
export function getNovuClient(): Novu {
  if (!novuInstance) {
    const apiKey = env.NOVU_API_KEY;

    if (!apiKey) {
      throw new Error(
        "NOVU_API_KEY is not set. Please configure it in your environment variables."
      );
    }

    novuInstance = new Novu(apiKey);
  }

  return novuInstance;
}

/**
 * Initialize Novu client (call this at application startup)
 */
export function initializeNovu(): Novu {
  const client = getNovuClient();
  console.log("✅ Novu client initialized");
  return client;
}

