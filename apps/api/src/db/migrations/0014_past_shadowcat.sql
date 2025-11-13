CREATE TYPE "public"."candidate_status" AS ENUM('applied', 'screening', 'interview', 'offer', 'hired', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('scheduled', 'completed', 'cancelled', 'rescheduled');--> statement-breakpoint
CREATE TYPE "public"."interview_type" AS ENUM('phone', 'video', 'onsite', 'technical', 'hr');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "performance_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"review_date" timestamp with time zone NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"reviewer_id" uuid,
	"rating" integer,
	"comments" text,
	"goals" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recruitment_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"position" text NOT NULL,
	"status" "candidate_status" DEFAULT 'applied' NOT NULL,
	"source" text,
	"resume_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recruitment_interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"interviewer_id" uuid,
	"scheduled_at" timestamp with time zone NOT NULL,
	"type" "interview_type" NOT NULL,
	"status" "interview_status" DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"rating" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"goal" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
DROP INDEX "team_members_email_key";--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_interviews" ADD CONSTRAINT "recruitment_interviews_candidate_id_recruitment_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."recruitment_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_interviews" ADD CONSTRAINT "recruitment_interviews_interviewer_id_users_id_fk" FOREIGN KEY ("interviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_teams" ADD CONSTRAINT "project_teams_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_time_entries" ADD CONSTRAINT "project_time_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_time_entries" ADD CONSTRAINT "project_time_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_time_entries" ADD CONSTRAINT "project_time_entries_task_id_project_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "performance_reviews_employee_idx" ON "performance_reviews" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "performance_reviews_reviewer_idx" ON "performance_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "performance_reviews_review_date_idx" ON "performance_reviews" USING btree ("review_date");--> statement-breakpoint
CREATE INDEX "recruitment_candidates_email_idx" ON "recruitment_candidates" USING btree ("email");--> statement-breakpoint
CREATE INDEX "recruitment_candidates_status_idx" ON "recruitment_candidates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recruitment_interviews_candidate_idx" ON "recruitment_interviews" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "recruitment_interviews_interviewer_idx" ON "recruitment_interviews" USING btree ("interviewer_id");--> statement-breakpoint
CREATE INDEX "recruitment_interviews_scheduled_at_idx" ON "recruitment_interviews" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "project_teams_project_idx" ON "project_teams" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_time_entries_project_idx" ON "project_time_entries" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_time_entries_user_idx" ON "project_time_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_time_entries_task_idx" ON "project_time_entries" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "project_time_entries_date_idx" ON "project_time_entries" USING btree ("date");--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_team_id_project_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."project_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_company_email_key" ON "team_members" USING btree ("company_id","email");--> statement-breakpoint
CREATE INDEX "team_members_company_idx" ON "team_members" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "project_members_team_idx" ON "project_members" USING btree ("team_id");