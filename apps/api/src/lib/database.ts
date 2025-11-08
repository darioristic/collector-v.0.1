import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import DatabaseConstructor from "better-sqlite3";
import type { Database } from "better-sqlite3";

let database: Database | undefined;

const resolveDatabasePath = (): string => {
  const configuredPath = process.env.CRM_DB_PATH;

  if (configuredPath?.trim()) {
    return configuredPath;
  }

  const dataDirectory = fileURLToPath(new URL("../../.data", import.meta.url));

  if (!existsSync(dataDirectory)) {
    mkdirSync(dataDirectory, { recursive: true });
  }

  return join(dataDirectory, "crm.sqlite");
};

const ensureDirectory = (path: string) => {
  const directory = dirname(path);

  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
};

const initializeSchema = (db: Database) => {
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      source TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      title TEXT NOT NULL,
      stage TEXT NOT NULL,
      value REAL NOT NULL,
      probability REAL NOT NULL,
      close_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      subject TEXT NOT NULL,
      date TEXT NOT NULL,
      related_to TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_opportunities_account_id ON opportunities(account_id);
    CREATE INDEX IF NOT EXISTS idx_activities_related_to ON activities(related_to);
  `);
};

export const getDatabase = (): Database => {
  if (database) {
    return database;
  }

  const databasePath = resolveDatabasePath();

  ensureDirectory(databasePath);

  database = new DatabaseConstructor(databasePath);
  database.pragma("journal_mode = WAL");

  initializeSchema(database);

  return database;
};


