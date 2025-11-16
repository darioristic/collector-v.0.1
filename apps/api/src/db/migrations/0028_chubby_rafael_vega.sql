CREATE TYPE "public"."notification_preference_type" AS ENUM('invoice', 'payment', 'transaction', 'daily_summary', 'quote', 'deal', 'project', 'task', 'system');--> statement-breakpoint
CREATE TABLE "account_executives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"email" text,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_type" "notification_preference_type" NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_items" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "invoice_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "notes" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "account_addresses" ADD COLUMN "latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "account_addresses" ADD COLUMN "longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "legal_name" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "registration_number" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "date_of_incorporation" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "industry" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "number_of_employees" integer;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "annual_revenue_range" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "legal_status" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "company_type" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "social_media_links" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "specifications" jsonb;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "total" numeric(14, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "account_executives" ADD CONSTRAINT "account_executives_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_milestones" ADD CONSTRAINT "account_milestones_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_links" ADD CONSTRAINT "invoice_links_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_executives_account_idx" ON "account_executives" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "account_milestones_account_idx" ON "account_milestones" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_links_token_idx" ON "invoice_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invoice_links_invoice_idx" ON "invoice_links" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_links_expires_at_idx" ON "invoice_links" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_notification_preferences_user_type_idx" ON "user_notification_preferences" USING btree ("user_id","notification_type");--> statement-breakpoint
CREATE INDEX "user_notification_preferences_user_idx" ON "user_notification_preferences" USING btree ("user_id");