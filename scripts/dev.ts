#!/usr/bin/env -S bun --smol

/**
 * Enhanced Development Environment Manager
 *
 * Intelligent dev workflow that:
 * - Manages infrastructure (Docker/local PostgreSQL/Redis)
 * - Ensures database is ready (create, migrate, seed)
 * - Starts dev servers with proper orchestration
 * - Provides beautiful progress tracking
 * - Handles errors gracefully with recovery
 * - Verifies seed data and frontend display
 * - Waits for all services to be ready before continuing
 */

import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
// Removed readline import - no longer needed

// ============================================================================
// CONFIGURATION
// ============================================================================

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = join(rootDir, "apps", "api");
const dashboardDir = join(rootDir, "apps", "dashboard");
const notificationServiceDir = join(
	rootDir,
	"services",
	"notification-service",
);
const chatServiceDir = join(rootDir, "services", "chat-service");

const DEFAULT_PORTS = {
	api: 4000,
	web: 3000,
	socket: 3001,
	notification: 4002,
	chat: 4001,
	postgres: 5432,
	redis: 6379,
};

const MAX_WAIT_TIME = 120000; // 2 minutes max wait for services
const HEALTH_CHECK_INTERVAL = 2000; // Check every 2 seconds

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

	subsection(title: string) {
		console.log(`\n${"\x1b[1m"}${title}${"\x1b[0m"}`);
		console.log("-".repeat(40));
	}

	summary(
		items: Array<{
			label: string;
			value: string;
			status?: "ok" | "warn" | "error";
		}>,
	) {
		console.log("");
		for (const item of items) {
			const statusSymbol = {
				ok: "\x1b[32m●\x1b[0m",
				warn: "\x1b[33m●\x1b[0m",
				error: "\x1b[31m●\x1b[0m",
			}[item.status || "ok"];

			console.log(`  ${statusSymbol} ${item.label.padEnd(20)} ${item.value}`);
		}
	}
}

const logger = new DevLogger();

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

type ServiceState = {
	name: string;
	status: "pending" | "starting" | "running" | "failed" | "ready";
	port?: number;
	pid?: number;
	startTime?: number;
	healthCheckUrl?: string;
	logBuffer: string[];
	errorPatterns: RegExp[];
};

class StateManager {
	services: Map<string, ServiceState> = new Map();
	children: Set<import("node:child_process").ChildProcess> = new Set();
	dockerStarted = false;
	isShuttingDown = false;

	addService(
		name: string,
		port?: number,
		healthCheckUrl?: string,
		errorPatterns: RegExp[] = [],
	): void {
		this.services.set(name, {
			name,
			status: "pending",
			port,
			startTime: Date.now(),
			healthCheckUrl,
			logBuffer: [],
			errorPatterns,
		});
	}

	updateService(name: string, updates: Partial<ServiceState>): void {
		const current = this.services.get(name);
		if (current) {
			this.services.set(name, { ...current, ...updates });
		}
	}

	appendLog(name: string, data: string): void {
		const service = this.services.get(name);
		if (service) {
			service.logBuffer.push(data);
			// Keep only last 100 lines
			if (service.logBuffer.length > 100) {
				service.logBuffer.shift();
			}
		}
	}

	checkForErrors(name: string): string[] {
		const service = this.services.get(name);
		if (!service) return [];

		const errors: string[] = [];
		const recentLogs = service.logBuffer.slice(-20).join("\n");

		for (const pattern of service.errorPatterns) {
			const matches = recentLogs.match(pattern);
			if (matches) {
				errors.push(pattern.toString());
			}
		}

		// Common error patterns
		const commonErrors = [
			/EADDRINUSE/,
			/ECONNREFUSED/,
			/ENOTFOUND/,
			/ETIMEDOUT/,
			/Cannot find module/,
			/Module not found/,
			/SyntaxError/,
			/TypeError/,
			/ReferenceError/,
			/Failed to connect/,
			/Connection refused/,
			/Port.*already in use/,
		];

		for (const pattern of commonErrors) {
			if (pattern.test(recentLogs)) {
				const match = recentLogs.match(new RegExp(pattern.source + ".*", "i"));
				if (match) {
					errors.push(match[0].substring(0, 100));
				}
			}
		}

		return errors;
	}

	getStatus(): ServiceState[] {
		return Array.from(this.services.values());
	}

	printStatus(): void {
		logger.subsection("Services Status");
		const items = this.getStatus().map((service) => {
			const statusEmoji = {
				pending: "⏳",
				starting: "🔄",
				running: "✅",
				ready: "✅",
				failed: "❌",
			}[service.status];

			const portInfo = service.port ? `:${service.port}` : "";
			const uptimeInfo =
				service.startTime && service.status === "running"
					? ` (${Math.floor((Date.now() - service.startTime) / 1000)}s)`
					: "";

			return {
				label: `${statusEmoji} ${service.name}`,
				value: `${service.status}${portInfo}${uptimeInfo}`,
				status:
					service.status === "running" || service.status === "ready"
						? ("ok" as const)
						: service.status === "failed"
							? ("error" as const)
							: ("warn" as const),
			};
		});

		logger.summary(items);
	}
}

const state = new StateManager();

// ============================================================================
// HEALTH CHECKS
// ============================================================================

async function checkHealth(url: string, timeout = 5000): Promise<boolean> {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		const response = await fetch(url, {
			method: "GET",
			signal: controller.signal,
			headers: {
				Accept: "application/json",
			},
		});

		clearTimeout(timeoutId);
		return response.ok || response.status === 401 || response.status === 403; // 401/403 means server is up
	} catch (error) {
		return false;
	}
}

async function waitForService(
	name: string,
	healthCheckUrl?: string,
	maxWait = MAX_WAIT_TIME,
): Promise<void> {
	const service = state.services.get(name);
	if (!service) {
		throw new Error(`Service ${name} not found`);
	}

	const startTime = Date.now();
	logger.info(`Waiting for ${name} to be ready...`);

	let consecutiveHealthyChecks = 0;
	const requiredHealthyChecks = 2; // Need 2 consecutive healthy checks

	while (Date.now() - startTime < maxWait) {
		// Refresh service state (it may have been updated by spawnDevProcess)
		const currentService = state.services.get(name);
		if (!currentService) {
			throw new Error(`Service ${name} not found`);
		}
		
		// Check for errors in logs
		const errors = state.checkForErrors(name);
		if (errors.length > 0 && (currentService.status === "starting" || currentService.status === "pending")) {
			logger.error(`${name} has errors in logs:`);
			errors.forEach((err) => logger.error(`  - ${err}`));
			state.updateService(name, { status: "failed" });
			throw new Error(
				`${name} failed to start. Check logs above for details.`,
			);
		}

		// If health check URL is provided, use it
		if (healthCheckUrl) {
			// Try health check even if status is "starting" or "pending" (service may have started)
			if (currentService.status === "running" || currentService.status === "ready" || currentService.status === "starting" || currentService.status === "pending") {
				const isHealthy = await checkHealth(healthCheckUrl);
				if (isHealthy) {
					// If healthy, mark as running first
					if (currentService.status !== "running" && currentService.status !== "ready") {
						state.updateService(name, { status: "running" });
					}
					consecutiveHealthyChecks++;
					if (consecutiveHealthyChecks >= requiredHealthyChecks) {
						state.updateService(name, { status: "ready" });
						logger.success(`${name} is ready and healthy`);
						return;
					}
				} else {
					consecutiveHealthyChecks = 0;
				}
			}
		} else {
			// If service is marked as running and no health check, wait a bit then mark ready
			if (currentService.status === "running") {
				// Give it more time to fully initialize
				await delay(3000);
				state.updateService(name, { status: "ready" });
				logger.success(`${name} is ready`);
				return;
			}
		}

		if (currentService.status === "failed") {
			throw new Error(`${name} failed to start`);
		}

		await delay(HEALTH_CHECK_INTERVAL);
	}

	throw new Error(
		`${name} did not become ready within ${maxWait / 1000}s`,
	);
}

async function waitForAllServices(): Promise<void> {
	logger.step("Waiting for all services to be ready...");

	// Include services that are starting, running, or still pending (should be starting)
	// Exclude PostgreSQL if it's already ready (external service)
	const servicesToWait = Array.from(state.services.values()).filter(
		(s) => 
			s.status === "starting" || 
			s.status === "running" ||
			(s.status === "pending" && s.name !== "PostgreSQL"),
	);

	if (servicesToWait.length === 0) {
		logger.warn("No services to wait for");
		return;
	}
	
	logger.info(`Waiting for ${servicesToWait.length} service(s): ${servicesToWait.map(s => s.name).join(", ")}`);

	const results: Array<{ name: string; success: boolean; error?: string }> = [];

	for (const service of servicesToWait) {
		// If service is still pending, mark it as starting (it should have been started)
		if (service.status === "pending") {
			logger.info(`${service.name} is still pending, marking as starting...`);
			state.updateService(service.name, { status: "starting" });
		}
		
		try {
			await waitForService(service.name, service.healthCheckUrl);
			results.push({ name: service.name, success: true });
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			logger.error(`Failed to wait for ${service.name}: ${errorMsg}`);
			results.push({ name: service.name, success: false, error: errorMsg });
		}
	}

	const successful = results.filter((r) => r.success).length;
	const failed = results.filter((r) => !r.success);

	if (failed.length > 0) {
		logger.warn(
			`${failed.length} service(s) failed to become ready: ${failed.map((f) => f.name).join(", ")}`,
		);
		for (const fail of failed) {
			logger.error(`  - ${fail.name}: ${fail.error}`);
		}
	}

	if (successful === servicesToWait.length) {
		logger.success(`All ${successful} services are ready`);
	} else {
		logger.warn(
			`Only ${successful}/${servicesToWait.length} services are ready. Some features may not work.`,
		);
	}
}

// ============================================================================
// DATABASE VERIFICATION
// ============================================================================

async function verifySeedData(connectionString: string): Promise<{
	employees: number;
	teamMembers: number;
	companies: number;
	users: number;
}> {
	try {
		const { stdout: employeesCount } = await runCommand(
			"psql",
			[
				"--dbname",
				connectionString,
				"-tAc",
				"SELECT COUNT(*) FROM employees;",
			],
			rootDir,
			{ print: false },
		);

		const { stdout: teamMembersCount } = await runCommand(
			"psql",
			[
				"--dbname",
				connectionString,
				"-tAc",
				"SELECT COUNT(*) FROM team_members;",
			],
			rootDir,
			{ print: false },
		);

		const { stdout: companiesCount } = await runCommand(
			"psql",
			[
				"--dbname",
				connectionString,
				"-tAc",
				"SELECT COUNT(*) FROM companies;",
			],
			rootDir,
			{ print: false },
		);

		const { stdout: usersCount } = await runCommand(
			"psql",
			[
				"--dbname",
				connectionString,
				"-tAc",
				"SELECT COUNT(*) FROM users;",
			],
			rootDir,
			{ print: false },
		);

		return {
			employees: parseInt(employeesCount.trim(), 10) || 0,
			teamMembers: parseInt(teamMembersCount.trim(), 10) || 0,
			companies: parseInt(companiesCount.trim(), 10) || 0,
			users: parseInt(usersCount.trim(), 10) || 0,
		};
	} catch (error) {
		logger.warn(
			`Could not verify seed data: ${error instanceof Error ? error.message : String(error)}`,
		);
		return { employees: 0, teamMembers: 0, companies: 0, users: 0 };
	}
}

async function verifyApiSeedData(connectionString: string): Promise<{
	employees: number;
	notifications: number;
}> {
	try {
		const { stdout: employeesCount } = await runCommand(
			"psql",
			[
				"--dbname",
				connectionString,
				"-tAc",
				"SELECT COUNT(*) FROM employees;",
			],
			rootDir,
			{ print: false },
		);

		const { stdout: notificationsCount } = await runCommand(
			"psql",
			[
				"--dbname",
				connectionString,
				"-tAc",
				"SELECT COUNT(*) FROM notifications;",
			],
			rootDir,
			{ print: false },
		);

		return {
			employees: parseInt(employeesCount.trim(), 10) || 0,
			notifications: parseInt(notificationsCount.trim(), 10) || 0,
		};
	} catch (error) {
		logger.warn(
			`Could not verify API seed data: ${error instanceof Error ? error.message : String(error)}`,
		);
		return { employees: 0, notifications: 0 };
	}
}

// ============================================================================
// FRONTEND VERIFICATION
// ============================================================================

async function verifyFrontendData(
	frontendUrl: string,
	apiUrl: string,
): Promise<{
	employeesAvailable: boolean;
	teamMembersAvailable: boolean;
}> {
	try {
		// Check employees endpoint (in Dashboard Next.js app)
		let employeesAvailable = false;
		try {
			const employeesResponse = await fetch(
				`${frontendUrl}/api/employees?limit=1`,
				{
					method: "GET",
					headers: {
						Accept: "application/json",
					},
				},
			);

			if (employeesResponse.ok) {
				const data = await employeesResponse.json();
				employeesAvailable =
					Array.isArray(data.data) && data.data.length > 0;
			}
		} catch (error) {
			// Endpoint might not be available yet
		}

		// Check team members endpoint (in Dashboard Next.js app)
		let teamMembersAvailable = false;
		try {
			const teamMembersResponse = await fetch(
				`${frontendUrl}/api/settings/team-members?limit=1`,
				{
					method: "GET",
					headers: {
						Accept: "application/json",
					},
				},
			);

			if (teamMembersResponse.ok) {
				const data = await teamMembersResponse.json();
				teamMembersAvailable =
					Array.isArray(data.data) && data.data.length > 0;
			}
		} catch (error) {
			// Endpoint might not be available yet
		}

		return {
			employeesAvailable,
			teamMembersAvailable,
		};
	} catch (error) {
		logger.warn(
			`Could not verify frontend data: ${error instanceof Error ? error.message : String(error)}`,
		);
		return { employeesAvailable: false, teamMembersAvailable: false };
	}
}

// ============================================================================
// ENVIRONMENT
// ============================================================================

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

function parseArgs() {
	const args = process.argv.slice(2);

	return {
		docker: args.includes("--docker"),
		local: args.includes("--local"),
		skipSeed: args.includes("--skip-seed"),
		quick: args.includes("--quick"),
		onlySeed: args.some((arg) => arg.startsWith("--only=")),
		skipSeedModules: args.some((arg) => arg.startsWith("--skip=")),
		verbose: args.includes("--verbose") || args.includes("-v"),
		help: args.includes("--help") || args.includes("-h"),
	};
}

function printHelp() {
	console.log(`
${"\x1b[1m"}Development Environment Manager${"\x1b[0m"}

Usage: bun run dev [options]

Modes:
  --docker          Use Docker Compose for infrastructure
  --local           Use local PostgreSQL/Redis (default)

Seeding Options:
  --skip-seed       Skip database seeding
  --quick           Quick start (skip seed if data exists)
  --only=<modules>  Seed only specific modules (comma-separated)
                    Example: --only=auth,accounts,employees
                    API modules: auth,accounts,products,crm,sales,projects,settings,hr,notifications
                    Dashboard modules: companies,users,company,employees,vault,deals,team-members,notifications,teamchat,chat
  --skip=<modules>  Skip specific seed modules (comma-separated)
                    Example: --skip=crm,projects,vault

Other Options:
  --verbose, -v     Show verbose logging
  --help, -h        Show this help message

Examples:
  # Standard local development
  bun run dev

  # Quick start (skip seed if DB has data)
  bun run dev --quick

  # Skip seeding entirely
  bun run dev --skip-seed

  # Seed only auth and accounts
  bun run dev --only=auth,accounts

  # Use Docker infrastructure
  bun run dev --docker

Environment Variables:
  API_PORT          API server port (default: 4000)
  WEB_PORT          Frontend port (default: 3000)
  DATABASE_URL      PostgreSQL connection string
  REDIS_URL         Redis connection string
`);
}

// ============================================================================
// UTILITIES
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

async function killProcessOnPort(port: number): Promise<void> {
	try {
		const { stdout } = await runCommand("lsof", ["-t", `-i:${port}`], rootDir, {
			print: false,
		});
		const pids = stdout.trim().split("\n").filter(Boolean);

		if (pids.length === 0) {
			return;
		}

		// First, try graceful shutdown with SIGTERM
		for (const pid of pids) {
			try {
				const pidNum = parseInt(pid, 10);
				process.kill(pidNum, "SIGTERM");
				logger.info(`Sent SIGTERM to process ${pid} on port ${port}`);
			} catch {
				// Process might already be dead
			}
		}

		// Wait a bit for processes to exit gracefully
		await delay(2000);

		// Check if processes are still running
		try {
			const { stdout: checkStdout } = await runCommand(
				"lsof",
				["-t", `-i:${port}`],
				rootDir,
				{ print: false },
			);
			const remainingPids = checkStdout.trim().split("\n").filter(Boolean);

			// Force kill any remaining processes
			for (const pid of remainingPids) {
				try {
					const pidNum = parseInt(pid, 10);
					process.kill(pidNum, "SIGKILL");
					logger.info(`Force killed process ${pid} on port ${port}`);
				} catch {
					// Process might already be dead
				}
			}

			if (remainingPids.length > 0) {
				await delay(500);
			}
		} catch {
			// No processes remaining, that's fine
		}
	} catch {
		// No process on port, that's fine
	}
}

async function isPortFree(port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const server = createServer();

		server.once("error", () => {
			resolve(false);
		});

		server.listen(port, "0.0.0.0", () => {
			server.close(() => resolve(true));
		});
	});
}

async function ensurePortFree(port: number, label: string): Promise<void> {
	const free = await isPortFree(port);

	if (!free) {
		logger.warn(`Port ${port} (${label}) is in use, attempting to free it...`);
		await killProcessOnPort(port);

		// Verify it's free now
		const nowFree = await isPortFree(port);
		if (!nowFree) {
			throw new Error(`Failed to free port ${port} for ${label}`);
		}

		logger.success(`Port ${port} freed`);
	}
}

// ============================================================================
// DATABASE
// ============================================================================

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

async function checkDatabaseHasData(
	connectionString: string,
): Promise<boolean> {
	try {
		// Check if there are any user tables
		const result = await runCommand(
			"psql",
			[
				"--dbname",
				connectionString,
				"-tAc",
				"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'",
			],
			rootDir,
			{ print: false },
		);

		const tableCount = parseInt(result.stdout.trim(), 10);
		return tableCount > 0;
	} catch {
		return false;
	}
}

async function checkEmployeesExist(
	connectionString: string,
): Promise<boolean> {
	try {
		// Check if employees table exists and has data
		const result = await runCommand(
			"psql",
			[
				"--dbname",
				connectionString,
				"-tAc",
				"SELECT COUNT(*) FROM employees;",
			],
			rootDir,
			{ print: false },
		);

		const count = parseInt(result.stdout.trim(), 10);
		return count > 0;
	} catch {
		// Table doesn't exist or error - employees don't exist
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

async function cleanupEmployeesTable(connectionString: string): Promise<void> {
	try {
		// Check if user_id column exists in employees table
		const checkResult = await runCommand(
			"psql",
			[
				"--dbname",
				connectionString,
				"-tAc",
				"SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'user_id';",
			],
			rootDir,
			{ print: false },
		);

		const columnExists = parseInt(checkResult.stdout.trim(), 10) > 0;

		if (columnExists) {
			// Check if it has foreign key constraint (API schema uses it)
			const fkCheck = await runCommand(
				"psql",
				[
					"--dbname",
					connectionString,
					"-tAc",
					"SELECT COUNT(*) FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name WHERE tc.table_name = 'employees' AND kcu.column_name = 'user_id' AND tc.constraint_type = 'FOREIGN KEY';",
				],
				rootDir,
				{ print: false },
			);

			const hasForeignKey = parseInt(fkCheck.stdout.trim(), 10) > 0;

			// API schema expects user_id with foreign key, so we should keep it
			// But if it exists without FK, it might cause issues - leave it for API to handle
			if (!hasForeignKey) {
				logger.info("Employees table has user_id column without foreign key. API will add FK constraint.");
			}
		}
	} catch (error) {
		// Ignore errors - column might not exist or table might not exist yet
	}
}

async function runMigrations(): Promise<void> {
	logger.step("Running database migrations...");

	// Cleanup user_id column from employees table in dashboard database BEFORE migrations
	// This prevents Drizzle interactive prompts
	const connectionString =
		process.env.DATABASE_URL ||
		"postgres://postgres:postgres@localhost:5432/collector_dashboard";
	await cleanupEmployeesTable(connectionString);

	try {
		// Skip API db:push for now - API and Dashboard use different employees schemas
		// API employees has: id (uuid), user_id, employee_number, status, department
		// Dashboard employees has: id (serial), first_name, last_name, email, hashed_password, etc.
		// They are incompatible, so we skip API push to avoid interactive prompts
		logger.info("Skipping API db:push (API and Dashboard use different employees schemas)");
		logger.info("💡 API employees schema is different from Dashboard employees schema.");
		logger.info("💡 API will use its own employees table structure when needed.");
		
		// Apply project tables migration (project_teams, project_time_entries)
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
		
		// If you need API migrations, run them separately: cd apps/api && bun run db:push
	} catch (error) {
		logger.warn(
			`API migration error: ${error instanceof Error ? error.message : String(error)}`,
		);
		// Continue even if API migrations fail
	}

	let dashboardMigrationsOk = false;
	try {
		// Run Dashboard migrations using db:migrate (non-interactive, uses existing SQL files)
		await runCommand("bun", ["run", "db:migrate"], dashboardDir);
		logger.success("Dashboard migrations completed");
		dashboardMigrationsOk = true;
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		logger.error(`Dashboard migrations failed: ${errorMsg}`);
		logger.warn(
			"Dashboard migrations did not complete successfully. Seed may fail.",
		);
		// Don't throw - allow dev server to start even if migrations have issues
		// But log it clearly so user knows what happened
	}

	if (!dashboardMigrationsOk) {
		logger.warn(
			"⚠ Dashboard migrations did not complete. Employees seed will likely fail.",
		);
		logger.info(
			"💡 Try running migrations manually: cd apps/dashboard && bun run db:migrate",
		);
	}
}

// Removed askYesNo - no longer needed, seed runs automatically

async function runSeed(options: {
	only?: string;
	skip?: string;
	force?: boolean;
}): Promise<void> {
	logger.step("Seeding database...");

	const seedArgs = ["run", "db:seed"];

	if (options.only) {
		seedArgs.push(`--only=${options.only}`);
	}

	if (options.skip) {
		seedArgs.push(`--skip=${options.skip}`);
	}

	if (options.force) {
		seedArgs.push("--force");
	}

	try {
		// Seed API database
		await runCommand("bun", seedArgs, apiDir);
		logger.success("API database seeded");
	} catch (error) {
		logger.warn(
			`API seeding had issues: ${error instanceof Error ? error.message : String(error)}`,
		);
		// Continue even if API seed fails
	}

	try {
		// Seed Dashboard database (employees, vault, etc.)
		const dashboardSeedArgs = ["run", "db:seed"];

		// If --only is specified, check if it includes dashboard modules
		if (options.only) {
			const onlyModules = options.only.split(",");
			const dashboardModules = onlyModules.filter((m) =>
				[
					"employees",
					"vault",
					"deals",
					"team-members",
					"notifications",
					"teamchat",
					"chat",
					"users-companies",
					"companies",
					"users",
					"company",
				].includes(m.trim()),
			);
			if (dashboardModules.length > 0) {
				dashboardSeedArgs.push(`--only=${dashboardModules.join(",")}`);
			} else if (onlyModules.length > 0) {
				// If only API modules are specified, skip dashboard seed
				logger.info("Skipping dashboard seed (only API modules specified)");
				return;
			}
		}

		// If --skip is specified, pass it through
		if (options.skip) {
			dashboardSeedArgs.push(`--skip=${options.skip}`);
		}

		if (options.force) {
			dashboardSeedArgs.push("--force");
		}

		await runCommand("bun", dashboardSeedArgs, dashboardDir);
		logger.success("Dashboard database seeded");
	} catch (error) {
		logger.warn(
			`Dashboard seeding had issues: ${error instanceof Error ? error.message : String(error)}`,
		);
		// Continue even if dashboard seed fails
	}
}

// ============================================================================
// DOCKER
// ============================================================================

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

async function getDockerComposeStatus(): Promise<
	Array<{ Service?: string; State?: string; Health?: string }>
> {
	try {
		const { stdout } = await runCommand(
			"docker",
			["compose", "ps", "--format", "json"],
			rootDir,
			{ print: false },
		);

		const trimmed = stdout.trim();
		if (!trimmed) return [];

		try {
			return JSON.parse(trimmed);
		} catch {
			// Handle line-delimited JSON
			const lines = trimmed.split("\n").filter(Boolean);
			return lines.map((line) => {
				try {
					return JSON.parse(line);
				} catch {
					return {};
				}
			});
		}
	} catch {
		return [];
	}
}

async function waitForDockerService(
	service: string,
	timeoutMs = 60000,
): Promise<void> {
	const start = Date.now();

	logger.info(`Waiting for ${service} to be ready...`);

	while (Date.now() - start < timeoutMs) {
		const status = await getDockerComposeStatus();
		const serviceStatus = status.find((s) => s.Service === service);

		if (
			serviceStatus?.State === "running" ||
			serviceStatus?.Health === "healthy"
		) {
			logger.success(`${service} is ready`);
			return;
		}

		if (serviceStatus?.State === "exited" || serviceStatus?.State === "dead") {
			throw new Error(`${service} failed to start`);
		}

		await delay(2000);
	}

	throw new Error(
		`${service} did not become ready within ${timeoutMs / 1000}s`,
	);
}

// ============================================================================
// PROCESS MANAGEMENT
// ============================================================================

function spawnDevProcess(
	name: string,
	command: string,
	args: string[],
	cwd: string,
	envOverrides: NodeJS.ProcessEnv = {},
): void {
	const child = spawn(command, args, {
		cwd,
		env: { ...process.env, ...envOverrides },
		stdio: ["inherit", "pipe", "pipe"],
	});

	state.children.add(child);
	state.updateService(name, { status: "starting" });

	const prefix = `[\x1b[35m${name}\x1b[0m]`;

	child.stdout?.on("data", (data) => {
		const output = data.toString();
		state.appendLog(name, output);

		// Check for successful start indicators
		if (
			output.includes("ready") ||
			output.includes("listening") ||
			output.includes("started") ||
			output.includes("Local:") ||
			output.includes("compiled") ||
			output.includes("Server listening") ||
			output.includes("Socket.IO path") ||
			(name === "Chat Service" && output.includes("[chat-service] Server listening")) ||
			(name === "Chat Service" && output.includes("Server listening on")) ||
			(name === "API" && output.includes("Server listening")) ||
			(name === "Notification Service" && output.includes("Server listening")) ||
			(name === "Frontend" && output.includes("Ready in"))
		) {
			state.updateService(name, { status: "running" });
		}

		process.stdout.write(`${prefix} ${data}`);
	});

	child.stderr?.on("data", (data) => {
		const output = data.toString();
		state.appendLog(name, output);
		
		// Check for errors that indicate service failure
		if (
			output.includes("Error") ||
			output.includes("error") ||
			output.includes("Failed") ||
			output.includes("failed") ||
			output.includes("ECONNREFUSED") ||
			output.includes("EADDRINUSE") ||
			output.includes("Cannot connect") ||
			output.includes("Connection refused") ||
			output.includes("process.exit") ||
			output.includes("exited with code")
		) {
			// Log error and mark as failed if it's a critical error
			logger.warn(`${name} error detected: ${output.substring(0, 200)}`);
			
			// If it's a critical error (exit, connection refused, etc.), mark as failed
			if (
				output.includes("process.exit") ||
				output.includes("exited with code") ||
				output.includes("ECONNREFUSED") ||
				output.includes("Connection refused")
			) {
				state.updateService(name, { status: "failed" });
			}
		}
		
		process.stderr.write(`${prefix} ${data}`);
	});

	child.once("exit", (code) => {
		state.children.delete(child);
		state.updateService(name, { status: "failed" });

		if (code !== 0) {
			logger.error(`${name} exited with code ${code}`);
			logger.error(`${name} process terminated unexpectedly. Check logs above for errors.`);
			
			// Show recent logs for debugging
			const service = state.services.get(name);
			if (service && service.logBuffer.length > 0) {
				const recentLogs = service.logBuffer.slice(-20).join("\n");
				logger.error(`${name} recent logs before exit:`);
				logger.error(recentLogs);
			}
			
			// Don't shutdown immediately for chat service - it might be a transient error
			if (name === "Chat Service") {
				logger.warn("Chat service exited. This may be due to Redis or database connection issues.");
				logger.info("💡 Check Redis: redis-cli ping");
				logger.info("💡 Check database connection");
			} else {
				shutdown(code ?? 1);
			}
		}
	});

	// Mark as running after a delay (assume successful start)
	setTimeout(() => {
		if (state.services.get(name)?.status === "starting") {
			state.updateService(name, { status: "running" });
		}
	}, 3000);
}

// ============================================================================
// SHUTDOWN
// ============================================================================

async function shutdown(exitCode: number): Promise<void> {
	if (state.isShuttingDown) {
		return;
	}

	state.isShuttingDown = true;

	logger.section("Shutting Down");

	// Kill all child processes
	for (const child of state.children) {
		child.removeAllListeners();
		child.kill("SIGTERM");
	}

	// Stop Docker services if started
	if (state.dockerStarted) {
		logger.step("Stopping Docker services...");
		try {
			await runCommand(
				"docker",
				["compose", "down", "--remove-orphans"],
				rootDir,
			);
			logger.success("Docker services stopped");
		} catch (error) {
			logger.error(
				`Failed to stop Docker: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	logger.success("Shutdown complete");
	process.exit(exitCode);
}

process.on("SIGINT", () => void shutdown(0));
process.on("SIGTERM", () => void shutdown(0));

// ============================================================================
// WORKFLOWS
// ============================================================================

async function runDockerWorkflow(): Promise<void> {
	logger.section("Docker Workflow");

	const dockerAvailable = await checkDockerAvailable();
	if (!dockerAvailable) {
		throw new Error(
			"Docker Compose is not available. Install it or use --local mode.",
		);
	}

	logger.step("Starting infrastructure (PostgreSQL, Redis)...");
	await runCommand(
		"docker",
		["compose", "up", "-d", "postgres", "redis"],
		rootDir,
	);
	state.dockerStarted = true;

  await waitForDockerService("postgres");
  await waitForDockerService("redis");

  // Seed database inside Docker before starting application services
  logger.step("Running database seed in Docker...");
  try {
    await runCommand(
      "docker",
      ["compose", "run", "--rm", "seed"],
      rootDir,
    );
    logger.success("Database seeded successfully");
  } catch (error) {
    logger.warn(
      `Database seed encountered issues: ${error instanceof Error ? error.message : String(error)}`,
    );
    logger.info("Continuing with service startup; verify seed data after start");
  }

  logger.step("Building API image...");
  await runCommand("docker", ["compose", "build", "api"], rootDir);

	logger.step("Starting API container...");
	await runCommand("docker", ["compose", "up", "-d", "api"], rootDir);

	await waitForDockerService("api");

	logger.success("All Docker services running");
	logger.info("Following logs (Ctrl+C to exit)...");

	spawnDevProcess(
		"docker",
		"docker",
		["compose", "logs", "-f", "postgres", "redis", "api"],
		rootDir,
	);
}

async function runLocalWorkflow(
	opts: ReturnType<typeof parseArgs>,
): Promise<void> {
	logger.section("Local Development Workflow");

	// Environment setup
	loadEnvFiles();
	const connectionString = resolveDatabaseUrl();
	const { database, host, port } = parseDatabaseUrl(connectionString);

	logger.summary([
		{ label: "Database", value: database },
		{ label: "Host", value: `${host}:${port}` },
		{ label: "Mode", value: "Local" },
	]);

	// Check ports
	const apiPort = Number(process.env.API_PORT ?? DEFAULT_PORTS.api);
	let webPort = Number(
		process.env.WEB_PORT ?? process.env.PORT ?? DEFAULT_PORTS.web,
	);
	const socketPort = Number(process.env.SOCKET_PORT ?? DEFAULT_PORTS.socket);
	const notificationPort = Number(
		process.env.NOTIFICATION_PORT ?? DEFAULT_PORTS.notification,
	);
	const chatPort = Number(process.env.CHAT_PORT ?? DEFAULT_PORTS.chat);

	if (apiPort === webPort) {
		const fallback = apiPort === 3000 ? 3001 : 3000;
		logger.warn(
			`API and Web using same port ${apiPort}, moving Web to ${fallback}`,
		);
		webPort = fallback;
		process.env.WEB_PORT = String(fallback);
	}

	// Add services with health check URLs and error patterns
	// Note: PostgreSQL is external, we'll check it separately
	state.addService("API", apiPort, `http://localhost:${apiPort}/api/health`, [
		/EADDRINUSE/,
		/Cannot find module/,
		/Port.*already in use/,
	]);
	state.addService("Frontend", webPort, `http://localhost:${webPort}`, [
		/EADDRINUSE/,
		/Port.*already in use/,
	]);
	state.addService("Socket.IO", socketPort);
	state.addService(
		"Notification Service",
		notificationPort,
		`http://localhost:${notificationPort}/health`,
	);
	state.addService(
		"Chat Service",
		chatPort,
		`http://localhost:${chatPort}/health`,
		[
			/ECONNREFUSED/,
			/Connection refused/,
			/Cannot connect to Redis/,
			/Redis connection error/,
			/Failed to connect to database/,
			/Database connection error/,
			/EADDRINUSE/,
			/Port.*already in use/,
		],
	);
	
	// Check PostgreSQL availability (external service)
	logger.step("Checking PostgreSQL availability...");
	try {
		await runCommand(
			"psql",
			["--dbname", connectionString, "-c", "SELECT 1"],
			rootDir,
			{ print: false },
		);
		state.addService("PostgreSQL", DEFAULT_PORTS.postgres);
		state.updateService("PostgreSQL", { status: "ready" });
		logger.success("PostgreSQL is available");
	} catch (error) {
		logger.warn("PostgreSQL connection check failed - service may not be running");
		logger.info("💡 Start PostgreSQL with: brew services start postgresql");
		logger.info("   Or use Docker: docker-compose up -d postgres");
		// Don't add PostgreSQL to services if it's not available
	}

	// Check and free ports
	logger.step("Checking ports...");
	await ensurePortFree(apiPort, "API");
	await ensurePortFree(webPort, "Frontend");
	await ensurePortFree(socketPort, "Socket.IO");
	await ensurePortFree(notificationPort, "Notification Service");
	await ensurePortFree(chatPort, "Chat Service");

	// Database setup
	logger.step("Setting up database...");
	await ensureDatabaseExists(connectionString);

	// Check if we have essential data (employees)
	const hasEmployees = await checkEmployeesExist(connectionString);
	const hasData = await checkDatabaseHasData(connectionString);

	if (hasEmployees && opts.quick) {
		logger.info("Employees exist, skipping migrations and seed (quick mode)");
	} else {
		let migrationsSuccessful = false;
		try {
			await runMigrations();
			migrationsSuccessful = true;
		} catch (error) {
			logger.error(
				`Migrations failed: ${error instanceof Error ? error.message : String(error)}`,
			);
			logger.warn("Continuing anyway, but seed may fail if tables don't exist");
		}

		if (!opts.skipSeed) {
			if (!migrationsSuccessful) {
				logger.warn(
					"Migrations had issues. Seed may fail if required tables don't exist.",
				);
				logger.info(
					"You can skip seed with --skip-seed or fix migrations first",
				);
			}

			const seedOpts: { only?: string; skip?: string; force?: boolean } = {};

			// Parse --only and --skip arguments
			for (const arg of process.argv.slice(2)) {
				if (arg.startsWith("--only=")) {
					seedOpts.only = arg.split("=")[1];
				}
				if (arg.startsWith("--skip=")) {
					seedOpts.skip = arg.split("=")[1];
				}
				if (arg === "--force" || arg === "-f") {
					seedOpts.force = true;
				}
			}

			// Always run seed if employees don't exist, or if --force is specified
			if (!hasEmployees) {
				logger.info("No employees found. Running seed to create employees and other data...");
				await runSeed(seedOpts);
			} else if (seedOpts.force) {
				logger.info("Force flag set. Running seed to overwrite existing data...");
				await runSeed(seedOpts);
			} else {
				logger.info("Employees already exist. Skipping seed.");
				logger.info("Use --force to re-seed all data.");
			}

			// Always verify seed data, even if we skipped seeding
			logger.step("Verifying seed data...");
			const dashboardData = await verifySeedData(connectionString);
			const apiData = await verifyApiSeedData(connectionString);

			logger.summary([
				{
					label: "Dashboard Employees",
					value: String(dashboardData.employees),
					status:
						dashboardData.employees > 0 ? "ok" : "warn",
				},
				{
					label: "Dashboard Team Members",
					value: String(dashboardData.teamMembers),
					status:
						dashboardData.teamMembers > 0 ? "ok" : "warn",
				},
				{
					label: "Dashboard Companies",
					value: String(dashboardData.companies),
					status:
						dashboardData.companies > 0 ? "ok" : "warn",
				},
				{
					label: "Dashboard Users",
					value: String(dashboardData.users),
					status: dashboardData.users > 0 ? "ok" : "warn",
				},
				{
					label: "API Employees",
					value: String(apiData.employees),
					status: apiData.employees > 0 ? "ok" : "warn",
				},
				{
					label: "API Notifications",
					value: String(apiData.notifications),
					status: apiData.notifications > 0 ? "ok" : "warn",
				},
			]);

			if (dashboardData.employees === 0) {
				logger.warn(
					"⚠ No employees found in database. Frontend will show 'No employees yet'.",
				);
				logger.info(
					"💡 Employees seed may have failed. Check seed logs above.",
				);
				logger.info(
					"💡 Try running manually: cd apps/dashboard && bun run db:seed --only=employees",
				);
			} else {
				logger.success(
					`✓ Found ${dashboardData.employees} employees in database`,
				);
			}

			if (dashboardData.teamMembers === 0) {
				logger.warn(
					"⚠ No team members found in database. Team features may not work.",
				);
				logger.info(
					"💡 Team members seed may have failed. Check seed logs above.",
				);
				logger.info(
					"💡 Try running manually: cd apps/dashboard && bun run db:seed --only=team-members",
				);
			} else {
				logger.success(
					`✓ Found ${dashboardData.teamMembers} team members in database`,
				);
			}

			if (dashboardData.companies === 0) {
				logger.error(
					"❌ No companies found in database. This will cause issues with team members and other features.",
				);
				logger.info(
					"💡 Try running: cd apps/dashboard && bun run db:seed --only=companies",
				);
			} else {
				logger.success(
					`✓ Found ${dashboardData.companies} companies in database`,
				);
			}

			if (dashboardData.users === 0 && dashboardData.employees > 0) {
				logger.warn(
					"⚠ No users found but employees exist. Users should be created from employees.",
				);
				logger.info(
					"💡 Try running: cd apps/dashboard && bun run db:seed --only=users",
				);
			} else if (dashboardData.users > 0) {
				logger.success(
					`✓ Found ${dashboardData.users} users in database`,
				);
			}
		} else {
			logger.info("Skipping database seed (--skip-seed)");
		}
	}

	// Check Redis before starting chat service
	logger.step("Checking Redis availability...");
	const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
	try {
		// Try to connect to Redis using redis-cli if available
		const { stdout } = await runCommand(
			"redis-cli",
			["ping"],
			rootDir,
			{ print: false },
		);
		if (stdout.trim().toLowerCase() === "pong") {
			logger.success("Redis is available");
		} else {
			logger.warn("Redis ping returned unexpected response");
		}
	} catch (error) {
		logger.warn(
			"⚠ Redis may not be running. Chat service requires Redis.",
		);
		logger.info("💡 Start Redis with: brew services start redis");
		logger.info("   Or use Docker: docker-compose up -d redis");
		logger.info("   Continuing anyway, but chat service may fail...");
	}

	// Start services
	logger.step("Starting development servers...");

	spawnDevProcess("API", "bun", ["run", "dev"], apiDir, {
		PORT: String(apiPort),
		API_PORT: String(apiPort),
	});

	spawnDevProcess("Socket.IO", "bun", ["socket-server.ts"], dashboardDir, {
		SOCKET_PORT: String(socketPort),
		SOCKET_HOST: "0.0.0.0",
		NODE_ENV: process.env.NODE_ENV || "development",
	});

	spawnDevProcess(
		"Notification Service",
		"bun",
		["run", "dev"],
		notificationServiceDir,
		{
			PORT: String(notificationPort),
			HOST: "0.0.0.0",
			NODE_ENV: process.env.NODE_ENV || "development",
			ALWAYS_NOTIFY_DM_ONLINE: "true",
			ALWAYS_NOTIFY_CHANNEL_ONLINE: "false",
		},
	);

	logger.info(`Starting chat service on port ${chatPort}...`);
	logger.info(`  - Database: ${connectionString.split("@")[1] || "configured"}`);
	logger.info(`  - Redis: ${redisUrl}`);
	
	spawnDevProcess("Chat Service", "bun", ["run", "dev"], chatServiceDir, {
		PORT: String(chatPort),
		HOST: "0.0.0.0",
		DATABASE_URL: connectionString,
		REDIS_URL: redisUrl,
		JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-in-production",
		NODE_ENV: process.env.NODE_ENV || "development",
	});

	// Give chat service extra time to start (it needs Redis and DB)
	logger.info("Waiting for chat service to initialize (needs Redis and DB)...");
	await delay(5000);

	// Use Next.js with Turbopack for faster hot reload
	spawnDevProcess(
		"Frontend",
		"bunx",
		["next", "dev", "--turbo", "-p", String(webPort)],
		dashboardDir,
		{
			PORT: String(webPort),
			WEB_PORT: String(webPort),
			SOCKET_PORT: String(socketPort),
			// Enable Turbopack explicitly
			TURBOPACK: "1",
		},
	);

	// Wait for all services to be ready - THIS IS CRITICAL
	logger.step("Waiting for all services to be ready...");
	logger.info("This may take a moment. Please wait...");

	// Give services initial time to start (especially chat service which needs Redis)
	// This allows spawnDevProcess to update status from "pending" to "starting" to "running"
	await delay(3000);

	// Wait for all services - this will NOT continue until services are ready
	try {
		await waitForAllServices();
	} catch (error) {
		logger.error(
			`Critical: Services failed to start: ${error instanceof Error ? error.message : String(error)}`,
		);
		
		// Check specifically for chat service errors
		const chatService = state.services.get("Chat Service");
		if (chatService) {
			if (chatService.status === "failed") {
				const errors = state.checkForErrors("Chat Service");
				if (errors.length > 0) {
					logger.error("Chat service errors detected:");
					errors.forEach((err) => logger.error(`  - ${err}`));
				}
				
				// Show all logs for failed service
				if (chatService.logBuffer.length > 0) {
					logger.error("Chat service full logs:");
					logger.error(chatService.logBuffer.join("\n"));
				}
				
				logger.error("Chat service failed to start. Check logs above.");
				logger.info("Common issues:");
				logger.info("  - Redis not running: brew services start redis (or docker-compose up redis)");
				logger.info("  - Database connection issues: Check DATABASE_URL");
				logger.info("  - Port 4001 already in use: Check with 'lsof -i:4001'");
			} else if (chatService.status === "starting" || chatService.status === "pending") {
				logger.warn("Chat service is still starting or pending. Showing recent logs:");
				if (chatService.logBuffer.length > 0) {
					logger.info(chatService.logBuffer.slice(-20).join("\n"));
				} else {
					logger.warn("No logs from chat service yet. Service may not have started.");
				}
			}
		}
		
		logger.error("Cannot continue - services must be ready before proceeding");
		throw error;
	}

	// Give services additional time to fully initialize after health checks pass
	logger.info("Services are ready. Finalizing initialization...");
	await delay(2000);

	// Verify chat service socket connection - CRITICAL CHECK
	logger.step("Verifying chat service socket connection...");
	const chatServiceUrl = `http://localhost:${chatPort}`;
	let chatServiceReady = false;
	
	// More attempts and longer wait for chat service
	for (let attempt = 1; attempt <= 10; attempt++) {
		try {
			const isHealthy = await checkHealth(`${chatServiceUrl}/health`);
			if (isHealthy) {
				chatServiceReady = true;
				logger.success("Chat service is ready and healthy");
				break;
			}
		} catch (error) {
			// Log error for debugging
			if (attempt === 1 || attempt % 3 === 0) {
				logger.info(
					`Chat service health check failed (attempt ${attempt}/10): ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}
		if (attempt < 10) {
			await delay(3000); // Wait 3 seconds between attempts
		}
	}

	if (!chatServiceReady) {
		logger.error(
			"❌ Chat service is NOT ready. Socket connections will fail.",
		);
		
		// Check for specific errors
		const chatService = state.services.get("Chat Service");
		if (chatService) {
			const errors = state.checkForErrors("Chat Service");
			if (errors.length > 0) {
				logger.error("Chat service errors detected:");
				errors.forEach((err) => logger.error(`  - ${err}`));
			}
			
		// Show recent logs (more lines for debugging)
		const recentLogs = chatService.logBuffer.slice(-30).join("\n");
		if (recentLogs) {
			logger.error("Recent chat service logs (last 30 lines):");
			logger.error(recentLogs);
		} else {
			logger.error("No logs available from chat service. Service may not have started.");
		}
		}
		
		logger.info(
			"💡 Troubleshooting steps:",
		);
		logger.info("  1. Check Redis: redis-cli ping (should return PONG)");
		logger.info("  2. Check database: psql $DATABASE_URL -c 'SELECT 1'");
		logger.info(`  3. Check port: lsof -i:${chatPort}`);
		logger.info(`  4. Manual health check: curl http://localhost:${chatPort}/health`);
		logger.info("  5. Check chat service logs above for errors");
		
		// Don't throw error, but warn strongly
		logger.warn("⚠ Continuing anyway, but chat will not work until service is ready.");
	}

	// Verify frontend can access data
	logger.step("Verifying frontend data access...");
	const frontendUrl = `http://localhost:${webPort}`;
	const apiUrl = `http://localhost:${apiPort}`;

	// Try multiple times with retries
	let frontendData = { employeesAvailable: false, teamMembersAvailable: false };
	for (let attempt = 1; attempt <= 3; attempt++) {
		logger.info(`Verifying frontend data (attempt ${attempt}/3)...`);
		frontendData = await verifyFrontendData(frontendUrl, apiUrl);

		if (frontendData.employeesAvailable && frontendData.teamMembersAvailable) {
			break;
		}

		if (attempt < 3) {
			logger.info("Waiting before retry...");
			await delay(3000);
		}
	}

	if (!frontendData.employeesAvailable) {
		logger.warn(
			"⚠ Employees endpoint not accessible or empty. Frontend will show 'No employees yet'.",
		);
		logger.info(
			"💡 Check that frontend is running and employees seed completed successfully.",
		);
		logger.info(
			`💡 Verify: curl http://localhost:${webPort}/api/employees?limit=1`,
		);
	} else {
		logger.success("✓ Employees are accessible via frontend API");
	}

	if (!frontendData.teamMembersAvailable) {
		logger.warn(
			"⚠ Team members endpoint not accessible or empty. Team features may not work.",
		);
		logger.info(
			"💡 Check that frontend is running and team-members seed completed successfully.",
		);
		logger.info(
			`💡 Verify: curl http://localhost:${webPort}/api/settings/team-members?limit=1`,
		);
	} else {
		logger.success("✓ Team members are accessible via frontend API");
	}

	if (!chatServiceReady) {
		logger.warn(
			"⚠ Chat service not ready. Socket connections will fail with 'Connection error'.",
		);
		logger.info(
			`💡 Check chat service logs. Verify: curl http://localhost:${chatPort}/health`,
		);
		logger.info(
			`💡 Chat socket path should be: http://localhost:${chatPort}/socket/teamchat`,
		);
	} else {
		logger.success("✓ Chat service is ready for socket connections");
	}

	// Print final status
	logger.section("Development Environment Ready");

	logger.summary([
		{ label: "API Server", value: `http://localhost:${apiPort}`, status: "ok" },
		{ label: "Frontend", value: `http://localhost:${webPort}`, status: "ok" },
		{
			label: "Socket.IO",
			value: `http://localhost:${socketPort}`,
			status: "ok",
		},
		{
			label: "Notification Service",
			value: `http://localhost:${notificationPort}`,
			status: "ok",
		},
		{
			label: "Chat Service",
			value: `http://localhost:${chatPort}`,
			status: chatServiceReady ? "ok" : "warn",
		},
		{ label: "Database", value: database, status: "ok" },
		{
			label: "Employees Available",
			value: frontendData.employeesAvailable ? "Yes" : "No",
			status: frontendData.employeesAvailable ? "ok" : "warn",
		},
		{
			label: "Team Members Available",
			value: frontendData.teamMembersAvailable ? "Yes" : "No",
			status: frontendData.teamMembersAvailable ? "ok" : "warn",
		},
		{
			label: "Chat Socket Ready",
			value: chatServiceReady ? "Yes" : "No",
			status: chatServiceReady ? "ok" : "warn",
		},
	]);

	state.printStatus();

	console.log(`
${"\x1b[32m"}╔═══════════════════════════════════════════════════════════╗${"\x1b[0m"}
${"\x1b[32m"}║${"\x1b[0m"}  ${"\x1b[1m"}Development environment is ready!${"\x1b[0m"}                     ${"\x1b[32m"}║${"\x1b[0m"}
${"\x1b[32m"}╠═══════════════════════════════════════════════════════════╣${"\x1b[0m"}
${"\x1b[32m"}║${"\x1b[0m"}  API:      ${"\x1b[36m"}http://localhost:${apiPort}${"\x1b[0m"}                       ${"\x1b[32m"}║${"\x1b[0m"}
${"\x1b[32m"}║${"\x1b[0m"}  Frontend: ${"\x1b[36m"}http://localhost:${webPort}${"\x1b[0m"}                       ${"\x1b[32m"}║${"\x1b[0m"}
${"\x1b[32m"}║${"\x1b[0m"}  Socket.IO: ${"\x1b[36m"}http://localhost:${socketPort}${"\x1b[0m"}                      ${"\x1b[32m"}║${"\x1b[0m"}
${"\x1b[32m"}║${"\x1b[0m"}  Notifications: ${"\x1b[36m"}http://localhost:${notificationPort}${"\x1b[0m"}                  ${"\x1b[32m"}║${"\x1b[0m"}
${"\x1b[32m"}║${"\x1b[0m"}  Chat Service: ${"\x1b[36m"}http://localhost:${chatPort}${"\x1b[0m"}                  ${"\x1b[32m"}║${"\x1b[0m"}
${"\x1b[32m"}╠═══════════════════════════════════════════════════════════╣${"\x1b[0m"}
${"\x1b[32m"}║${"\x1b[0m"}  ${chatServiceReady ? "✓" : "⚠"} Chat Socket: ${"\x1b[36m"}http://localhost:${chatPort}/socket/teamchat${"\x1b[0m"}  ${"\x1b[32m"}║${"\x1b[0m"}
${"\x1b[32m"}╠═══════════════════════════════════════════════════════════╣${"\x1b[0m"}
${"\x1b[32m"}║${"\x1b[0m"}  Press ${"\x1b[1m"}Ctrl+C${"\x1b[0m"} to stop all services                    ${"\x1b[32m"}║${"\x1b[0m"}
${"\x1b[32m"}╚═══════════════════════════════════════════════════════════╝${"\x1b[0m"}
`);

	// Keep script running - don't exit
	logger.info("All services are running. Logs will continue below...");
	logger.info("Press Ctrl+C to stop all services");
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
	const opts = parseArgs();

	if (opts.help) {
		printHelp();
		process.exit(0);
	}

	try {
		if (opts.docker && !opts.local) {
			await runDockerWorkflow();
		} else {
			await runLocalWorkflow(opts);
		}
	} catch (error) {
		logger.error(
			`Setup failed: ${error instanceof Error ? error.message : String(error)}`,
		);
		await shutdown(1);
	}
}

// Start
main();
