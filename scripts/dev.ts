#!/usr/bin/env bun

import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = join(rootDir, "apps", "api");
const dashboardDir = join(rootDir, "apps", "dashboard");

const trackedChildren = new Set<import("node:child_process").ChildProcess>();

function terminateChildren() {
  for (const child of trackedChildren) {
    child.removeAllListeners();
    child.kill("SIGTERM");
  }
}

process.on("SIGINT", () => {
  terminateChildren();
  process.exit(0);
});

process.on("SIGTERM", () => {
  terminateChildren();
  process.exit(0);
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
        console.log(`[setup] Port ${port} (${label}) je zauzet. Pokušavam da ugasim procese...`);
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

async function runCommand(command: string, args: string[], cwd: string) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      env: { ...process.env }
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} se završio sa kodom ${code}`));
      }
    });
  });
}

function spawnDevProcess(name: string, command: string, args: string[], cwd: string) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env },
    stdio: ["inherit", "pipe", "pipe"]
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

async function main() {
  try {
    console.log("[setup] Proveravam portove...");
    await ensurePortFree(4000, "API (Fastify)");
    await ensurePortFree(3000, "Frontend (Next.js)");

    console.log("[setup] Pokrećem migracije...");
    await runCommand("bun", ["run", "db:migrate"], apiDir);

    console.log("[setup] Pokrećem seed...");
    await runCommand("bun", ["run", "db:seed"], apiDir);

    console.log("[setup] Startujem API i Dashboard...");
    spawnDevProcess("api", "bun", ["run", "dev"], apiDir);
    spawnDevProcess("web", "bun", ["run", "dev"], dashboardDir);

    console.log(`
Sve spremno!
  • API    → http://localhost:4000
  • Front → http://localhost:3000

Zaustavi okruženje pritiskom na Ctrl+C.
`);
  } catch (error) {
    terminateChildren();
    console.error("[setup] Greška:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

await main();
