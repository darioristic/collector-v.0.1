#!/usr/bin/env -S bun --smol

import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath, URL } from "node:url";

import { config as loadEnv } from "dotenv";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = join(rootDir, "apps", "api");
const dashboardDir = join(rootDir, "apps", "dashboard");

function loadEnvFiles() {
	const candidateFiles = [
		join(rootDir, ".env.local"),
		join(rootDir, ".env"),
		join(apiDir, ".env.local"),
		join(apiDir, ".env"),
		join(apiDir, ".env.test"),
	];

	for (const filePath of candidateFiles) {
		loadEnv({ path: filePath, override: false });
	}
}

loadEnvFiles();

const trackedChildren = new Set<import("node:child_process").ChildProcess>();
const args = process.argv.slice(2);
const dockerMode = args.includes("--docker");
const localMode = args.includes("--local");
const mode = dockerMode ? "docker" : "local";
let dockerServicesStarted = false;
let isShuttingDown = false;

function terminateChildren() {
	for (const child of trackedChildren) {
		child.removeAllListeners();
		child.kill("SIGTERM");
	}
}

async function shutdown(exitCode: number) {
	if (isShuttingDown) {
		return;
	}

	isShuttingDown = true;
	terminateChildren();

	if (dockerServicesStarted) {
		console.log("[docker] Zaustavljam compose okruženje...");
		try {
			await runCommand(
				"docker",
				["compose", "down", "--remove-orphans"],
				rootDir,
			);
		} catch (error) {
			console.error(
				"[docker] Greška pri gašenju:",
				error instanceof Error ? error.message : error,
			);
		}
	}

	process.exit(exitCode);
}

process.on("SIGINT", () => {
	void shutdown(0);
});

process.on("SIGTERM", () => {
	void shutdown(0);
});

async function killProcessesOnPort(port: number) {
	const pids = await new Promise<number[]>((resolve, reject) => {
		const lsof = spawn("lsof", ["-t", `-i:${port}`]);
		const output: Buffer[] = [];

		lsof.stdout?.on("data", (chunk) => output.push(chunk));
		lsof.stderr?.on("data", (chunk) => output.push(chunk));

		lsof.once("error", (error) => {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				resolve([]);
			} else {
				reject(error);
			}
		});

		lsof.once("close", (code) => {
			if (code !== 0 && output.length === 0) {
				resolve([]);
				return;
			}

			const pids = output
				.join("\n")
				.split(/\s+/)
				.map((value) => value.trim())
				.filter(Boolean)
				.map((value) => Number.parseInt(value, 10))
				.filter((value) => Number.isFinite(value));

			resolve(pids);
		});
	});

	for (const pid of pids) {
		try {
			process.kill(pid, "SIGTERM");
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ESRCH") {
				throw error;
			}
		}
	}

	if (pids.length > 0) {
		await new Promise((resolve) => setTimeout(resolve, 500));

		for (const pid of pids) {
			try {
				process.kill(pid, "SIGKILL");
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code !== "ESRCH") {
					throw error;
				}
			}
		}
	}
}

async function ensurePortFree(port: number, label: string) {
	await new Promise<void>((resolve, reject) => {
		const tester = createServer();

		tester.once("error", async (error: NodeJS.ErrnoException) => {
			if (error.code === "EADDRINUSE") {
				console.log(
					`[setup] Port ${port} (${label}) je zauzet. Pokušavam da ugasim procese...`,
				);
				try {
					await killProcessesOnPort(port);
					tester.close(() => resolve());
				} catch (killError) {
					reject(killError);
				}
			} else {
				reject(error);
			}
		});

		tester.listen(port, "0.0.0.0", () => {
			tester.close(() => resolve());
		});
	});
}

type CommandResult = {
	stdout: string;
	stderr: string;
};

async function runCommand(
	command: string,
	commandArgs: string[],
	cwd: string,
	options: { print?: boolean; env?: NodeJS.ProcessEnv } = {},
): Promise<CommandResult> {
	const shouldPrint = options.print ?? true;

	return await new Promise<CommandResult>((resolve, reject) => {
		let stdout = "";
		let stderr = "";

		const child = spawn(command, commandArgs, {
			cwd,
			stdio: ["inherit", "pipe", "pipe"],
			env: { ...process.env, ...options.env },
		});

		if (shouldPrint) {
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
					new Error(
						`${command} ${commandArgs.join(" ")} se završio sa kodom ${code}\n${stderr || stdout}`,
					),
				);
			}
		});
	});
}

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
		throw new Error("DATABASE_URL mora sadržati naziv baze (pathname).");
	}

	const adminUrl = new URL(parsed);
	adminUrl.pathname = "/postgres";

	return {
		database,
		adminConnectionString: adminUrl.toString(),
	};
}

async function ensureDatabaseExists(connectionString: string) {
	const { database, adminConnectionString } = parseDatabaseUrl(connectionString);

	const sanitizedName = database.replace(/"/g, '""');
	const checkQuery = `SELECT 1 FROM pg_database WHERE datname='${sanitizedName.replace(/'/g, "''")}'`;

	let exists = false;
	try {
		const result = await runCommand(
			"psql",
			["--dbname", adminConnectionString, "-tAc", checkQuery],
			rootDir,
			{ print: false },
		);
		exists = result.stdout.trim() === "1";
	} catch (error) {
		throw new Error(
			`Ne mogu da proverim postojanje baze. Proveri kredencijale za ${adminConnectionString}.\n${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}

	if (exists) {
		return;
	}

	console.log(`[setup] Kreiram bazu ${database}...`);
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
	} catch (error) {
		throw new Error(
			`Ne mogu da kreiram bazu ${database}. Uveri se da korisnik ima dozvolu.\n${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}
}

function spawnDevProcess(
	name: string,
	command: string,
	args: string[],
	cwd: string,
	envOverrides: NodeJS.ProcessEnv = {},
) {
	const child = spawn(command, args, {
		cwd,
		env: { ...process.env, ...envOverrides },
		stdio: ["inherit", "pipe", "pipe"],
	});

	trackedChildren.add(child);

	const prefix = `[${name}]`;

	child.stdout?.on("data", (data) => {
		process.stdout.write(`${prefix} ${data}`);
	});

	child.stderr?.on("data", (data) => {
		process.stderr.write(`${prefix} ${data}`);
	});

	child.once("exit", (code) => {
		trackedChildren.delete(child);
		if (code !== 0) {
			console.error(`${prefix} proces je završio sa kodom ${code}`);
			terminateChildren();
			process.exit(code ?? 1);
		}
	});
}

type ComposeStatus = Array<{
	Service?: string;
	State?: string;
	Status?: string;
	Health?: string;
}>;

async function ensureDockerAvailable() {
	try {
		await runCommand("docker", ["compose", "version"], rootDir, {
			print: false,
		});
	} catch {
		throw new Error(
			"Docker Compose nije dostupan. Instaliraj ga ili koristi lokalni režim sa opcijom --local.",
		);
	}
}

async function getComposeStatus(): Promise<ComposeStatus> {
	const { stdout } = await runCommand(
		"docker",
		["compose", "ps", "--format", "json"],
		rootDir,
		{ print: false },
	);
	const trimmed = stdout.trim();

	if (!trimmed) {
		return [];
	}

	try {
		return JSON.parse(trimmed);
	} catch {
		const lines = trimmed
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);

		const parsed: ComposeStatus = [];

		for (const line of lines) {
			try {
				parsed.push(JSON.parse(line));
			} catch {
				// ignore malformed lines
			}
		}

		return parsed;
	}
}

async function showLogs(service: string, tail = 200) {
	console.log(`[docker] Poslednjih ${tail} log linija za ${service}:`);
	await runCommand(
		"docker",
		["compose", "logs", "--no-color", "--tail", String(tail), service],
		rootDir,
	);
}

async function waitForService(service: string, timeoutMs = 60_000) {
	const start = Date.now();

	while (Date.now() - start < timeoutMs) {
		const statusList = await getComposeStatus();
		const status = statusList.find((entry) => entry.Service === service);

		if (!status) {
			await delay(2_000);
			continue;
		}

		if (status.State === "running" || status.State === "healthy") {
			return;
		}

		if (
			status.State === "exited" ||
			status.State === "dead" ||
			status.Status?.toLowerCase().includes("exit")
		) {
			await showLogs(service);
			throw new Error(
				`Servis ${service} je prekinut (${status.Status ?? status.State}).`,
			);
		}

		await delay(2_000);
	}

	await showLogs(service);
	throw new Error(
		`Servis ${service} nije postao spreman u roku od ${timeoutMs / 1000}s.`,
	);
}

async function runDockerWorkflow() {
	await ensureDockerAvailable();

	console.log("[docker] Pokrećem infrastrukturu (postgres, redis)...");
	await runCommand(
		"docker",
		["compose", "up", "-d", "postgres", "redis"],
		rootDir,
	);
	dockerServicesStarted = true;

	await waitForService("postgres");
	await waitForService("redis");

	console.log("[docker] Gradim API sliku...");
	await runCommand("docker", ["compose", "build", "api"], rootDir);

	console.log("[docker] Startujem API kontejner i migracije...");
	await runCommand("docker", ["compose", "up", "-d", "api"], rootDir);

	await waitForService("api");

	console.log(
		"[docker] Kontejneri su spremni. Pratim logove (Ctrl+C za izlaz).",
	);
	spawnDevProcess(
		"docker",
		"docker",
		["compose", "logs", "-f", "postgres", "redis", "api"],
		rootDir,
	);
}

async function runLocalWorkflow() {
	const connectionString = resolveDatabaseUrl();

	await ensureDatabaseExists(connectionString);

	const apiPort = Number(process.env.API_PORT ?? 4000);
	let webPort = Number(process.env.WEB_PORT ?? process.env.PORT ?? 3000);

	if (apiPort === webPort) {
		const fallbackWebPort = apiPort === 3000 ? 3001 : 3000;
		console.warn(
			`[setup] API i Frontend dele isti port ${apiPort}. Frontend prebacujem na ${fallbackWebPort}.`,
		);
		webPort = fallbackWebPort;
		process.env.WEB_PORT = String(fallbackWebPort);
	}

	console.log("[setup] Proveravam portove...");
	await ensurePortFree(apiPort, "API (Fastify)");
	await ensurePortFree(webPort, "Frontend (Next.js)");

	console.log("[setup] Pokrećem migracije...");
	await runCommand("bun", ["run", "db:migrate"], apiDir);

	console.log("[setup] Pokrećem seed...");
	await runCommand("bun", ["run", "db:seed"], apiDir);

	console.log("[setup] Startujem API i Dashboard...");
	spawnDevProcess("api", "bun", ["run", "dev"], apiDir, {
		PORT: String(apiPort),
		API_PORT: String(apiPort),
	});
	spawnDevProcess("web", "bun", ["run", "dev"], dashboardDir, {
		PORT: String(webPort),
		WEB_PORT: String(webPort),
	});

	console.log(`
Sve spremno!
  • API    → http://localhost:4000
  • Front → http://localhost:3000

Zaustavi okruženje pritiskom na Ctrl+C.
`);
}

async function main() {
	if (mode === "docker" && !localMode) {
		await runDockerWorkflow();
		return;
	}

	await runLocalWorkflow();
}

try {
	await main();
} catch (error) {
	console.error(
		"[setup] Greška:",
		error instanceof Error ? error.message : error,
	);
	await shutdown(1);
}
