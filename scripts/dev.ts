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
 */

import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

// ============================================================================
// CONFIGURATION
// ============================================================================

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = join(rootDir, "apps", "api");
const dashboardDir = join(rootDir, "apps", "dashboard");

const DEFAULT_PORTS = {
  api: 4000,
  web: 3000,
  postgres: 5432,
  redis: 6379
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
    console.log(`\n${'\x1b[36m'}▶ ${message}${'\x1b[0m'} ${this.formatTime()}`);
  }

  success(message: string) {
    console.log(`${'\x1b[32m'}✓${'\x1b[0m'} ${message}`);
  }

  error(message: string) {
    console.error(`${'\x1b[31m'}✗${'\x1b[0m'} ${message}`);
  }

  warn(message: string) {
    console.warn(`${'\x1b[33m'}⚠${'\x1b[0m'} ${message}`);
  }

  info(message: string) {
    console.log(`${'\x1b[90m'}ℹ${'\x1b[0m'} ${message}`);
  }

  section(title: string) {
    console.log('\n' + '='.repeat(60));
    console.log(`${'\x1b[1m'}${title}${'\x1b[0m'}`);
    console.log('='.repeat(60));
  }

  subsection(title: string) {
    console.log(`\n${'\x1b[1m'}${title}${'\x1b[0m'}`);
    console.log('-'.repeat(40));
  }

  summary(items: Array<{ label: string; value: string; status?: 'ok' | 'warn' | 'error' }>) {
    console.log('');
    for (const item of items) {
      const statusSymbol = {
        ok: '\x1b[32m●\x1b[0m',
        warn: '\x1b[33m●\x1b[0m',
        error: '\x1b[31m●\x1b[0m'
      }[item.status || 'ok'];

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
  status: 'pending' | 'starting' | 'running' | 'failed';
  port?: number;
  pid?: number;
  startTime?: number;
};

class StateManager {
  services: Map<string, ServiceState> = new Map();
  children: Set<import("node:child_process").ChildProcess> = new Set();
  dockerStarted = false;
  isShuttingDown = false;

  addService(name: string, port?: number): void {
    this.services.set(name, {
      name,
      status: 'pending',
      port,
      startTime: Date.now()
    });
  }

  updateService(name: string, updates: Partial<ServiceState>): void {
    const current = this.services.get(name);
    if (current) {
      this.services.set(name, { ...current, ...updates });
    }
  }

  getStatus(): ServiceState[] {
    return Array.from(this.services.values());
  }

  printStatus(): void {
    logger.subsection('Services Status');
    const items = this.getStatus().map(service => {
      const statusEmoji = {
        pending: '⏳',
        starting: '🔄',
        running: '✅',
        failed: '❌'
      }[service.status];

      const portInfo = service.port ? `:${service.port}` : '';
      const uptimeInfo = service.startTime && service.status === 'running'
        ? ` (${Math.floor((Date.now() - service.startTime) / 1000)}s)`
        : '';

      return {
        label: `${statusEmoji} ${service.name}`,
        value: `${service.status}${portInfo}${uptimeInfo}`,
        status: service.status === 'running' ? 'ok' as const :
                service.status === 'failed' ? 'error' as const :
                'warn' as const
      };
    });

    logger.summary(items);
  }
}

const state = new StateManager();

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
    onlySeed: args.some(arg => arg.startsWith("--only=")),
    skipSeedModules: args.some(arg => arg.startsWith("--skip=")),
    verbose: args.includes("--verbose") || args.includes("-v"),
    help: args.includes("--help") || args.includes("-h")
  };
}

function printHelp() {
  console.log(`
${'\x1b[1m'}Development Environment Manager${'\x1b[0m'}

Usage: bun run dev [options]

Modes:
  --docker          Use Docker Compose for infrastructure
  --local           Use local PostgreSQL/Redis (default)

Seeding Options:
  --skip-seed       Skip database seeding
  --quick           Quick start (skip seed if data exists)
  --only=<modules>  Seed only specific modules (comma-separated)
                    Example: --only=auth,accounts
  --skip=<modules>  Skip specific seed modules (comma-separated)
                    Example: --skip=crm,projects

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
  options: { print?: boolean; env?: NodeJS.ProcessEnv } = {}
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";

    const child = spawn(command, args, {
      cwd,
      stdio: ["inherit", "pipe", "pipe"],
      env: { ...process.env, ...options.env }
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
      child.stdout?.on("data", (data) => { stdout += data.toString(); });
      child.stderr?.on("data", (data) => { stderr += data.toString(); });
    }

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${command} exited with code ${code}\n${stderr || stdout}`));
      }
    });
  });
}

async function killProcessOnPort(port: number): Promise<void> {
  try {
    const { stdout } = await runCommand("lsof", ["-t", `-i:${port}`], rootDir, { print: false });
    const pids = stdout.trim().split('\n').filter(Boolean);

    for (const pid of pids) {
      try {
        process.kill(parseInt(pid), "SIGTERM");
        logger.info(`Killed process ${pid} on port ${port}`);
      } catch (error) {
        // Process might already be dead
      }
    }

    if (pids.length > 0) {
      await delay(500);
    }
  } catch (error) {
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

  const fallback = "postgres://postgres:postgres@localhost:5432/collector_dashboard";
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
    port: parsed.port || '5432',
    adminConnectionString: adminUrl.toString()
  };
}

async function checkDatabaseExists(connectionString: string): Promise<boolean> {
  const { database, adminConnectionString } = parseDatabaseUrl(connectionString);
  const sanitizedName = database.replace(/'/g, "''");
  const checkQuery = `SELECT 1 FROM pg_database WHERE datname='${sanitizedName}'`;

  try {
    const result = await runCommand(
      "psql",
      ["--dbname", adminConnectionString, "-tAc", checkQuery],
      rootDir,
      { print: false }
    );
    return result.stdout.trim() === "1";
  } catch {
    return false;
  }
}

async function checkDatabaseHasData(connectionString: string): Promise<boolean> {
  const { database } = parseDatabaseUrl(connectionString);

  try {
    // Check if there are any user tables
    const result = await runCommand(
      "psql",
      [
        "--dbname", connectionString,
        "-tAc",
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
      ],
      rootDir,
      { print: false }
    );

    const tableCount = parseInt(result.stdout.trim());
    return tableCount > 0;
  } catch {
    return false;
  }
}

async function ensureDatabaseExists(connectionString: string): Promise<void> {
  const { database, adminConnectionString } = parseDatabaseUrl(connectionString);

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
        "--dbname", adminConnectionString,
        "-c", `CREATE DATABASE "${sanitizedName}" WITH ENCODING='UTF8'`
      ],
      rootDir
    );

    logger.success(`Database "${database}" created`);
  } catch (error) {
    throw new Error(
      `Failed to create database "${database}". Make sure PostgreSQL is running and user has CREATE DATABASE permission.\n${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function runMigrations(): Promise<void> {
  logger.step("Running database migrations...");

  try {
    await runCommand("bun", ["run", "db:push"], apiDir);
    logger.success("Migrations completed");
  } catch (error) {
    throw new Error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function runSeed(options: { only?: string; skip?: string }): Promise<void> {
  logger.step("Seeding database...");

  const seedArgs = ["run", "db:seed"];

  if (options.only) {
    seedArgs.push(`--only=${options.only}`);
  }

  if (options.skip) {
    seedArgs.push(`--skip=${options.skip}`);
  }

  try {
    await runCommand("bun", seedArgs, apiDir);
    logger.success("Database seeded");
  } catch (error) {
    throw new Error(`Seeding failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ============================================================================
// DOCKER
// ============================================================================

async function checkDockerAvailable(): Promise<boolean> {
  try {
    await runCommand("docker", ["compose", "version"], rootDir, { print: false });
    return true;
  } catch {
    return false;
  }
}

async function getDockerComposeStatus(): Promise<Array<{ Service?: string; State?: string; Health?: string }>> {
  try {
    const { stdout } = await runCommand(
      "docker",
      ["compose", "ps", "--format", "json"],
      rootDir,
      { print: false }
    );

    const trimmed = stdout.trim();
    if (!trimmed) return [];

    try {
      return JSON.parse(trimmed);
    } catch {
      // Handle line-delimited JSON
      const lines = trimmed.split("\n").filter(Boolean);
      return lines.map(line => {
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

async function waitForDockerService(service: string, timeoutMs = 60000): Promise<void> {
  const start = Date.now();

  logger.info(`Waiting for ${service} to be ready...`);

  while (Date.now() - start < timeoutMs) {
    const status = await getDockerComposeStatus();
    const serviceStatus = status.find(s => s.Service === service);

    if (serviceStatus?.State === 'running' || serviceStatus?.Health === 'healthy') {
      logger.success(`${service} is ready`);
      return;
    }

    if (serviceStatus?.State === 'exited' || serviceStatus?.State === 'dead') {
      throw new Error(`${service} failed to start`);
    }

    await delay(2000);
  }

  throw new Error(`${service} did not become ready within ${timeoutMs / 1000}s`);
}

// ============================================================================
// PROCESS MANAGEMENT
// ============================================================================

function spawnDevProcess(
  name: string,
  command: string,
  args: string[],
  cwd: string,
  envOverrides: NodeJS.ProcessEnv = {}
): void {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...envOverrides },
    stdio: ["inherit", "pipe", "pipe"]
  });

  state.children.add(child);
  state.updateService(name, { status: 'starting' });

  const prefix = `[\x1b[35m${name}\x1b[0m]`;

  child.stdout?.on("data", (data) => {
    // Check for successful start indicators
    const output = data.toString();
    if (output.includes("ready") || output.includes("listening") || output.includes("started")) {
      state.updateService(name, { status: 'running' });
    }
    process.stdout.write(`${prefix} ${data}`);
  });

  child.stderr?.on("data", (data) => {
    process.stderr.write(`${prefix} ${data}`);
  });

  child.once("exit", (code) => {
    state.children.delete(child);
    state.updateService(name, { status: 'failed' });

    if (code !== 0) {
      logger.error(`${name} exited with code ${code}`);
      shutdown(code ?? 1);
    }
  });

  // Mark as running after a delay (assume successful start)
  setTimeout(() => {
    if (state.services.get(name)?.status === 'starting') {
      state.updateService(name, { status: 'running' });
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
      await runCommand("docker", ["compose", "down", "--remove-orphans"], rootDir);
      logger.success("Docker services stopped");
    } catch (error) {
      logger.error(`Failed to stop Docker: ${error instanceof Error ? error.message : String(error)}`);
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
    throw new Error("Docker Compose is not available. Install it or use --local mode.");
  }

  logger.step("Starting infrastructure (PostgreSQL, Redis)...");
  await runCommand("docker", ["compose", "up", "-d", "postgres", "redis"], rootDir);
  state.dockerStarted = true;

  await waitForDockerService("postgres");
  await waitForDockerService("redis");

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
    rootDir
  );
}

async function runLocalWorkflow(opts: ReturnType<typeof parseArgs>): Promise<void> {
  logger.section("Local Development Workflow");

  // Environment setup
  loadEnvFiles();
  const connectionString = resolveDatabaseUrl();
  const { database, host, port } = parseDatabaseUrl(connectionString);

  logger.summary([
    { label: 'Database', value: database },
    { label: 'Host', value: `${host}:${port}` },
    { label: 'Mode', value: 'Local' }
  ]);

  // Check ports
  const apiPort = Number(process.env.API_PORT ?? DEFAULT_PORTS.api);
  let webPort = Number(process.env.WEB_PORT ?? process.env.PORT ?? DEFAULT_PORTS.web);

  if (apiPort === webPort) {
    const fallback = apiPort === 3000 ? 3001 : 3000;
    logger.warn(`API and Web using same port ${apiPort}, moving Web to ${fallback}`);
    webPort = fallback;
    process.env.WEB_PORT = String(fallback);
  }

  state.addService('PostgreSQL', apiPort);
  state.addService('API', apiPort);
  state.addService('Frontend', webPort);

  // Check and free ports
  logger.step("Checking ports...");
  await ensurePortFree(apiPort, "API");
  await ensurePortFree(webPort, "Frontend");

  // Database setup
  logger.step("Setting up database...");
  await ensureDatabaseExists(connectionString);

  const hasData = await checkDatabaseHasData(connectionString);

  if (hasData && opts.quick) {
    logger.info("Database has data, skipping migrations and seed (quick mode)");
  } else {
    await runMigrations();

    if (!opts.skipSeed) {
      const seedOpts: { only?: string; skip?: string } = {};

      // Parse --only and --skip arguments
      for (const arg of process.argv.slice(2)) {
        if (arg.startsWith("--only=")) {
          seedOpts.only = arg.split("=")[1];
        }
        if (arg.startsWith("--skip=")) {
          seedOpts.skip = arg.split("=")[1];
        }
      }

      await runSeed(seedOpts);
    } else {
      logger.info("Skipping database seed (--skip-seed)");
    }
  }

  // Start services
  logger.step("Starting development servers...");

  spawnDevProcess("api", "bun", ["run", "dev"], apiDir, {
    PORT: String(apiPort),
    API_PORT: String(apiPort)
  });

  spawnDevProcess("web", "bun", ["run", "dev"], dashboardDir, {
    PORT: String(webPort),
    WEB_PORT: String(webPort)
  });

  // Wait a bit for services to start
  await delay(2000);

  // Print final status
  logger.section("Development Environment Ready");

  logger.summary([
    { label: 'API Server', value: `http://localhost:${apiPort}`, status: 'ok' },
    { label: 'Frontend', value: `http://localhost:${webPort}`, status: 'ok' },
    { label: 'Database', value: database, status: 'ok' }
  ]);

  state.printStatus();

  console.log(`
${'\x1b[32m'}╔═══════════════════════════════════════════════════════════╗${'\x1b[0m'}
${'\x1b[32m'}║${'\x1b[0m'}  ${'\x1b[1m'}Development environment is ready!${'\x1b[0m'}                     ${'\x1b[32m'}║${'\x1b[0m'}
${'\x1b[32m'}╠═══════════════════════════════════════════════════════════╣${'\x1b[0m'}
${'\x1b[32m'}║${'\x1b[0m'}  API:      ${'\x1b[36m'}http://localhost:${apiPort}${'\x1b[0m'}                       ${'\x1b[32m'}║${'\x1b[0m'}
${'\x1b[32m'}║${'\x1b[0m'}  Frontend: ${'\x1b[36m'}http://localhost:${webPort}${'\x1b[0m'}                       ${'\x1b[32m'}║${'\x1b[0m'}
${'\x1b[32m'}╠═══════════════════════════════════════════════════════════╣${'\x1b[0m'}
${'\x1b[32m'}║${'\x1b[0m'}  Press ${'\x1b[1m'}Ctrl+C${'\x1b[0m'} to stop all services                    ${'\x1b[32m'}║${'\x1b[0m'}
${'\x1b[32m'}╚═══════════════════════════════════════════════════════════╝${'\x1b[0m'}
`);
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
    logger.error(`Setup failed: ${error instanceof Error ? error.message : String(error)}`);
    await shutdown(1);
  }
}

// Start
main();