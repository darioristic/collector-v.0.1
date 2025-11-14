import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export type DashboardDatabase = PostgresJsDatabase<Record<string, never>>;

export type SeedModuleResult = {
	recordsCreated?: number;
	summary?: string;
};

export type SeedModule = {
	name: string;
	description: string;
	dependencies: string[];
	seedFn: (
		database: DashboardDatabase,
		options?: { force?: boolean },
	) => Promise<void | SeedModuleResult>;
};

export type SeedOptions = {
	only?: string[];
	skip?: string[];
	continueOnError?: boolean;
	verbose?: boolean;
	force?: boolean;
	database: DashboardDatabase;
};

export type SeedResult = {
	module: string;
	status: "success" | "failed" | "skipped";
	duration: number;
	recordsCreated?: number;
	summary?: string;
	error?: Error;
};

export type SeedSummary = {
	totalModules: number;
	successful: number;
	failed: number;
	skipped: number;
	totalDuration: number;
	results: SeedResult[];
};

class SeedLogger {
	constructor(private readonly verbose = false) {}

	info(message: string) {
		console.log(
			`\x1b[36m[INFO]\x1b[0m ${new Date().toISOString()} - ${message}`,
		);
	}

	success(message: string) {
		console.log(
			`\x1b[32m[SUCCESS]\x1b[0m ${new Date().toISOString()} - ${message}`,
		);
	}

	warn(message: string) {
		console.warn(
			`\x1b[33m[WARN]\x1b[0m ${new Date().toISOString()} - ${message}`,
		);
	}

	error(message: string) {
		console.error(
			`\x1b[31m[ERROR]\x1b[0m ${new Date().toISOString()} - ${message}`,
		);
	}

	debug(message: string) {
		if (this.verbose) {
			console.log(
				`\x1b[90m[DEBUG]\x1b[0m ${new Date().toISOString()} - ${message}`,
			);
		}
	}

	isVerbose() {
		return this.verbose;
	}

	module(name: string, status: "start" | "end" | "error") {
		const symbols = { start: "▶", end: "✓", error: "✗" } as const;
		const colors = {
			start: "\x1b[34m",
			end: "\x1b[32m",
			error: "\x1b[31m",
		} as const;

		console.log(`${colors[status]}${symbols[status]} ${name}\x1b[0m`);
	}
}

function validateDependencies(modules: SeedModule[], options: SeedOptions) {
	const errors: string[] = [];
	const moduleNames = new Set(modules.map((module) => module.name));

	let activeModules = modules;

	if (options.only?.length) {
		activeModules = activeModules.filter((module) =>
			options.only!.includes(module.name),
		);
	}

	if (options.skip?.length) {
		activeModules = activeModules.filter(
			(module) => !options.skip!.includes(module.name),
		);
	}

	for (const module of activeModules) {
		for (const dependency of module.dependencies) {
			if (!moduleNames.has(dependency)) {
				errors.push(
					`Modul "${module.name}" zavisi od nepostojećeg modula "${dependency}".`,
				);
			}

			if (
				options.skip?.includes(dependency) &&
				!options.skip.includes(module.name)
			) {
				errors.push(
					`Modul "${module.name}" zavisi od "${dependency}", ali je "${dependency}" preskočen.`,
				);
			}

			if (options.only && !options.only.includes(dependency)) {
				errors.push(
					`Modul "${module.name}" zavisi od "${dependency}", ali "${dependency}" nije u --only listi.`,
				);
			}
		}
	}

	return { valid: errors.length === 0, errors };
}

function sortModulesByDependencies(modules: SeedModule[]) {
	const sorted: SeedModule[] = [];
	const visited = new Set<string>();
	const visiting = new Set<string>();
	const moduleMap = new Map(modules.map((module) => [module.name, module]));

	const visit = (moduleName: string) => {
		if (visited.has(moduleName)) {
			return;
		}

		if (visiting.has(moduleName)) {
			throw new Error(`Otkrivena je kružna zavisnost: ${moduleName}`);
		}

		visiting.add(moduleName);
		const module = moduleMap.get(moduleName);

		if (!module) {
			return;
		}

		for (const dependency of module.dependencies) {
			visit(dependency);
		}

		visiting.delete(moduleName);
		visited.add(moduleName);
		sorted.push(module);
	};

	for (const module of modules) {
		visit(module.name);
	}

	return sorted;
}

async function runModule(
	module: SeedModule,
	database: DashboardDatabase,
	logger: SeedLogger,
	options: SeedOptions,
): Promise<SeedResult> {
	const start = Date.now();

	logger.module(module.name, "start");
	logger.info(`Pokrećem modul ${module.name}: ${module.description}`);

	try {
		// Pass force option to seed function if it accepts it
		const seedFn = module.seedFn as (
			db: DashboardDatabase,
			opts?: { force?: boolean },
		) => Promise<void | SeedModuleResult>;
		const outcome = await seedFn(database, { force: options.force });
		const duration = Date.now() - start;

		logger.module(module.name, "end");
		logger.success(`Modul ${module.name} završen za ${duration}ms`);

		return {
			module: module.name,
			status: "success",
			duration,
			recordsCreated: outcome?.recordsCreated,
			summary: outcome?.summary,
		};
	} catch (error) {
		const duration = Date.now() - start;

		logger.module(module.name, "error");
		logger.error(
			`Modul ${module.name} je pao: ${error instanceof Error ? error.message : String(error)}`,
		);

		if (error instanceof Error && logger.isVerbose()) {
			logger.debug(error.stack ?? "Bez stack trace-a");
		}

		return {
			module: module.name,
			status: "failed",
			duration,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}

function printSummary(summary: SeedSummary, logger: SeedLogger) {
	console.log("\n" + "=".repeat(60));
	console.log("SEED REZIME");
	console.log("=".repeat(60));

	logger.info(`Ukupno modula: ${summary.totalModules}`);
	logger.success(`Uspešnih: ${summary.successful}`);

	if (summary.failed > 0) {
		logger.error(`Neuspešnih: ${summary.failed}`);
	}

	if (summary.skipped > 0) {
		logger.warn(`Preskočenih: ${summary.skipped}`);
	}

	logger.info(`Ukupno trajanje: ${summary.totalDuration}ms`);

	console.log("\nDETALJI:");
	console.log("-".repeat(60));

	for (const result of summary.results) {
		const symbol = { success: "✓", failed: "✗", skipped: "○" }[result.status];
		const color = {
			success: "\x1b[32m",
			failed: "\x1b[31m",
			skipped: "\x1b[33m",
		}[result.status];

		console.log(
			`${color}${symbol}\x1b[0m ${result.module.padEnd(20)} ${result.duration}ms`,
		);

		if (typeof result.recordsCreated === "number") {
			console.log(`  └─ Kreirano zapisa: ${result.recordsCreated}`);
		}

		if (result.summary) {
			console.log(`  └─ ${result.summary}`);
		}

		if (result.error) {
			console.log(`  └─ Greška: ${result.error.message}`);
		}
	}

	console.log("=".repeat(60) + "\n");
}

export async function runSeeds(
	modules: SeedModule[],
	options: SeedOptions,
): Promise<SeedSummary> {
	const logger = new SeedLogger(options.verbose);
	const database = options.database;
	const start = Date.now();

	logger.info("Pokrećem seed skriptu za dashboard bazu...");

	const validation = validateDependencies(modules, options);
	if (!validation.valid) {
		logger.error("Validacija zavisnosti nije prošla:");
		for (const error of validation.errors) {
			logger.error(`  - ${error}`);
		}
		throw new Error("Seed zavisnosti nisu validne");
	}

	let activeModules = modules;

	if (options.only?.length) {
		logger.info(`Pokrećem samo: ${options.only.join(", ")}`);
		activeModules = activeModules.filter((module) =>
			options.only!.includes(module.name),
		);
	}

	if (options.skip?.length) {
		logger.info(`Preskačem: ${options.skip.join(", ")}`);
		activeModules = activeModules.filter(
			(module) => !options.skip!.includes(module.name),
		);
	}

	try {
		activeModules = sortModulesByDependencies(activeModules);
	} catch (error) {
		logger.error(
			`Sortiranje modula nije uspelo: ${error instanceof Error ? error.message : error}`,
		);
		throw error;
	}

	logger.info(`Ukupno aktivnih modula: ${activeModules.length}`);
	logger.debug(
		`Redosled: ${activeModules.map((module) => module.name).join(" → ")}`,
	);

	const results: SeedResult[] = [];

	for (const module of activeModules) {
		const result = await runModule(module, database, logger, options);
		results.push(result);

		if (result.status === "failed" && !options.continueOnError) {
			logger.error(
				"Zaustavljam dalji rad (dodaj --continue-on-error da preskočiš greške).",
			);
			break;
		}
	}

	const skippedModules = modules.filter(
		(module) => !activeModules.find((active) => active.name === module.name),
	);

	for (const module of skippedModules) {
		results.push({ module: module.name, status: "skipped", duration: 0 });
	}

	const summary: SeedSummary = {
		totalModules: modules.length,
		successful: results.filter((result) => result.status === "success").length,
		failed: results.filter((result) => result.status === "failed").length,
		skipped: results.filter((result) => result.status === "skipped").length,
		totalDuration: Date.now() - start,
		results,
	};

	printSummary(summary, logger);

	if (summary.failed > 0) {
		throw new Error(`Seed je pao: ${summary.failed} modul(a) nije prošlo`);
	}

	logger.success("Seed je uspešno završen.");
	return summary;
}
