import "dotenv/config";

import { drizzle as drizzlePostgresJs } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { runSeeds, type SeedModule } from "./seed-runner";
import { seedEmployees } from "./employees";
import { seedVault } from "./vault";

const DEFAULT_LOCAL_CONNECTION =
	"postgres://postgres:postgres@localhost:5432/collector_dashboard";

const environment = process.env.NODE_ENV ?? "development";
const forceInMemory = process.env.USE_IN_MEMORY_DB === "true";
const rawConnectionString = process.env.DATABASE_URL?.trim();
const fallbackConnectionString =
	!rawConnectionString && !forceInMemory && environment !== "production"
		? DEFAULT_LOCAL_CONNECTION
		: undefined;
const connectionString = rawConnectionString ?? fallbackConnectionString;

if (!connectionString || connectionString === "pg-mem") {
	throw new Error(
		"DATABASE_URL mora biti definisan i mora ukazivati na PostgreSQL instancu za pokretanje seed skripti.",
	);
}

// Set DATABASE_URL if we're using fallback
if (!rawConnectionString && fallbackConnectionString) {
	process.env.DATABASE_URL = fallbackConnectionString;
}

const client = postgres(connectionString, {
	max: Number(process.env.DB_MAX_CONNECTIONS ?? 5),
	idle_timeout: 0,
	prepare: false,
	ssl:
		process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

const db = drizzlePostgresJs(client);

const seedModules: SeedModule[] = [
	{
		name: "employees",
		description: "Kreira 24 zaposlena u različitim departmanima IT firme.",
		dependencies: [],
		seedFn: async (database) => {
			const result = await seedEmployees(database);
			return {
				recordsCreated: result.inserted,
				summary: `Preskočeno: ${result.skipped}`,
			};
		},
	},
	{
		name: "vault",
		description: "Kreira osnovne root foldere u digitalnom sefu.",
		dependencies: [],
		seedFn: async (database) => {
			const result = await seedVault(database);
			return {
				recordsCreated: result.inserted,
				summary: `Preskočeno: ${result.skipped}`,
			};
		},
	},
];

type ParsedArgs = {
	only?: string[];
	skip?: string[];
	continueOnError: boolean;
	verbose: boolean;
};

function parseArgs(): ParsedArgs {
	const args = process.argv.slice(2);
	const options: ParsedArgs = {
		only: undefined,
		skip: undefined,
		continueOnError: false,
		verbose: false,
	};

	for (let index = 0; index < args.length; index++) {
		const arg = args[index];

		if (arg === "--only" && args[index + 1]) {
			options.only = args[index + 1].split(",").map((value) => value.trim());
			index++;
		} else if (arg === "--skip" && args[index + 1]) {
			options.skip = args[index + 1].split(",").map((value) => value.trim());
			index++;
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

function printHelp() {
	console.log(`
Dashboard Database Seed

Usage: bun lib/db/seed/index.ts [options]

Options:
  --only <modules>         Pokreni samo određene module (lista odvojenih zarezom)
  --skip <modules>         Preskoči određene module
  --continue-on-error      Nastavi čak i ako modul padne
  --verbose, -v            Prikaži dodatne logove
  --help, -h               Prikaži ovu poruku

Dostupni moduli:
${seedModules.map((module) => `  - ${module.name.padEnd(12)} ${module.description}`).join("\n")}
`);
}

const run = async () => {
	const options = parseArgs();

	await runSeeds(seedModules, {
		...options,
		database: db,
	});
};

run()
	.then(async () => {
		await client.end({ timeout: 5 });
		process.exit(0);
	})
	.catch(async (error) => {
		console.error(
			"\n❌ Seed nije uspeo:",
			error instanceof Error ? error.message : error,
		);
		await client.end({ timeout: 5 });
		process.exit(1);
	});
