import { sql } from "drizzle-orm";

import { db, pgClient } from "../src/db/index";

const statements = [
	`CREATE TABLE IF NOT EXISTS client_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    client_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
    type text NOT NULL,
    due_date timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'scheduled',
    priority text NOT NULL DEFAULT 'medium',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );`,
	`CREATE INDEX IF NOT EXISTS client_activities_client_idx ON client_activities(client_id);`,
	`CREATE INDEX IF NOT EXISTS client_activities_assigned_idx ON client_activities(assigned_to);`,
	`CREATE INDEX IF NOT EXISTS client_activities_status_idx ON client_activities(status);`,
	`CREATE INDEX IF NOT EXISTS client_activities_due_idx ON client_activities(due_date);`,
];

async function main() {
	try {
		for (const statement of statements) {
			await db.execute(sql.raw(statement));
		}
		console.log("client_activities table ensured successfully.");
	} catch (error) {
		console.error("Failed to create client_activities table", error);
		process.exitCode = 1;
	} finally {
		await pgClient.end();
	}
}

void main();
