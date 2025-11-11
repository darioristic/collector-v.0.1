import { isNull } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";

import { vaultFolders } from "../schema/vault";

const ROOT_FOLDER_NAMES = ["Clients", "Agreements", "Important", "Sales", "Inbox", "Marketing"] as const;

type VaultSeedResult = {
  skipped: number;
  inserted: number;
};

export async function seedVault(db: PgDatabase<any, any, any>): Promise<VaultSeedResult> {
  const existingFolders = await db
    .select({ name: vaultFolders.name })
    .from(vaultFolders)
    .where(isNull(vaultFolders.parentId));

  const existingNames = new Set(existingFolders.map((folder) => folder.name.toLowerCase()));
  const foldersToInsert = ROOT_FOLDER_NAMES.filter((name) => !existingNames.has(name.toLowerCase()));

  if (foldersToInsert.length === 0) {
    return {
      inserted: 0,
      skipped: ROOT_FOLDER_NAMES.length
    };
  }

  await db
    .insert(vaultFolders)
    .values(
      foldersToInsert.map((name) => ({
        name,
        parentId: null,
        createdBy: null
      }))
    )
    .onConflictDoNothing({
      target: [vaultFolders.parentId, vaultFolders.name]
    });

  return {
    inserted: foldersToInsert.length,
    skipped: ROOT_FOLDER_NAMES.length - foldersToInsert.length
  };
}


