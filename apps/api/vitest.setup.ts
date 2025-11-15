import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envTestPath = join(__dirname, ".env.test");

try {
    const { config } = await import("dotenv");
    if (existsSync(envTestPath)) {
        config({ path: envTestPath });
    } else {
        config({ path: join(__dirname, ".env") });
    }
} catch {
    // ignore if dotenv is unavailable
}

const ensureEnv = (key: string, fallback: string): void => {
    if (!process.env[key] || process.env[key]?.length === 0) {
        process.env[key] = fallback;
    }
};

ensureEnv("NODE_ENV", "test");
ensureEnv("PORT", "4000");
ensureEnv("HOST", "127.0.0.1");
ensureEnv("REDIS_URL", "redis://127.0.0.1:6379");
ensureEnv("ALLOWED_ORIGINS", "*");



