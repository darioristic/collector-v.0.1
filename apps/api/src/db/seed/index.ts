import { pgClient, db } from "../index";
import { seedAuth } from "./auth";
import { seedAccounts } from "./accounts";
import { seedCrm } from "./crm";
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
    description: "Accounts: companies and contacts (50 companies, 100 contacts)",
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
    description: "CRM: leads, activities, deals (60 leads, 60 activities, 50 deals)",
    dependencies: ["auth", "accounts"],
    seedFn: seedCrm
  },
  {
    name: "sales",
    description: "Sales: quotes, orders, invoices with items (50 of each)",
    dependencies: ["accounts", "products"],
    seedFn: seedSales
  },
  {
    name: "projects",
    description: "Projects: projects with tasks, milestones, budget (10 projects)",
    dependencies: ["auth", "accounts"],
    seedFn: seedProjects
  },
  {
    name: "settings",
    description: "Settings: team members (8 members)",
    dependencies: [],
    seedFn: seedSettings
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
  console.log(`
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
`);
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
    console.error("\n❌ Seed failed:", error instanceof Error ? error.message : error);
    await pgClient.end();
    process.exit(1);
  });
