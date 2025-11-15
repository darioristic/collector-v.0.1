#!/usr/bin/env bun

/**
 * Migrate and Seed Script
 *
 * Convenient script for development that:
 * 1. Runs all pending migrations
 * 2. Seeds the database with test data
 *
 * Usage:
 *   bun run apps/api/scripts/migrate-and-seed.ts [options]
 *
 * Options:
 *   --drop               Drop all tables before migrating (DANGEROUS!)
 *   --seed-only          Skip migrations, only run seed
 *   --migrate-only       Skip seeding, only run migrations
 *   --skip <modules>     Skip specific seed modules
 *   --only <modules>     Run only specific seed modules
 *   --verbose, -v        Show verbose logging
 *   --help, -h           Show help message
 */

import { execSync } from "child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pgClient, db } from "../src/db/index";
import { runSeeds, type SeedModule } from "../src/db/seed/seed-runner";
import { seedAuth } from "../src/db/seed/auth";
import { seedAccounts } from "../src/db/seed/accounts";
import { seedProducts } from "../src/db/seed/products";
import { seedCrm } from "../src/db/seed/crm";
import { seedSales } from "../src/db/seed/sales";
import { seedProjects } from "../src/db/seed/projects";
import { seedSettings } from "../src/db/seed/settings";
import { seedHr } from "../src/db/seed/hr";
import { seedNotifications } from "../src/db/seed/notifications";

type Options = {
  drop: boolean;
  seedOnly: boolean;
  migrateOnly: boolean;
  skip?: string[];
  only?: string[];
  verbose: boolean;
};

const seedModules: SeedModule[] = [
  {
    name: "auth",
    description: "Authentication: roles, companies, users",
    dependencies: [],
    seedFn: seedAuth
  },
  {
    name: "accounts",
    description: "Accounts: companies and contacts",
    dependencies: [],
    seedFn: seedAccounts
  },
  {
    name: "products",
    description: "Products: categories, locations, products, inventory",
    dependencies: [],
    seedFn: seedProducts
  },
  {
    name: "crm",
    description: "CRM: leads, activities, deals",
    dependencies: ["auth", "accounts"],
    seedFn: seedCrm
  },
  {
    name: "sales",
    description: "Sales: quotes, orders, invoices",
    dependencies: ["accounts", "products"],
    seedFn: seedSales
  },
  {
    name: "projects",
    description: "Projects: projects with tasks, milestones, budget",
    dependencies: ["auth", "accounts"],
    seedFn: seedProjects
  },
  {
    name: "settings",
    description: "Settings: team members",
    dependencies: ["auth"],
    seedFn: seedSettings
  },
  {
    name: "hr",
    description: "HR: employees, recruitment, performance reviews, leave management, payroll",
    dependencies: ["auth"],
    seedFn: seedHr
  },
  {
    name: "notifications",
    description: "Notifications: various notification types for users",
    dependencies: ["auth"],
    seedFn: seedNotifications
  }
];

function parseArgs(): Options {
  const args = process.argv.slice(2);

  const options: Options = {
    drop: false,
    seedOnly: false,
    migrateOnly: false,
    skip: undefined,
    only: undefined,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--drop":
        options.drop = true;
        break;
      case "--seed-only":
        options.seedOnly = true;
        break;
      case "--migrate-only":
        options.migrateOnly = true;
        break;
      case "--skip":
        if (args[i + 1]) {
          options.skip = args[i + 1].split(",");
          i++;
        }
        break;
      case "--only":
        if (args[i + 1]) {
          options.only = args[i + 1].split(",");
          i++;
        }
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Migrate and Seed Script

Usage: bun run apps/api/scripts/migrate-and-seed.ts [options]

Options:
  --drop               Drop all tables before migrating (DANGEROUS!)
                       Use with caution - this will delete ALL data!

  --seed-only          Skip migrations, only run seed

  --migrate-only       Skip seeding, only run migrations

  --skip <modules>     Skip specific seed modules (comma-separated)
                       Example: --skip crm,projects

  --only <modules>     Run only specific seed modules (comma-separated)
                       Example: --only auth,accounts

  --verbose, -v        Show verbose logging

  --help, -h           Show this help message

Available seed modules:
${seedModules.map(m => `  - ${m.name.padEnd(15)} ${m.description}`).join('\n')}

Examples:
  # Run migrations and seed everything
  bun run apps/api/scripts/migrate-and-seed.ts

  # Drop tables, migrate, and seed
  bun run apps/api/scripts/migrate-and-seed.ts --drop

  # Only run migrations
  bun run apps/api/scripts/migrate-and-seed.ts --migrate-only

  # Only seed auth and accounts
  bun run apps/api/scripts/migrate-and-seed.ts --seed-only --only auth,accounts

  # Full reset with verbose logging
  bun run apps/api/scripts/migrate-and-seed.ts --drop --verbose
`);
}

function log(message: string, color: string = '\x1b[36m') {
  console.log(`${color}[INFO]\x1b[0m ${new Date().toISOString()} - ${message}`);
}

function success(message: string) {
  console.log(`\x1b[32m[SUCCESS]\x1b[0m ${new Date().toISOString()} - ${message}`);
}

function error(message: string) {
  console.error(`\x1b[31m[ERROR]\x1b[0m ${new Date().toISOString()} - ${message}`);
}

function warn(message: string) {
  console.warn(`\x1b[33m[WARN]\x1b[0m ${new Date().toISOString()} - ${message}`);
}

async function dropAllTables() {
  warn("Dropping all tables...");
  warn("THIS WILL DELETE ALL DATA!");

  try {
    await db.execute(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        -- Drop all tables
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;

        -- Drop all enums
        FOR r IN (SELECT t.typname FROM pg_type t
          JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
          WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
          EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    await db.execute(`DROP SCHEMA IF EXISTS drizzle CASCADE;`);

    success("All tables and types dropped successfully");
  } catch (err) {
    error(`Failed to drop tables: ${err instanceof Error ? err.message : 'Unknown error'}`);
    throw err;
  }
}

async function runMigrations() {
  log("Running migrations...");

  try {
    // Use migrate.ts to apply migrations
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const appRoot = scriptDir.endsWith("/scripts") ? dirname(scriptDir) : scriptDir;
    execSync("bun run db:migrate", {
      cwd: appRoot,
      stdio: "inherit"
    });

    success("Migrations completed successfully");
  } catch (err) {
    error(`Failed to run migrations: ${err instanceof Error ? err.message : 'Unknown error'}`);
    throw err;
  }
}

async function runSeed(options: Options) {
  log("Running seed...");

  try {
    await runSeeds(seedModules, {
      skip: options.skip,
      only: options.only,
      verbose: options.verbose,
      continueOnError: false,
      database: db
    });

    success("Seed completed successfully");
  } catch (err) {
    error(`Failed to run seed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    throw err;
  }
}

async function main() {
  const options = parseArgs();

  console.log("\n" + "=".repeat(60));
  console.log("MIGRATE AND SEED");
  console.log("=".repeat(60) + "\n");

  try {
    // Drop tables if requested
    if (options.drop && !options.seedOnly) {
      await dropAllTables();
    }

    // Run migrations unless seed-only
    if (!options.seedOnly) {
      await runMigrations();
    }

    // Run seed unless migrate-only
    if (!options.migrateOnly) {
      await runSeed(options);
    }

    console.log("\n" + "=".repeat(60));
    success("All operations completed successfully!");
    console.log("=".repeat(60) + "\n");
  } catch {
    console.log("\n" + "=".repeat(60));
    error("Operation failed");
    console.log("=".repeat(60) + "\n");
    process.exit(1);
  } finally {
    await pgClient.end();
  }
}

main();