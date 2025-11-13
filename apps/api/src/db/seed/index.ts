import { pgClient, db } from "../index";
import { logger } from "../../lib/logger";
import { seedAuth } from "./auth";
import { seedAccounts } from "./accounts";
import { seedCrm } from "./crm";
import { seedHr } from "./hr";
import { seedNotifications } from "./notifications";
import { seedProducts } from "./products";
import { seedSales } from "./sales";
import { seedProjects } from "./projects";
import { seedSettings } from "./settings";
import { runSeeds, type SeedModule } from "./seed-runner";

/**
 * Define all seed modules with dependencies
 */
const seedModules: SeedModule[] = [
  {
    name: "auth",
    description: "Authentication: roles, companies, users",
    dependencies: [],
    seedFn: seedAuth
  },
  {
    name: "accounts",
    description: "Accounts: companies, contacts, and addresses (50 companies, 100 contacts, ~65 addresses)",
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
    description: "CRM: leads, opportunities, activities, deals, notes (60 leads, 45 opportunities, 35 activities, 60 client activities, 50 deals, 30 notes)",
    dependencies: ["auth", "accounts"],
    seedFn: seedCrm
  },
  {
    name: "sales",
    description: "Sales: quotes, orders, invoices, payments, deals (50 quotes, 50 orders, 50 invoices, ~30 payments, ~25 sales deals)",
    dependencies: ["accounts", "products", "crm"],
    seedFn: seedSales
  },
  {
    name: "projects",
    description: "Projects: projects with teams, tasks, milestones, budget, time entries (10 projects, ~15 teams, 250 tasks, 50 milestones, ~200 time entries)",
    dependencies: ["auth", "accounts"],
    seedFn: seedProjects
  },
  {
    name: "settings",
    description: "Settings: team members, permissions, integrations (8 members, ~25 permissions, 4 integrations)",
    dependencies: ["auth"],
    seedFn: seedSettings
  },
  {
    name: "hr",
    description: "HR: employees, role assignments, attendance, time off, payroll",
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

/**
 * Parse command line arguments
 */
function parseArgs(): {
  only?: string[];
  skip?: string[];
  continueOnError: boolean;
  verbose: boolean;
} {
  const args = process.argv.slice(2);
  const options = {
    only: undefined as string[] | undefined,
    skip: undefined as string[] | undefined,
    continueOnError: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--only" && args[i + 1]) {
      options.only = args[i + 1].split(",");
      i++;
    } else if (arg === "--skip" && args[i + 1]) {
      options.skip = args[i + 1].split(",");
      i++;
    } else if (arg === "--continue-on-error") {
      options.continueOnError = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp() {
  const helpText = `
Database Seed Script

Usage: bun run seed [options]

Options:
  --only <modules>         Run only specific modules (comma-separated)
                          Example: --only auth,accounts

  --skip <modules>         Skip specific modules (comma-separated)
                          Example: --skip crm,projects

  --continue-on-error     Continue seeding even if a module fails

  --verbose, -v           Show verbose logging including debug messages

  --help, -h              Show this help message

Available modules:
${seedModules
  .map(m => `  - ${m.name.padEnd(15)} ${m.description}`)
  .join('\n')}

Examples:
  # Seed everything
  bun run seed

  # Seed only auth and accounts
  bun run seed --only auth,accounts

  # Seed everything except CRM
  bun run seed --skip crm

  # Continue on error with verbose logging
  bun run seed --continue-on-error --verbose
`;
  // Use process.stdout.write for help text to ensure proper formatting
  process.stdout.write(helpText);
}

/**
 * Main execution
 */
const run = async () => {
  const options = parseArgs();

  await runSeeds(seedModules, {
    ...options,
    database: db
  });
};

run()
  .then(async () => {
    await pgClient.end();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error(
      { err: error },
      `Seed failed: ${error instanceof Error ? error.message : String(error)}`
    );
    await pgClient.end();
    process.exit(1);
  });
