#!/usr/bin/env bun

/**
 * Script to update Collector Labs account with registration number and address
 * 
 * Usage:
 *   bun run apps/api/src/db/scripts/update-collector-labs.ts
 */

import { db, pgClient } from "../index";
import { accounts } from "../schema/accounts.schema";
import { accountAddresses } from "../schema/accounts.schema";
import { eq, and } from "drizzle-orm";

async function updateCollectorLabs() {
  console.log("Updating Collector Labs...");

  try {
    await db.transaction(async (tx) => {
      // Update registration number
      const _updateResult = await tx
        .update(accounts)
        .set({
          registrationNumber: "123456/2024",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(accounts.name, "Collector Labs"),
            eq(accounts.email, "info@collectorlabs.test")
          )
        );

      console.log("✓ Updated registration number for Collector Labs");

      // Get Collector Labs account ID
      const [collectorLabs] = await tx
        .select({ id: accounts.id })
        .from(accounts)
        .where(
          and(
            eq(accounts.name, "Collector Labs"),
            eq(accounts.email, "info@collectorlabs.test")
          )
        )
        .limit(1);

      if (!collectorLabs) {
        console.error("✗ Collector Labs account not found!");
        return;
      }

      // Check if primary address exists
      const [existingAddress] = await tx
        .select()
        .from(accountAddresses)
        .where(
          and(
            eq(accountAddresses.accountId, collectorLabs.id),
            eq(accountAddresses.label, "primary")
          )
        )
        .limit(1);

      if (existingAddress) {
        // Update existing address
        await tx
          .update(accountAddresses)
          .set({
            street: "Bulevar kralja Aleksandra 1",
            city: "Beograd",
            state: "Srbija",
            postalCode: "11000",
            country: "RS",
          })
          .where(eq(accountAddresses.id, existingAddress.id));

        console.log("✓ Updated existing primary address for Collector Labs");
      } else {
        // Insert new primary address
        await tx.insert(accountAddresses).values({
          id: "00000000-0000-0000-0000-000000001000",
          accountId: collectorLabs.id,
          label: "primary",
          street: "Bulevar kralja Aleksandra 1",
          city: "Beograd",
          state: "Srbija",
          postalCode: "11000",
          country: "RS",
          createdAt: new Date(),
        });

        console.log("✓ Created primary address for Collector Labs");
      }
    });

    console.log("✅ Successfully updated Collector Labs!");
  } catch (error) {
    console.error("✗ Error updating Collector Labs:", error);
    process.exit(1);
  } finally {
    const clientWithEnd = pgClient as { end?: (...args: unknown[]) => unknown };
    if (typeof clientWithEnd.end === "function") {
      const result = clientWithEnd.end();
      if (
        result &&
        typeof (result as Promise<unknown>).then === "function"
      ) {
        await (result as Promise<unknown>);
      }
    }
    process.exit(0);
  }
}

updateCollectorLabs();

