-- Safe migration script for project_teams and project_time_entries
-- This script can be run multiple times safely

-- Create project_teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS "project_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"goal" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create project_time_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS "project_time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid,
	"hours" numeric(10, 2) NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add team_id column to project_members if it doesn't exist
DO $$ 
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'project_members' AND column_name = 'team_id'
	) THEN
		ALTER TABLE "project_members" ADD COLUMN "team_id" uuid;
	END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "project_teams_project_idx" ON "project_teams" USING btree ("project_id");
CREATE INDEX IF NOT EXISTS "project_time_entries_project_idx" ON "project_time_entries" USING btree ("project_id");
CREATE INDEX IF NOT EXISTS "project_time_entries_user_idx" ON "project_time_entries" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "project_time_entries_task_idx" ON "project_time_entries" USING btree ("task_id");
CREATE INDEX IF NOT EXISTS "project_time_entries_date_idx" ON "project_time_entries" USING btree ("date");
CREATE INDEX IF NOT EXISTS "project_members_team_idx" ON "project_members" USING btree ("team_id");

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
	-- project_teams foreign keys
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'project_teams_project_id_projects_id_fk'
	) THEN
		ALTER TABLE "project_teams" ADD CONSTRAINT "project_teams_project_id_projects_id_fk" 
			FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	-- project_time_entries foreign keys
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'project_time_entries_project_id_projects_id_fk'
	) THEN
		ALTER TABLE "project_time_entries" ADD CONSTRAINT "project_time_entries_project_id_projects_id_fk" 
			FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'project_time_entries_user_id_users_id_fk'
	) THEN
		ALTER TABLE "project_time_entries" ADD CONSTRAINT "project_time_entries_user_id_users_id_fk" 
			FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'project_time_entries_task_id_project_tasks_id_fk'
	) THEN
		ALTER TABLE "project_time_entries" ADD CONSTRAINT "project_time_entries_task_id_project_tasks_id_fk" 
			FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE set null ON UPDATE no action;
	END IF;

	-- project_members team_id foreign key
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_name = 'project_members_team_id_project_teams_id_fk'
	) THEN
		ALTER TABLE "project_members" ADD CONSTRAINT "project_members_team_id_project_teams_id_fk" 
			FOREIGN KEY ("team_id") REFERENCES "public"."project_teams"("id") ON DELETE set null ON UPDATE no action;
	END IF;
END $$;

