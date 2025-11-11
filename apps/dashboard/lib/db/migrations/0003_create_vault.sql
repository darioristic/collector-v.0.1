CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "vault_folders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(255) NOT NULL,
  "parent_id" uuid,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "vault_folders"
  ADD CONSTRAINT "vault_folders_parent_id_fk"
  FOREIGN KEY ("parent_id") REFERENCES "vault_folders" ("id") ON DELETE CASCADE;

ALTER TABLE "vault_folders"
  ADD CONSTRAINT "vault_folders_created_by_fk"
  FOREIGN KEY ("created_by") REFERENCES "team_members" ("id") ON DELETE SET NULL;

CREATE INDEX "vault_folders_parent_idx" ON "vault_folders" ("parent_id");
CREATE INDEX "vault_folders_name_idx" ON "vault_folders" ("name");
CREATE UNIQUE INDEX "vault_folders_parent_name_idx" ON "vault_folders" ("parent_id", "name");

CREATE TABLE "vault_files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "size" bigint NOT NULL,
  "type" varchar(150) NOT NULL,
  "url" text NOT NULL,
  "folder_id" uuid NOT NULL,
  "uploaded_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "vault_files"
  ADD CONSTRAINT "vault_files_folder_id_fk"
  FOREIGN KEY ("folder_id") REFERENCES "vault_folders" ("id") ON DELETE CASCADE;

ALTER TABLE "vault_files"
  ADD CONSTRAINT "vault_files_uploaded_by_fk"
  FOREIGN KEY ("uploaded_by") REFERENCES "team_members" ("id") ON DELETE SET NULL;

CREATE INDEX "vault_files_folder_idx" ON "vault_files" ("folder_id");
CREATE INDEX "vault_files_uploaded_by_idx" ON "vault_files" ("uploaded_by");


