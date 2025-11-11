ALTER TABLE "vault_folders"
  DROP CONSTRAINT IF EXISTS "vault_folders_created_by_fk";

ALTER TABLE "vault_folders"
  ADD CONSTRAINT "vault_folders_created_by_users_fk"
  FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE SET NULL;

ALTER TABLE "vault_files"
  DROP CONSTRAINT IF EXISTS "vault_files_uploaded_by_fk";

ALTER TABLE "vault_files"
  ADD CONSTRAINT "vault_files_uploaded_by_users_fk"
  FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id") ON DELETE SET NULL;


