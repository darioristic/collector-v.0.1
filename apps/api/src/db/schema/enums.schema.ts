import { pgEnum } from "drizzle-orm/pg-core";

// Define roleKey enum in separate file to avoid circular dependency
export const roleKey = pgEnum("role_key", [
  "admin",
  "manager",
  "user",
  "sales_manager",
  "sales_rep",
  "support",
  "viewer"
]);

