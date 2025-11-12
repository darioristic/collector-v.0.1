import { and, eq } from "drizzle-orm";

import { getDb } from "../apps/dashboard/lib/db";
import { notifications } from "../apps/dashboard/lib/db/schema/core";

async function main() {
	try {
		const db = await getDb();
		const rows = await db
			.select()
			.from(notifications)
			.where(
				and(
					eq(notifications.companyId, "04fb09f6-f197-4714-9891-6dedf64b9791"),
					eq(notifications.recipientId, "c8904bda-33b3-48d8-bd03-f0c9af78da89"),
				),
			)
			.limit(50);
		console.log(JSON.stringify(rows, null, 2));
	} catch (error) {
		console.error("Drizzle query failed:", error);
	}
}

void main();


