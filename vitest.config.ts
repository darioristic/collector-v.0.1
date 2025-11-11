import path from "node:path";

import apiConfig from "./apps/api/vitest.config";
import dashboardConfig from "./apps/dashboard/vitest.config";
import { defineConfig, defineProject } from "vitest/config";

export default defineConfig({
  projects: [
    defineProject({
      ...apiConfig,
      root: path.resolve(__dirname, "apps/api"),
      test: {
        ...apiConfig.test,
        name: "api"
      }
    }),
    defineProject({
      ...dashboardConfig,
      root: path.resolve(__dirname, "apps/dashboard"),
      test: {
        ...dashboardConfig.test,
        name: "dashboard"
      },
      resolve: {
        ...dashboardConfig.resolve,
        alias: {
          ...(dashboardConfig.resolve?.alias ?? {}),
          "@": path.resolve(__dirname, "apps/dashboard")
        }
      },
      css: dashboardConfig.css
    })
  ]
});

