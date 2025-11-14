import { defineConfig } from "vitest/config";

export default defineConfig({
  root: __dirname,
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      reporter: ["text", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: ["src/server.ts"]
    }
  }
});

