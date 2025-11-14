const ensureEnv = (key: string, fallback: string): void => {
	if (!process.env[key] || process.env[key]?.length === 0) {
		process.env[key] = fallback;
	}
};

ensureEnv("NODE_ENV", "test");
ensureEnv("PORT", "4000");
ensureEnv("HOST", "127.0.0.1");
ensureEnv("DATABASE_URL", "pg-mem");
ensureEnv("TEST_DATABASE_URL", "pg-mem");
ensureEnv("REDIS_URL", "redis://127.0.0.1:6379");
ensureEnv("ALLOWED_ORIGINS", "*");



