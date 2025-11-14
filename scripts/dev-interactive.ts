#!/usr/bin/env -S bun --smol

/**
 * Interactive Development Environment Manager
 *
 * Enhanced dev workflow with interactive seed selection:
 * - Manages infrastructure (Docker/local PostgreSQL/Redis)
 * - Interactive menu for seed module selection
 * - Confirmation before seeding
 * - Starts dev servers with proper orchestration
 */

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import * as readline from "node:readline";

// ============================================================================
// CONFIGURATION
// ============================================================================

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = join(rootDir, "apps", "api");

const DEFAULT_PORTS = {
	api: 4000,
	web: 3000,
	socket: 3001,
	notification: 4002,
	chat: 4001,
	postgres: 5432,
	redis: 6379,
};

// ============================================================================
// LOGGER
// ============================================================================

class DevLogger {
	private startTime = Date.now();

	private formatTime(): string {
		const elapsed = Date.now() - this.startTime;
		const seconds = Math.floor(elapsed / 1000);
		const ms = elapsed % 1000;
		return `[${seconds}s ${ms}ms]`;
	}

	step(message: string) {
		console.log(`\n${"\x1b[36m"}▶ ${message}${"\x1b[0m"} ${this.formatTime()}`);
	}

	success(message: string) {
		console.log(`${"\x1b[32m"}✓${"\x1b[0m"} ${message}`);
	}

	error(message: string) {
		console.error(`${"\x1b[31m"}✗${"\x1b[0m"} ${message}`);
	}

	warn(message: string) {
		console.warn(`${"\x1b[33m"}⚠${"\x1b[0m"} ${message}`);
	}

	info(message: string) {
		console.log(`${"\x1b[90m"}ℹ${"\x1b[0m"} ${message}`);
	}

	section(title: string) {
		console.log(`\n${"=".repeat(60)}`);
		console.log(`${"\x1b[1m"}${title}${"\x1b[0m"}`);
		console.log("=".repeat(60));
	}
}

const logger = new DevLogger();

// ============================================================================
// INTERACTIVE MENU
// ============================================================================

interface SeedModule {
	name: string;
	description: string;
	dependencies: string[];
}

const SEED_MODULES: SeedModule[] = [
	{
		name: "auth",
		description: "Authentication: roles, companies, users",
		dependencies: [],
	},
	{
		name: "accounts",
		description:
			"Accounts: companies, contacts, and addresses (50 companies, 100 contacts, ~65 addresses)",
		dependencies: [],
	},
	{
		name: "products",
		description: "Products: categories, locations, products, inventory",
		dependencies: [],
	},
	{
		name: "crm",
		description:
			"CRM: leads, opportunities, activities, deals, notes (60 leads, 45 opportunities, 35 activities, 60 client activities, 50 deals, 30 notes)",
		dependencies: ["auth", "accounts"],
	},
	{
		name: "sales",
		description:
			"Sales: quotes, orders, invoices, payments, deals (50 quotes, 50 orders, 50 invoices, ~30 payments, ~25 sales deals)",
		dependencies: ["accounts", "products", "crm"],
	},
	{
		name: "projects",
		description:
			"Projects: projects with teams, tasks, milestones, budget, time entries (10 projects, ~15 teams, 250 tasks, 50 milestones, ~200 time entries)",
		dependencies: ["auth", "accounts"],
	},
	{
		name: "settings",
		description:
			"Settings: team members, permissions, integrations (8 members, ~25 permissions, 4 integrations)",
		dependencies: ["auth"],
	},
	{
		name: "hr",
		description:
			"HR: employees, role assignments, attendance, time off, payroll",
		dependencies: ["auth"],
	},
	{
		name: "notifications",
		description: "Notifications: various notification types for users",
		dependencies: ["auth"],
	},
];

function createReadlineInterface() {
	return readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
}

function question(rl: readline.Interface, query: string): Promise<string> {
	return new Promise((resolve) => {
		rl.question(query, resolve);
	});
}

async function showSeedMenu(): Promise<{
	selectedModules: string[];
	skipSeed: boolean;
}> {
	const rl = createReadlineInterface();

	console.log("\n");
	logger.section("Interactive Seed Selection");
	console.log("\nDostupni seed moduli:\n");

	SEED_MODULES.forEach((module, index) => {
		const deps =
			module.dependencies.length > 0
				? ` (zavisi od: ${module.dependencies.join(", ")})`
				: "";
		console.log(
			`  ${index + 1}. ${"\x1b[36m"}${module.name.padEnd(15)}\x1b[0m ${module.description}${deps}`,
		);
	});

	console.log("\n");
	console.log("  a. Seed sve module");
	console.log("  s. Preskoči seedovanje");
	console.log("  q. Izlaz\n");

	let selectedModules: string[] = [];
	let skipSeed = false;

	while (true) {
		const answer = await question(
			rl,
			"\nIzaberite opciju (brojevi modula odvojeni zarezom, 'a' za sve, 's' za preskoči, 'q' za izlaz): ",
		).then((a) => a.trim().toLowerCase());

		if (answer === "q" || answer === "quit" || answer === "exit") {
			rl.close();
			process.exit(0);
		}

		if (answer === "s" || answer === "skip") {
			skipSeed = true;
			rl.close();
			break;
		}

		if (answer === "a" || answer === "all") {
			selectedModules = SEED_MODULES.map((m) => m.name);
			rl.close();
			break;
		}

		// Parse module numbers or names
		const selections = answer.split(",").map((s) => s.trim());
		const validSelections: string[] = [];

		for (const selection of selections) {
			const num = parseInt(selection, 10);
			if (!Number.isNaN(num) && num >= 1 && num <= SEED_MODULES.length) {
				validSelections.push(SEED_MODULES[num - 1].name);
			} else if (SEED_MODULES.some((m) => m.name === selection)) {
				validSelections.push(selection);
			} else {
				logger.warn(`Nevažeća opcija: ${selection}`);
			}
		}

		if (validSelections.length > 0) {
			selectedModules = validSelections;
			rl.close();
			break;
		} else {
			logger.error("Niste izabrali nijedan validan modul. Pokušajte ponovo.");
		}
	}

	// Resolve dependencies
	const modulesToSeed = new Set<string>(selectedModules);
	for (const moduleName of selectedModules) {
		const module = SEED_MODULES.find((m) => m.name === moduleName);
		if (module) {
			for (const dep of module.dependencies) {
				modulesToSeed.add(dep);
			}
		}
	}

	const finalModules = Array.from(modulesToSeed);

	// Show confirmation
	if (!skipSeed && finalModules.length > 0) {
		const rl2 = createReadlineInterface();
		console.log("\n");
		logger.section("Potvrda Seedovanja");
		console.log("\nModuli koji će biti seedovani (uključujući zavisnosti):\n");
		finalModules.forEach((name) => {
			const module = SEED_MODULES.find((m) => m.name === name);
			const isDependency = !selectedModules.includes(name);
			const marker = isDependency ? `${"\x1b[33m"}[zavisnost]\x1b[0m` : "";
			console.log(
				`  ${"\x1b[32m"}✓\x1b[0m ${name.padEnd(15)} ${module?.description || ""} ${marker}`,
			);
		});

		const confirm = await question(
			rl2,
			"\nNastaviti sa seedovanjem? (da/ne): ",
		).then((a) => a.trim().toLowerCase());
		rl2.close();

		if (
			confirm !== "da" &&
			confirm !== "yes" &&
			confirm !== "y" &&
			confirm !== "d"
		) {
			logger.info("Seedovanje otkazano.");
			return { selectedModules: [], skipSeed: true };
		}
	}

	return { selectedModules: finalModules, skipSeed };
}

// ============================================================================
// UTILITIES (from dev.ts)
// ============================================================================

async function runCommand(
	command: string,
	args: string[],
	cwd: string,
	options: { print?: boolean; env?: NodeJS.ProcessEnv } = {},
): Promise<{ stdout: string; stderr: string }> {
	return new Promise((resolve, reject) => {
		let stdout = "";
		let stderr = "";

		const child = spawn(command, args, {
			cwd,
			stdio: ["inherit", "pipe", "pipe"],
			env: { ...process.env, ...options.env },
		});

		if (options.print !== false) {
			child.stdout?.on("data", (data) => {
				stdout += data.toString();
				process.stdout.write(data);
			});

			child.stderr?.on("data", (data) => {
				stderr += data.toString();
				process.stderr.write(data);
			});
		} else {
			child.stdout?.on("data", (data) => {
				stdout += data.toString();
			});
			child.stderr?.on("data", (data) => {
				stderr += data.toString();
			});
		}

		child.once("error", reject);
		child.once("exit", (code) => {
			if (code === 0) {
				resolve({ stdout, stderr });
			} else {
				reject(
					new Error(`${command} exited with code ${code}\n${stderr || stdout}`),
				);
			}
		});
	});
}

// Removed unused isPortFree function - using checkPortInUse instead

function loadEnvFiles() {
	const candidateFiles = [
		join(rootDir, ".env.local"),
		join(rootDir, ".env"),
		join(apiDir, ".env.local"),
		join(apiDir, ".env"),
	];

	for (const filePath of candidateFiles) {
		loadEnv({ path: filePath, override: false });
	}
}

function resolveDatabaseUrl(): string {
	const envUrl = process.env.DATABASE_URL;

	if (envUrl && envUrl !== "pg-mem") {
		return envUrl;
	}

	const fallback =
		"postgres://postgres:postgres@localhost:5432/collector_dashboard";
	process.env.DATABASE_URL = fallback;
	return fallback;
}

function parseDatabaseUrl(connectionString: string) {
	const parsed = new URL(connectionString);
	const database = parsed.pathname?.replace(/^\//, "") ?? "";

	if (!database) {
		throw new Error("DATABASE_URL must contain database name");
	}

	const adminUrl = new URL(parsed);
	adminUrl.pathname = "/postgres";

	return {
		database,
		host: parsed.hostname,
		port: parsed.port || "5432",
		adminConnectionString: adminUrl.toString(),
	};
}

async function checkDatabaseExists(connectionString: string): Promise<boolean> {
	const { database, adminConnectionString } =
		parseDatabaseUrl(connectionString);
	const sanitizedName = database.replace(/'/g, "''");
	const checkQuery = `SELECT 1 FROM pg_database WHERE datname='${sanitizedName}'`;

	try {
		const result = await runCommand(
			"psql",
			["--dbname", adminConnectionString, "-tAc", checkQuery],
			rootDir,
			{ print: false },
		);
		return result.stdout.trim() === "1";
	} catch {
		return false;
	}
}

async function ensureDatabaseExists(connectionString: string): Promise<void> {
	const { database, adminConnectionString } =
		parseDatabaseUrl(connectionString);

	const exists = await checkDatabaseExists(connectionString);

	if (exists) {
		logger.info(`Database "${database}" already exists`);
		return;
	}

	logger.step(`Creating database "${database}"...`);

	const sanitizedName = database.replace(/"/g, '""');

	try {
		await runCommand(
			"psql",
			[
				"--dbname",
				adminConnectionString,
				"-c",
				`CREATE DATABASE "${sanitizedName}" WITH ENCODING='UTF8'`,
			],
			rootDir,
		);

		logger.success(`Database "${database}" created`);
	} catch (error) {
		throw new Error(
			`Failed to create database "${database}". Make sure PostgreSQL is running and user has CREATE DATABASE permission.\n${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}
}

async function checkDockerAvailable(): Promise<boolean> {
	try {
		await runCommand("docker", ["compose", "version"], rootDir, {
			print: false,
		});
		return true;
	} catch {
		return false;
	}
}

async function checkDockerVersions(): Promise<{ docker: string; compose: string }> {
  let dockerVersion = "unknown";
  let composeVersion = "unknown";
  try {
    const { stdout } = await runCommand("docker", ["--version"], rootDir, { print: false });
    dockerVersion = stdout.trim();
  } catch {}
  try {
    const { stdout } = await runCommand("docker", ["compose", "version"], rootDir, { print: false });
    composeVersion = stdout.trim();
  } catch {}
  return { docker: dockerVersion, compose: composeVersion };
}

async function checkDockerDaemon(): Promise<boolean> {
	try {
		// Check if docker info works
		await runCommand("docker", ["info"], rootDir, {
			print: false,
		});

		// Also check if docker ps works (more reliable indicator)
		await runCommand("docker", ["ps"], rootDir, {
			print: false,
		});

		return true;
	} catch {
		return false;
	}
}

async function checkPortInUse(port: number): Promise<boolean> {
	try {
		const { stdout } = await runCommand(
			"lsof",
			["-i", `:${port}`, "-t"],
			rootDir,
			{ print: false },
		);
		return stdout.trim().length > 0;
	} catch {
		return false;
	}
}

async function stopLocalPostgreSQL(): Promise<void> {
	logger.info("Zaustavljanje lokalnog PostgreSQL servisa...");

	try {
		// Try brew services stop
		await runCommand("brew", ["services", "stop", "postgresql@17"], rootDir, {
			print: false,
		}).catch(() => {
			// Try without version
			return runCommand("brew", ["services", "stop", "postgresql"], rootDir, {
				print: false,
			});
		});
		logger.success("Lokalni PostgreSQL zaustavljen");
	} catch {
		// If brew services doesn't work, try to kill processes on port 5432
		try {
			const { stdout } = await runCommand("lsof", ["-ti", ":5432"], rootDir, {
				print: false,
			});
			const pids = stdout.trim().split("\n").filter(Boolean);
			for (const pid of pids) {
				try {
					await runCommand("kill", ["-9", pid], rootDir, { print: false });
				} catch {
					// Continue
				}
			}
			if (pids.length > 0) {
				logger.success("Lokalni PostgreSQL procesi zaustavljeni");
			}
		} catch {
			logger.warn("Nije moguće automatski zaustaviti PostgreSQL");
		}
	}
}

async function stopLocalRedis(): Promise<void> {
	logger.info("Zaustavljanje lokalnog Redis servisa...");

	// First, try to kill processes on port 6379
	try {
		const { stdout } = await runCommand("lsof", ["-ti", ":6379"], rootDir, {
			print: false,
		});
		const pids = stdout.trim().split("\n").filter(Boolean);
		for (const pid of pids) {
			try {
				logger.info(`Zaustavljanje Redis procesa PID: ${pid}`);
				await runCommand("kill", ["-9", pid], rootDir, { print: false });
			} catch {
				// Continue
			}
		}
		if (pids.length > 0) {
			logger.success(
				`Lokalni Redis procesi zaustavljeni (${pids.length} procesa)`,
			);
			await delay(2000);
		}
	} catch {
		// No processes found or error
	}

	// Then try brew services stop
	try {
		await runCommand("brew", ["services", "stop", "redis"], rootDir, {
			print: false,
		});
		logger.success("Lokalni Redis servis zaustavljen (brew services)");
		await delay(2000);
	} catch {
		// brew services might not be managing redis, that's ok
	}
}

async function stopProcessOnPort(
	port: number,
	serviceName: string,
): Promise<void> {
	logger.info(`Zaustavljanje procesa na portu ${port} (${serviceName})...`);

	try {
		const { stdout } = await runCommand("lsof", ["-ti", `:${port}`], rootDir, {
			print: false,
		});
		const pids = stdout.trim().split("\n").filter(Boolean);
		for (const pid of pids) {
			try {
				await runCommand("kill", ["-9", pid], rootDir, { print: false });
			} catch {
				// Continue
			}
		}
		if (pids.length > 0) {
			logger.success(`${serviceName} procesi na portu ${port} zaustavljeni`);
		}
	} catch {
		logger.warn(`Nije moguće automatski zaustaviti procese na portu ${port}`);
	}
}

async function analyzeBuildErrors(): Promise<void> {
	logger.step("Analiziranje build grešaka...");

	const servicesToCheck = [
		"api",
		"dashboard",
		"chat-service",
		"notification-service",
	];

	for (const service of servicesToCheck) {
		try {
			const { stdout: logs } = await runCommand(
				"docker",
				["compose", "logs", "--tail", "50", service],
				rootDir,
				{ print: false },
			);

			if (logs.trim()) {
				const errorLogs = logs
					.split("\n")
					.filter(
						(line) =>
							line.toLowerCase().includes("error") ||
							line.toLowerCase().includes("failed") ||
							line.toLowerCase().includes("npm ci") ||
							line.toLowerCase().includes("build") ||
							line.toLowerCase().includes("exit code"),
					);

				if (errorLogs.length > 0) {
					logger.warn(`\n⚠ Greške u ${service}:`);
					errorLogs.slice(0, 10).forEach((line) => {
						if (line.trim()) {
							console.log(`   ${line}`);
						}
					});

					// Suggest fixes based on error patterns
					const logText = logs.toLowerCase();

					if (
						logText.includes("npm ci") ||
						logText.includes("package.json") ||
						logText.includes("package-lock.json")
					) {
						logger.info(`\n💡 Predložena popravka za ${service}:`);
						logger.info(
							`   1. Proveri da li postoji package.json u ${service} direktorijumu`,
						);
						logger.info(`   2. Pokreni: cd services/${service} && npm install`);
						logger.info(`   3. Ili: cd apps/${service} && npm install`);
						logger.info(
							`   4. Zatim pokušaj ponovo: docker compose up -d ${service}`,
						);
					}

					if (
						logText.includes("cannot find module") ||
						logText.includes("module not found")
					) {
						logger.info(`\n💡 Predložena popravka za ${service}:`);
						logger.info(
							`   1. Instaliraj dependencies: cd services/${service} && bun install`,
						);
						logger.info(`   2. Ili: cd apps/${service} && bun install`);
						logger.info(`   3. Zatim rebuild: docker compose build ${service}`);
					}

					if (
						logText.includes("permission denied") ||
						logText.includes("eacces")
					) {
						logger.info(`\n💡 Predložena popravka za ${service}:`);
						logger.info(
							`   1. Proveri dozvole: chmod -R 755 services/${service}`,
						);
						logger.info(`   2. Ili: chmod -R 755 apps/${service}`);
					}

					if (
						logText.includes("dockerfile") ||
						logText.includes("dockerfile not found")
					) {
						logger.info(`\n💡 Predložena popravka za ${service}:`);
						logger.info(`   1. Proveri da li postoji Dockerfile za ${service}`);
						logger.info(`   2. Proveri docker-compose.yml konfiguraciju`);
					}

					if (logText.includes("port") && logText.includes("already in use")) {
						logger.info(`\n💡 Predložena popravka za ${service}:`);
						logger.info(
							`   1. Zaustavi proces na portu: lsof -ti :PORT | xargs kill -9`,
						);
						logger.info(`   2. Ili promeni port u docker-compose.yml`);
					}
				}
			}
		} catch {
			// Service might not exist or no logs yet
		}
	}

	// Also check docker compose build logs
	try {
		const { stdout: buildLogs } = await runCommand(
			"docker",
			["compose", "build", "--no-cache", "2>&1", "|", "tail", "-30"],
			rootDir,
			{ print: false },
		).catch(() => ({ stdout: "" }));

		if (buildLogs?.includes("error")) {
			logger.info("\n💡 Build logovi pokazuju greške. Pokušaj:");
			logger.info("   docker compose build --no-cache");
			logger.info("   docker compose up -d");
		}
	} catch {
		// Continue
	}
}

async function isPortUsedByDocker(port: number): Promise<boolean> {
	try {
		// Check if port is used by a Docker container
		const { stdout } = await runCommand(
			"docker",
			["ps", "--format", "{{.Names}}:{{.Ports}}"],
			rootDir,
			{ print: false },
		);

		const lines = stdout.split("\n").filter(Boolean);
		for (const line of lines) {
			// Check if line contains the port (format: "container-name:0.0.0.0:5432->5432/tcp")
			if (line.includes(`:${port}->`) || line.includes(`:${port}/`)) {
				return true;
			}
		}
		return false;
	} catch {
		return false;
	}
}

async function freeUpPortsForDocker(): Promise<void> {
	logger.step("Oslobađanje portova za Docker servise...");

	const portsToCheck = [
		{ port: 5432, name: "PostgreSQL", stopFn: stopLocalPostgreSQL },
		{ port: 6379, name: "Redis", stopFn: stopLocalRedis },
		{ port: 3000, name: "Frontend/Web", stopFn: null },
		{ port: 3001, name: "Socket.IO", stopFn: null },
		{ port: 4000, name: "API", stopFn: null },
		{ port: 4001, name: "Chat Service", stopFn: null },
		{ port: 4002, name: "Notification Service", stopFn: null },
	];

	const portsInUse: typeof portsToCheck = [];

	for (const { port, name, stopFn } of portsToCheck) {
		if (await checkPortInUse(port)) {
			// Check if port is used by Docker container
			const usedByDocker = await isPortUsedByDocker(port);
			if (usedByDocker) {
				logger.info(
					`Port ${port} (${name}) je zauzet od strane Docker kontejnera - OK`,
				);
				continue; // Skip this port - it's already used by Docker
			}
			portsInUse.push({ port, name, stopFn });
			logger.info(`Port ${port} (${name}) je zauzet`);
		}
	}

	if (portsInUse.length === 0) {
		logger.success("Svi portovi su slobodni");
		return;
	}

	// Stop services with specific stop functions first
	for (const { port, name, stopFn } of portsInUse) {
		if (stopFn) {
			await stopFn();
			await delay(2000);
		} else {
			// Generic port cleanup
			await stopProcessOnPort(port, name);
			await delay(2000);
		}

		// Double-check that port is free
		let retries = 3;
		while (retries > 0 && (await checkPortInUse(port))) {
			logger.info(
				`Port ${port} još uvek zauzet, pokušavam ponovo... (${retries} pokušaja preostalo)`,
			);
			await stopProcessOnPort(port, name);
			await delay(2000);
			retries--;
		}
	}

	// Verify ports are free
	await delay(3000);

	const stillInUse: string[] = [];
	for (const { port, name } of portsToCheck) {
		if (await checkPortInUse(port)) {
			stillInUse.push(`${port} (${name})`);
		}
	}

	if (stillInUse.length > 0) {
		logger.warn(
			`⚠ Sledeći portovi su još uvek zauzeti: ${stillInUse.join(", ")}`,
		);
		logger.info(
			"💡 Docker servisi možda neće moći da startuju na tim portovima.",
		);
		logger.info(
			"💡 Zaustavi procese ručno ili promeni portove u docker-compose.yml",
		);
	} else {
		logger.success("Svi portovi su oslobođeni");
	}
}

async function waitForDockerService(
	service: string,
	timeoutMs = 60000,
): Promise<void> {
	const start = Date.now();

	logger.info(`Waiting for ${service} to be ready...`);

	while (Date.now() - start < timeoutMs) {
		try {
			// First check if container exists at all
			try {
				const { stdout: containerCheck } = await runCommand(
					"docker",
					[
						"ps",
						"-a",
						"--filter",
						`name=collector-${service}`,
						"--format",
						"{{.Names}}",
					],
					rootDir,
					{ print: false },
				);

				if (!containerCheck.trim()) {
					// Container doesn't exist yet, wait a bit
					await delay(2000);
					continue;
				}
			} catch {
				// Continue checking
			}

			// Check health status first (most reliable)
			try {
				const { stdout: healthOutput } = await runCommand(
					"docker",
					[
						"inspect",
						`collector-${service}`,
						"--format",
						"{{.State.Health.Status}}",
					],
					rootDir,
					{ print: false },
				);

				const healthStatus = healthOutput.trim().toLowerCase();
				if (healthStatus === "healthy") {
					logger.success(`${service} is ready (healthy)`);
					return;
				}
				if (healthStatus === "unhealthy") {
					// Read logs to see what's wrong
					logger.warn(`${service} is unhealthy, checking logs...`);
					try {
						const { stdout: logs } = await runCommand(
							"docker",
							["logs", "--tail=50", `collector-${service}`],
							rootDir,
							{ print: false },
						);
						logger.info(`\n📋 ${service} logs (last 50 lines):`);
						console.log(logs);
					} catch {
						// Ignore log reading errors
					}
					// Continue waiting - might recover
				}
				// If health status is "starting" or empty, continue checking
			} catch {
				// Health check might not be available yet, continue with status check
			}

			// Check if service is running using docker compose ps
			const { stdout } = await runCommand(
				"docker",
				["compose", "ps", "--format", "json", service],
				rootDir,
				{ print: false },
			);

			// Try simple status check first (more reliable)
			const { stdout: statusOutput } = await runCommand(
				"docker",
				["compose", "ps", service, "--format", "{{.Status}}"],
				rootDir,
				{ print: false },
			);

			if (statusOutput.trim()) {
				const status = statusOutput.trim().toLowerCase();
				if (status.includes("up") && status.includes("healthy")) {
					logger.success(`${service} is ready`);
					return;
				}
				if (status.includes("up") && !status.includes("unhealthy")) {
					// Container is up but health check might not be configured
					// For services without health checks, this is acceptable
					logger.success(`${service} is ready`);
					return;
				}
				if (
					status.includes("exited") ||
					status.includes("dead") ||
					status.includes("error")
				) {
					// Read logs before throwing error
					logger.warn(`${service} failed to start, checking logs...`);
					try {
						const { stdout: logs } = await runCommand(
							"docker",
							["logs", "--tail=50", `collector-${service}`],
							rootDir,
							{ print: false },
						);
						logger.info(`\n📋 ${service} logs (last 50 lines):`);
						console.log(logs);
					} catch {
						// Ignore log reading errors
					}
					throw new Error(`${service} failed to start (status: ${status})`);
				}
			}

			// Fallback to JSON format if available
			const lines = stdout.trim().split("\n").filter(Boolean);
			for (const line of lines) {
				try {
					const status = JSON.parse(line);
					// Check various status fields
					const isRunning =
						status.State === "running" ||
						status.Status?.includes("running") ||
						status.Health === "healthy";

					const isFailed =
						status.State === "exited" ||
						status.State === "dead" ||
						status.Status?.includes("exited");

					if (isRunning) {
						logger.success(`${service} is ready`);
						return;
					}
					if (isFailed) {
						// Read logs before throwing error
						logger.warn(`${service} failed to start, checking logs...`);
						try {
							const { stdout: logs } = await runCommand(
								"docker",
								["logs", `--tail=50`, `collector-${service}`],
								rootDir,
								{ print: false },
							);
							logger.info(`\n📋 ${service} logs (last 50 lines):`);
							console.log(logs);
						} catch {
							// Ignore log reading errors
						}
						throw new Error(
							`${service} failed to start (status: ${status.State || status.Status})`,
						);
					}
				} catch {
					// Continue checking
				}
			}
		} catch (error) {
			// If it's an error we threw, re-throw it
			if (error instanceof Error && error.message.includes("failed to start")) {
				throw error;
			}
			// Otherwise continue checking - service might not be up yet
		}

		await delay(2000);
	}

	// Timeout reached - read logs and provide helpful message
	logger.warn(
		`${service} did not become ready within ${timeoutMs / 1000}s, checking logs...`,
	);
	try {
		const { stdout: logs } = await runCommand(
			"docker",
			["logs", "--tail=100", `collector-${service}`],
			rootDir,
			{ print: false },
		);
		logger.info(`\n📋 ${service} logs (last 100 lines):`);
		console.log(logs);
		logger.info(
			`\n💡 ${service} možda još uvek build-uje ili ima problema. Proveri logove iznad.`,
		);
		logger.info(`💡 Pokušaj ručno: docker compose logs -f ${service}`);
	} catch {
		// Ignore log reading errors
	}

	throw new Error(
		`${service} did not become ready within ${timeoutMs / 1000}s`,
	);
}

async function runMigrations(): Promise<void> {
	logger.step("Running database migrations...");

	try {
		logger.info("Applying project tables migration...");
		try {
			await runCommand("bun", ["run", "db:apply-project-tables"], apiDir);
			logger.success("Project tables migration completed");
		} catch (error) {
			logger.warn(
				`Project tables migration error: ${error instanceof Error ? error.message : String(error)}`,
			);
			logger.info("💡 If tables already exist, this is normal. Continuing...");
		}
	} catch (error) {
		logger.warn(
			`Migration error: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

async function runSeed(modules: string[], useDocker: boolean, dashboardForce = false): Promise<void> {
	if (modules.length === 0) {
		logger.info("No modules selected for seeding");
		return;
	}

	logger.step(`Seeding database with modules: ${modules.join(", ")}...`);

	if (useDocker) {
		try {
			await runCommand(
				"docker",
				[
					"compose",
					"run",
					"--rm",
					"-e",
					`API_SEED_ONLY=${modules.join(",")}`,
					...(dashboardForce ? ["-e", "DASHBOARD_SEED_FORCE=1"] : []),
					"seed",
				],
				rootDir,
			);
			logger.success("Database seeded successfully (Docker)");
		} catch (error) {
			logger.error(
				`Seed failed (Docker): ${error instanceof Error ? error.message : String(error)}`,
			);
			throw error;
		}
	} else {
		const seedArgs = ["run", "db:seed", `--only=${modules.join(",")}`];
		try {
			await runCommand("bun", seedArgs, apiDir);
			logger.success("Database seeded successfully");
		} catch (error) {
			logger.error(
				`Seed failed: ${error instanceof Error ? error.message : String(error)}`,
			);
			throw error;
		}
	}
}

async function runResetAndSeed(modules: string[], useDocker: boolean, dashboardForce = false): Promise<void> {
  if (modules.length === 0) {
    logger.info("No modules selected for seeding");
    return;
  }
  logger.step("Reset database (drop + migrate) and seed selected modules...");
  if (useDocker) {
    try {
      await runCommand(
        "docker",
        [
          "compose",
          "run",
          "--rm",
          "-e",
          "SEED_DROP=1",
          "-e",
          `API_SEED_ONLY=${modules.join(",")}`,
          ...(dashboardForce ? ["-e", "DASHBOARD_SEED_FORCE=1"] : []),
          "seed",
        ],
        rootDir,
      );
      logger.success("Database reset and seeding completed (Docker)");
      return;
    } catch (error) {
      logger.error(
        `Reset+Seed (Docker) failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
  const args = [
    "run",
    "scripts/migrate-and-seed.ts",
    "--drop",
    "--only",
    modules.join(","),
  ];
  const currentUrl = process.env.DATABASE_URL || "postgresql://collector:collector@localhost:5432/collector";
  const adminUrl = (() => {
    try {
      const u = new URL(currentUrl);
      u.username = "collector";
      u.password = "collector";
      return u.toString();
    } catch {
      return "postgresql://collector:collector@localhost:5432/collector";
    }
  })();
  try {
    await runCommand("bun", args, rootDir, { env: { DATABASE_URL: adminUrl } });
    logger.success("Database reset and seeding completed");
  } catch (error) {
    logger.warn(
      `Reset+Seed failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    logger.step("Attempting Docker schema reset fallback...");
    try {
      await resetSchemaDocker();
      logger.info("Retrying migrate-and-seed without drop...");
      const retryArgs = ["run", "scripts/migrate-and-seed.ts", "--only", modules.join(",")];
      await runCommand("bun", retryArgs, rootDir, { env: { DATABASE_URL: adminUrl } });
      logger.success("Database schema reset and seeding completed");
    } catch (retryError) {
      logger.error(
        `Fallback reset+seed failed: ${retryError instanceof Error ? retryError.message : String(retryError)}`,
      );
      throw retryError;
    }
  }
}

async function verifySeedIntegrity(): Promise<void> {
  logger.step("Verifying data integrity after seeding...");
  const checks: { table: string; query: string; min: number; label: string }[] = [
    { table: "accounts", query: "SELECT COUNT(*) FROM accounts", min: 50, label: "Accounts" },
    { table: "account_contacts", query: "SELECT COUNT(*) FROM account_contacts", min: 100, label: "Contacts" },
    { table: "products", query: "SELECT COUNT(*) FROM products", min: 4, label: "Products" },
    { table: "quotes", query: "SELECT COUNT(*) FROM quotes", min: 50, label: "Quotes" },
    { table: "orders", query: "SELECT COUNT(*) FROM orders", min: 50, label: "Orders" },
    { table: "invoices", query: "SELECT COUNT(*) FROM invoices", min: 50, label: "Invoices" },
    { table: "payments", query: "SELECT COUNT(*) FROM payments", min: 25, label: "Payments" },
    { table: "leads", query: "SELECT COUNT(*) FROM leads", min: 60, label: "Leads" },
    { table: "opportunities", query: "SELECT COUNT(*) FROM opportunities", min: 45, label: "Opportunities" },
    { table: "activities", query: "SELECT COUNT(*) FROM activities", min: 35, label: "CRM Activities" },
    { table: "projects", query: "SELECT COUNT(*) FROM projects", min: 10, label: "Projects" },
    { table: "project_tasks", query: "SELECT COUNT(*) FROM project_tasks", min: 200, label: "Project Tasks" },
    { table: "users", query: "SELECT COUNT(*) FROM users", min: 3, label: "Users" },
  ];
  let failures = 0;
  for (const c of checks) {
    try {
      const { stdout } = await runCommand(
        "docker",
        [
          "exec",
          "collector-postgres",
          "psql",
          "-U",
          "collector",
          "-d",
          "collector",
          "-t",
          "-A",
          "-c",
          c.query,
        ],
        rootDir,
        { print: false },
      );
      const count = parseInt(stdout.trim().split("\n").filter(Boolean).pop() || "0", 10);
      if (Number.isFinite(count) && count >= c.min) {
        logger.success(`${c.label}: ${count}`);
      } else {
        failures++;
        logger.warn(`${c.label}: ${count} (expected ≥ ${c.min})`);
      }
    } catch (e) {
      failures++;
      const msg = e instanceof Error ? e.message : String(e);
      logger.warn(`${c.label} check failed: ${msg}`);
    }
  }
  if (failures === 0) {
    logger.success("Data integrity checks passed");
  } else {
    logger.warn(`Data integrity checks found ${failures} issue(s)`);
  }
}

async function restartDockerService(service: string): Promise<void> {
  logger.info(`Restarting ${service}...`);
  try {
    await runCommand("docker", ["compose", "restart", service], rootDir);
  } catch {
    try {
      await runCommand("docker", ["restart", `collector-${service}`], rootDir);
    } catch {}
  }
}

async function ensureDockerRoleAndDb(): Promise<void> {
  logger.step("Ensuring PostgreSQL role and database in Docker...");
  const psqlExec = async (args: string[], print = false) =>
    runCommand(
      "docker",
      ["exec", "collector-postgres", "psql", "-U", "collector", ...args],
      rootDir,
      { print },
    );
  try {
    const { stdout: dbCheck } = await psqlExec(
      ["-d", "postgres", "-tAc", "SELECT 1 FROM pg_database WHERE datname='collector'"],
      false,
    );
    const dbExists = dbCheck.trim() === "1";
    if (!dbExists) {
      await psqlExec(["-d", "postgres", "-c", "CREATE DATABASE collector OWNER collector ENCODING 'UTF8'"], true);
      logger.success("Database 'collector' created");
    }
    await psqlExec(["-d", "collector", "-c", "CREATE EXTENSION IF NOT EXISTS pgcrypto;"], true);
    logger.success("Verified pgcrypto extension");
  } catch (error) {
    logger.warn(
      `Docker DB verification failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function resetSchemaDocker(): Promise<void> {
  logger.step("Resetting public schema in Docker database...");
  try {
    await runCommand(
      "docker",
      [
        "exec",
        "collector-postgres",
        "psql",
        "-U",
        "collector",
        "-d",
        "collector",
        "-c",
        "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public AUTHORIZATION collector;",
      ],
      rootDir,
    );
    logger.success("Public schema reset completed");
  } catch (error) {
    logger.error(
      `Public schema reset failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

async function dockerRoleExists(role: string): Promise<boolean> {
  try {
    const { stdout } = await runCommand(
      "docker",
      ["exec", "collector-postgres", "psql", "-U", "collector", "-d", "postgres", "-tAc", `SELECT 1 FROM pg_roles WHERE rolname='${role}'`],
      rootDir,
      { print: false },
    );
    return stdout.trim() === "1";
  } catch {
    return false;
  }
}

// ============================================================================
// INFRASTRUCTURE SETUP
// ============================================================================

async function setupInfrastructure(): Promise<{
	useDocker: boolean;
	connectionString: string;
}> {
	const rl = createReadlineInterface();

	console.log("\n");
	logger.section("Infrastructure Setup");

	const useDockerAnswer = await question(
		rl,
		"Koristiti Docker Compose za infrastrukturu? (da/ne, default: ne): ",
	).then((a) => a.trim().toLowerCase());

	rl.close();

	const useDocker =
		useDockerAnswer === "da" ||
		useDockerAnswer === "yes" ||
		useDockerAnswer === "y" ||
		useDockerAnswer === "d";

	if (useDocker) {
		const dockerAvailable = await checkDockerAvailable();
		if (!dockerAvailable) {
			throw new Error(
				"Docker Compose is not available. Install it or use local mode.",
			);
		}

		// Check if Docker daemon is running
		let dockerDaemonRunning = await checkDockerDaemon();
		if (!dockerDaemonRunning) {
			logger.warn("⚠ Docker daemon nije pokrenut!");
			logger.info("💡 Pokušavam da automatski pokrenem Docker Desktop...");

			try {
				// Try to start Docker Desktop on macOS
				await runCommand("open", ["-a", "Docker"], rootDir, { print: false });
				logger.info("✓ Docker Desktop se pokreće...");
				logger.info(
					"💡 Čekam da se Docker pokrene (može potrajati 10-30 sekundi)...",
				);

				// Wait for Docker to start (max 90 seconds - Docker Desktop može potrajati)
				let retries = 45;
				while (retries > 0 && !dockerDaemonRunning) {
					await delay(2000);
					dockerDaemonRunning = await checkDockerDaemon();
					if (dockerDaemonRunning) {
						// Additional wait to ensure Docker is fully ready
						logger.info(
							"   Docker se pokrenuo, čekam dodatne 3 sekunde da se stabilizuje...",
						);
						await delay(3000);
						// Final check
						dockerDaemonRunning = await checkDockerDaemon();
						if (dockerDaemonRunning) {
							logger.success("✓ Docker daemon je pokrenut i spreman!");
							break;
						}
					}
					retries--;
					if (retries % 5 === 0) {
						logger.info(`   Čekam... (${retries * 2} sekundi preostalo)`);
					}
				}

				if (!dockerDaemonRunning) {
					logger.error("⚠ Docker se nije pokrenuo u roku od 90 sekundi");
					logger.info("💡 Proveri Docker Desktop ručno:");
					logger.info("   - Otvori Docker Desktop aplikaciju");
					logger.info("   - Sačekaj da se Docker pokrene (ikonica u meniju)");
					logger.info("   - Proveri da li Docker Desktop radi: docker ps");
					logger.info("   - Zatim pokreni skriptu ponovo");
					throw new Error(
						"Docker daemon did not start. Please start Docker Desktop manually and try again.",
					);
				}
			} catch {
				logger.error("⚠ Ne mogu automatski pokrenuti Docker Desktop");
				logger.info("💡 Pokreni Docker Desktop ručno:");
				logger.info("   - Otvori Docker Desktop aplikaciju");
				logger.info("   - Ili: open -a Docker (macOS)");
				logger.info("   - Sačekaj da se Docker pokrene (ikonica u meniju)");
				logger.info("   - Zatim pokreni skriptu ponovo");
				throw new Error(
					"Docker daemon is not running. Please start Docker Desktop and try again.",
				);
			}
		}

		// Free up ports before starting Docker services
		await freeUpPortsForDocker();

		// Final check - if Redis port is still in use, warn user
		if (await checkPortInUse(6379)) {
			logger.error("⚠ Port 6379 je još uvek zauzet!");
			logger.info("💡 Zaustavi Redis ručno:");
			logger.info("   brew services stop redis");
			logger.info("   ili");
			logger.info("   kill -9 $(lsof -ti :6379)");
			logger.info("💡 Nastavljam sa pokretanjem Docker servisa...");
		}

		logger.step("Checking Docker infrastructure status...");
		const versions = await checkDockerVersions();
		logger.info(`Docker: ${versions.docker || "unknown"}`);
		logger.info(`Docker Compose: ${versions.compose || "unknown"}`);

		// Check if all Docker services are already running
		const allDockerServices = [
			"postgres",
			"redis",
			"api",
			"dashboard",
			"chat-service",
			"notification-service",
		];

		// Get all running services using docker compose ps
		const { stdout: psOutput } = await runCommand(
			"docker",
			["compose", "ps", "--format", "{{.Service}}"],
			rootDir,
			{ print: false },
		).catch(() => ({ stdout: "" }));

		// Also check using direct docker ps for containers with collector- prefix
		const { stdout: dockerPsOutput } = await runCommand(
			"docker",
			["ps", "--format", "{{.Names}}"],
			rootDir,
			{ print: false },
		).catch(() => ({ stdout: "" }));

		// Filter out warning messages and empty lines from compose output
		const composeServices = psOutput
			.split("\n")
			.map((line) => line.trim())
			.filter(
				(line) =>
					line && !line.includes("level=warning") && !line.includes("msg="),
			);

		// Extract service names from container names (collector-api -> api)
		const dockerServices = dockerPsOutput
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.startsWith("collector-"))
			.map((name) => name.replace("collector-", ""));

		// Combine both sources and remove duplicates
		const runningServices = [
			...new Set([...composeServices, ...dockerServices]),
		];

		logger.info(
			`Pronađeni pokrenuti servisi: ${runningServices.length > 0 ? runningServices.join(", ") : "nijedan"}`,
		);

		const allRunning = allDockerServices.every((service) =>
			runningServices.includes(service),
		);

		if (allRunning) {
			logger.info("✓ Svi Docker servisi su već pokrenuti");
		} else {
			const missingServices = allDockerServices.filter(
				(service) => !runningServices.includes(service),
			);
			if (missingServices.length > 0) {
				logger.info(
					`⚠ Neki servisi nisu pokrenuti: ${missingServices.join(", ")}`,
				);
			}
			logger.step("Pokretanje svih Docker servisa...");
			logger.info(
				"💡 Pokrećem: PostgreSQL, Redis, API, Dashboard, Chat Service, Notification Service",
			);

			// Double-check Docker is ready before starting services
			logger.info("Proveravam da li je Docker potpuno spreman...");
			let dockerReady = await checkDockerDaemon();
			if (!dockerReady) {
				logger.warn(
					"⚠ Docker daemon možda još nije spreman, čekam dodatne 5 sekundi...",
				);
				await delay(5000);

				// Retry check
				dockerReady = await checkDockerDaemon();
				if (!dockerReady) {
					logger.warn(
						"⚠ Docker daemon još nije spreman, čekam dodatne 10 sekundi...",
					);
					await delay(10000);

					// Final check
					dockerReady = await checkDockerDaemon();
					if (!dockerReady) {
						logger.error("⚠ Docker daemon nije spreman nakon čekanja");
						logger.info("💡 Proveri Docker Desktop status:");
						logger.info("   - Otvori Docker Desktop aplikaciju");
						logger.info("   - Proveri da li Docker radi: docker ps");
						logger.info("   - Sačekaj da se Docker potpuno pokrene");
						throw new Error(
							"Docker daemon is not ready. Please wait a bit longer and try again.",
						);
					}
				}
			}

			if (dockerReady) {
				logger.success("✓ Docker daemon je spreman");
			}

			try {
				// Start all services
				logger.info("💡 Build može potrajati nekoliko minuta...");
				logger.info("💡 Prati napredak: docker compose logs -f");

				try {
					await runCommand(
						"docker",
						["compose", "up", "-d", "--build", ...allDockerServices],
						rootDir,
					);
					logger.success("Docker compose up uspešno izvršen");
				} catch (buildError) {
					// Build might have failed, but some services might still be starting
					logger.warn("Build proces možda ima probleme, proveravam status...");

					// Check if any services are actually running
					const { stdout: psOutput } = await runCommand(
						"docker",
						["compose", "ps", "--format", "{{.Service}}: {{.Status}}"],
						rootDir,
						{ print: false },
					).catch(() => ({ stdout: "" }));

					if (psOutput.trim()) {
						logger.info("\n📋 Status servisa nakon build-a:");
						console.log(psOutput);
					}

					// Re-throw to be caught by outer catch
					throw buildError;
				}

				logger.info("Čekam da se servisi pokrenu...");
				await delay(10000); // Increased wait time for build to complete
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);
				logger.warn(`Docker compose up error: ${errorMsg}`);

				// Always try to show what services are actually running
				try {
					const { stdout: psOutput } = await runCommand(
						"docker",
						["compose", "ps", "--format", "{{.Service}}: {{.Status}}"],
						rootDir,
						{ print: false },
					);
					if (psOutput.trim()) {
						logger.info("\n📋 Trenutno pokrenuti servisi:");
						console.log(psOutput);
					}
				} catch {
					// Ignore
				}

				// Check if Docker daemon is not running
				if (
					errorMsg.includes("Cannot connect to the Docker daemon") ||
					errorMsg.includes("docker.sock") ||
					errorMsg.includes("Is the docker daemon running")
				) {
					logger.error("⚠ Docker daemon nije pokrenut!");
					logger.info("💡 Pokreni Docker Desktop:");
					logger.info("   - Otvori Docker Desktop aplikaciju");
					logger.info("   - Ili: open -a Docker (macOS)");
					logger.info("   - Sačekaj da se Docker pokrene (ikonica u meniju)");
					logger.info("   - Zatim pokreni skriptu ponovo");
					throw new Error(
						"Docker daemon is not running. Please start Docker Desktop.",
					);
				}

				// Check if it's a port conflict
				if (
					errorMsg.includes("address already in use") ||
					errorMsg.includes("port")
				) {
					logger.info(
						"💡 Port conflict detected. Proveravam status servisa...",
					);
				} else if (
					errorMsg.includes("build") ||
					errorMsg.includes("npm ci") ||
					errorMsg.includes("failed to solve")
				) {
					logger.warn(
						"⚠ Build error - analiziram logove i predlažem popravke...",
					);

					// Read logs for failed services
					await analyzeBuildErrors();

					// Try to start only infrastructure services
					logger.info(
						"💡 Pokušavam da pokrenem samo infrastrukturne servise...",
					);
					try {
						await runCommand(
							"docker",
							["compose", "up", "-d", "postgres", "redis"],
							rootDir,
						);
					} catch {
						// Continue
					}
				}
			}
		}

		// Wait for infrastructure services first
		await waitForDockerService("postgres");

		try {
			await waitForDockerService("redis");
		} catch (error) {
			logger.warn(
				`Redis service check failed: ${error instanceof Error ? error.message : String(error)}`,
			);
			await restartDockerService("redis");
			await waitForDockerService("redis");
		}

		// Wait for application services (with longer timeout and don't fail)
		const appServices = [
			{ name: "api", timeout: 180000 }, // 3 minutes for API (build can take time)
			{ name: "dashboard", timeout: 180000 }, // 3 minutes for dashboard (build can take time)
			{ name: "chat-service", timeout: 120000 }, // 2 minutes
			{ name: "notification-service", timeout: 120000 }, // 2 minutes
		];
		for (const { name: service, timeout } of appServices) {
			try {
				await waitForDockerService(service, timeout);
			} catch (error) {
				logger.warn(
					`${service} service check failed: ${error instanceof Error ? error.message : String(error)}`,
				);
				logger.info(`💡 ${service} možda još uvek build-uje ili ima problema`);
				try {
					const { stdout: logs } = await runCommand(
						"docker",
						["logs", "--tail=50", `collector-${service}`],
						rootDir,
						{ print: false },
					);
					if (logs.trim()) {
						logger.info(`\n📋 ${service} logs (last 50 lines):`);
						console.log(logs);
					}
				} catch {}
				await restartDockerService(service);
				await waitForDockerService(service, timeout);
			}
		}

		logger.success("Docker infrastructure is ready");
		return {
			useDocker: true,
			connectionString:
				"postgresql://collector:collector@localhost:5432/collector",
		};
	} else {
		logger.step("Checking local PostgreSQL...");
		loadEnvFiles();
		const connectionString = resolveDatabaseUrl();

		try {
			await runCommand(
				"psql",
				["--dbname", connectionString, "-c", "SELECT 1"],
				rootDir,
				{ print: false },
			);
			logger.success("Local PostgreSQL is available");
		} catch {
			logger.warn("PostgreSQL connection check failed");
			logger.info("💡 Start PostgreSQL with: brew services start postgresql");
			logger.info("   Or use Docker: docker-compose up -d postgres");
			throw new Error("PostgreSQL is not available. Please start it first.");
		}

		return {
			useDocker: false,
			connectionString,
		};
	}
}

// ============================================================================
// MAIN WORKFLOW
// ============================================================================

async function main() {
	try {
		// Step 1: Setup infrastructure
		const infra = await setupInfrastructure();
		const { connectionString } = infra;
		process.env.DATABASE_URL = connectionString;

		// Step 2: Database setup
		logger.step("Setting up database...");
		if (!infra.useDocker) {
			await ensureDatabaseExists(connectionString);
		}
		if (infra.useDocker) {
			await ensureDockerRoleAndDb();
    const hasCollector = await dockerRoleExists("collector");
    if (!hasCollector) {
      logger.info("Using admin credentials for DATABASE_URL");
      process.env.DATABASE_URL = "postgresql://collector:collector@localhost:5432/collector";
    }
		}
		await runMigrations();

    const { selectedModules, skipSeed } = await showSeedMenu();
		if (!skipSeed && selectedModules.length > 0) {
      const rl = createReadlineInterface();
      const choice = await question(
        rl,
        "\nOčistiti postojeće podatke pre seedovanja (API drop)? (da/ne): ",
      ).then((a) => a.trim().toLowerCase());
      const dashForceAns = await question(
        rl,
        "\nOčistiti Dashboard podatke pre seedovanja (force)? (da/ne): ",
      ).then((a) => a.trim().toLowerCase());
      rl.close();
      const dashboardForce = dashForceAns === "da" || dashForceAns === "d" || dashForceAns === "y";
      if (choice === "da" || choice === "d" || choice === "y") {
        if (infra.useDocker) {
          await ensureDockerRoleAndDb();
        }
        await runResetAndSeed(selectedModules, infra.useDocker, dashboardForce);
      } else {
        await runSeed(selectedModules, infra.useDocker, dashboardForce);
      }
			await verifySeedIntegrity();
		} else {
			logger.info("Seedovanje preskočeno.");
		}

		// Step 5: Show Docker services status
		logger.section("Docker Services Status");

		const apiPort = Number(process.env.API_PORT ?? DEFAULT_PORTS.api);
		const webPort = Number(
			process.env.WEB_PORT ?? process.env.PORT ?? DEFAULT_PORTS.web,
		);
		const chatPort = Number(process.env.CHAT_PORT ?? DEFAULT_PORTS.chat);
		const notificationPort = Number(
			process.env.NOTIFICATION_PORT ?? DEFAULT_PORTS.notification,
		);

		// Show service URLs
		logger.success("Svi servisi su pokrenuti u Docker-u:");
		logger.info(`📊 API: http://localhost:${apiPort}`);
		logger.info(`🌐 Frontend: http://localhost:${webPort}`);
		logger.info(`💬 Chat Service: http://localhost:${chatPort}`);
		logger.info(
			`🔔 Notification Service: http://localhost:${notificationPort}`,
		);
		logger.info(`🗄️  PostgreSQL: localhost:5432`);
		logger.info(`📦 Redis: localhost:6379`);

		logger.info("\n💡 Za praćenje logova:");
		logger.info("   docker compose logs -f");
		logger.info("\n💡 Za zaustavljanje svih servisa:");
		logger.info("   docker compose down");
		logger.info("\n💡 Za restart servisa:");
		logger.info("   docker compose restart");

		logger.info("\nPratim Docker logove (Ctrl+C za izlaz)...");

		// Follow Docker logs
		spawn("docker", ["compose", "logs", "-f"], {
			cwd: rootDir,
			stdio: "inherit",
		});

		// Keep process alive
		process.on("SIGINT", () => {
			logger.info("\nShutting down...");
			logger.info("💡 Za zaustavljanje Docker servisa: docker compose down");
			process.exit(0);
		});
	} catch (error) {
		logger.error(
			`Setup failed: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exit(1);
	}
}

// Start
main();
