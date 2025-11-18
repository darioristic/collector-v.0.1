CREATE TYPE "public"."chat_message_status" AS ENUM('sent', 'delivered', 'read');
CREATE TYPE "public"."chat_message_type" AS ENUM('text', 'file', 'image', 'video', 'sound');
CREATE TYPE "public"."deal_stage" AS ENUM('Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost');
CREATE TYPE "public"."employment_status" AS ENUM('Active', 'On Leave', 'Terminated');
CREATE TYPE "public"."employment_type" AS ENUM('Full-time', 'Contractor', 'Intern');
CREATE TYPE "public"."date_format" AS ENUM('dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd');
CREATE TYPE "public"."invoice_delivery_type" AS ENUM('create', 'create_and_send');
CREATE TYPE "public"."invoice_size" AS ENUM('a4', 'letter');
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'pending', 'overdue', 'paid', 'canceled');
CREATE TYPE "public"."team_member_status" AS ENUM('online', 'offline', 'idle', 'invited');
CREATE TABLE "chat_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id_1" uuid NOT NULL,
	"user_id_2" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"last_message_at" timestamp with time zone,
	"last_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text,
	"type" "chat_message_type" DEFAULT 'text' NOT NULL,
	"status" "chat_message_status" DEFAULT 'sent' NOT NULL,
	"file_url" text,
	"file_metadata" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"domain" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "company" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"legal_name" varchar(255),
	"registration_no" varchar(100),
	"tax_id" varchar(100),
	"industry" varchar(255),
	"employees" integer,
	"street_address" varchar(255),
	"city" varchar(255),
	"zip_code" varchar(50),
	"country" varchar(100),
	"email" varchar(255) NOT NULL,
	"phone" varchar(100),
	"website" varchar(255),
	"logo_url" varchar(255),
	"favicon_url" varchar(255),
	"brand_color" varchar(50),
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_owner_id_unique" UNIQUE("owner_id")
);

CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"link" text,
	"read" boolean DEFAULT false NOT NULL,
	"recipient_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"default_company_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"owner" text NOT NULL,
	"stage" "deal_stage" NOT NULL,
	"value" double precision DEFAULT 0 NOT NULL,
	"close_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"hashed_password" text DEFAULT '' NOT NULL,
	"phone" varchar(50),
	"department" varchar(100),
	"role" varchar(100),
	"employment_type" "employment_type" DEFAULT 'Full-time' NOT NULL,
	"status" "employment_status" DEFAULT 'Active' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"salary" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employees_email_unique" UNIQUE("email")
);

CREATE TABLE "invoice_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"comment" text NOT NULL,
	"mentions" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "invoice_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(100),
	"street_address" varchar(255),
	"city" varchar(255),
	"zip_code" varchar(50),
	"country" varchar(100),
	"tax_id" varchar(100),
	"registration_no" varchar(100),
	"default_payment_terms" integer DEFAULT 30,
	"default_currency" varchar(3) DEFAULT 'USD',
	"total_invoices" integer DEFAULT 0,
	"total_paid" numeric(12, 2) DEFAULT '0',
	"total_outstanding" numeric(12, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "invoice_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"name" varchar(500) NOT NULL,
	"description" text,
	"quantity" numeric(10, 2) NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"vat" numeric(5, 2) DEFAULT '0',
	"tax" numeric(5, 2) DEFAULT '0',
	"discount_rate" numeric(5, 2) DEFAULT '0',
	"line_total" numeric(12, 2) NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" integer NOT NULL,
	"customer_id" uuid,
	"customer_name" varchar(255),
	"invoice_number" varchar(100) NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"issue_date" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"vat_amount" numeric(12, 2) DEFAULT '0',
	"tax_amount" numeric(12, 2) DEFAULT '0',
	"discount_amount" numeric(12, 2) DEFAULT '0',
	"total" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"logo_url" text,
	"size" "invoice_size" DEFAULT 'a4' NOT NULL,
	"include_vat" boolean DEFAULT true,
	"include_tax" boolean DEFAULT false,
	"tax_rate" numeric(5, 2),
	"date_format" date_format DEFAULT 'yyyy-MM-dd' NOT NULL,
	"locale" varchar(10) DEFAULT 'en-US',
	"customer_label" varchar(100) DEFAULT 'To',
	"from_label" varchar(100) DEFAULT 'From',
	"invoice_no_label" varchar(100) DEFAULT 'Invoice No',
	"issue_date_label" varchar(100) DEFAULT 'Issue Date',
	"due_date_label" varchar(100) DEFAULT 'Due Date',
	"description_label" varchar(100) DEFAULT 'Description',
	"price_label" varchar(100) DEFAULT 'Price',
	"quantity_label" varchar(100) DEFAULT 'Quantity',
	"total_label" varchar(100) DEFAULT 'Total',
	"vat_label" varchar(100) DEFAULT 'VAT',
	"tax_label" varchar(100) DEFAULT 'Tax',
	"payment_label" varchar(100) DEFAULT 'Payment Details',
	"note_label" varchar(100) DEFAULT 'Note',
	"from_details" json,
	"customer_details" json,
	"payment_details" json,
	"note_details" json,
	"internal_note" text,
	"token" varchar(255),
	"delivery_type" "invoice_delivery_type" DEFAULT 'create',
	"sent_at" timestamp with time zone,
	"sent_to" text,
	"view_count" integer DEFAULT 0,
	"last_viewed_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "invoices_token_unique" UNIQUE("token")
);

CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(100) NOT NULL,
	"status" "team_member_status" DEFAULT 'offline' NOT NULL,
	"avatar_url" text,
	"company_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "teamchat_channel_members" (
	"channel_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_read_at" timestamp with time zone,
	CONSTRAINT "teamchat_channel_members_pk" PRIMARY KEY("channel_id","user_id")
);

CREATE TABLE "teamchat_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"metadata" text,
	"company_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "teamchat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text,
	"file_url" text,
	"sender_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "teamchat_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"display_name" text,
	"email" text NOT NULL,
	"role" text DEFAULT 'MEMBER' NOT NULL,
	"status" text DEFAULT 'offline' NOT NULL,
	"avatar_url" text,
	"company_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "vault_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"size" bigint NOT NULL,
	"type" varchar(150) NOT NULL,
	"url" text NOT NULL,
	"folder_id" uuid NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "vault_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"parent_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_user_id_1_teamchat_users_id_fk" FOREIGN KEY ("user_id_1") REFERENCES "public"."teamchat_users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_user_id_2_teamchat_users_id_fk" FOREIGN KEY ("user_id_2") REFERENCES "public"."teamchat_users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_teamchat_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."teamchat_users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "company" ADD CONSTRAINT "company_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invoice_comments" ADD CONSTRAINT "invoice_comments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invoice_comments" ADD CONSTRAINT "invoice_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invoice_customers" ADD CONSTRAINT "invoice_customers_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "teamchat_channel_members" ADD CONSTRAINT "teamchat_channel_members_channel_id_teamchat_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."teamchat_channels"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "teamchat_channel_members" ADD CONSTRAINT "teamchat_channel_members_user_id_teamchat_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."teamchat_users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "teamchat_channels" ADD CONSTRAINT "teamchat_channels_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "teamchat_messages" ADD CONSTRAINT "teamchat_messages_sender_id_teamchat_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."teamchat_users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "teamchat_messages" ADD CONSTRAINT "teamchat_messages_channel_id_teamchat_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."teamchat_channels"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "teamchat_users" ADD CONSTRAINT "teamchat_users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "vault_files" ADD CONSTRAINT "vault_files_folder_id_vault_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."vault_folders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "vault_files" ADD CONSTRAINT "vault_files_uploaded_by_teamchat_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."teamchat_users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "vault_folders" ADD CONSTRAINT "vault_folders_created_by_teamchat_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."teamchat_users"("id") ON DELETE set null ON UPDATE no action;
CREATE UNIQUE INDEX "chat_conversations_users_unique" ON "chat_conversations" USING btree ("user_id_1","user_id_2","company_id");
CREATE INDEX "chat_conversations_user1_idx" ON "chat_conversations" USING btree ("user_id_1");
CREATE INDEX "chat_conversations_user2_idx" ON "chat_conversations" USING btree ("user_id_2");
CREATE INDEX "chat_conversations_company_idx" ON "chat_conversations" USING btree ("company_id");
CREATE INDEX "chat_messages_conversation_idx" ON "chat_messages" USING btree ("conversation_id");
CREATE INDEX "chat_messages_sender_idx" ON "chat_messages" USING btree ("sender_id");
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages" USING btree ("created_at");
CREATE INDEX "companies_slug_idx" ON "companies" USING btree ("slug");
CREATE INDEX "notifications_recipient_idx" ON "notifications" USING btree ("recipient_id");
CREATE INDEX "notifications_company_idx" ON "notifications" USING btree ("company_id");
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read");
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");
CREATE INDEX "deals_stage_idx" ON "deals" USING btree ("stage");
CREATE INDEX "deals_owner_idx" ON "deals" USING btree ("owner");
CREATE INDEX "deals_created_idx" ON "deals" USING btree ("created_at");
CREATE INDEX "employees_department_idx" ON "employees" USING btree ("department");
CREATE INDEX "employees_status_idx" ON "employees" USING btree ("status");
CREATE INDEX "employees_employment_type_idx" ON "employees" USING btree ("employment_type");
CREATE INDEX "employees_start_date_idx" ON "employees" USING btree ("start_date");
CREATE INDEX "invoice_comments_invoice_id_idx" ON "invoice_comments" USING btree ("invoice_id");
CREATE INDEX "invoice_comments_user_id_idx" ON "invoice_comments" USING btree ("user_id");
CREATE INDEX "invoice_customers_company_id_idx" ON "invoice_customers" USING btree ("company_id");
CREATE INDEX "invoice_customers_email_idx" ON "invoice_customers" USING btree ("email");
CREATE INDEX "invoice_line_items_invoice_id_idx" ON "invoice_line_items" USING btree ("invoice_id");
CREATE INDEX "invoices_company_id_idx" ON "invoices" USING btree ("company_id");
CREATE INDEX "invoices_customer_id_idx" ON "invoices" USING btree ("customer_id");
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");
CREATE INDEX "invoices_invoice_number_idx" ON "invoices" USING btree ("invoice_number");
CREATE INDEX "invoices_due_date_idx" ON "invoices" USING btree ("due_date");
CREATE INDEX "invoices_token_idx" ON "invoices" USING btree ("token");
CREATE UNIQUE INDEX "team_members_company_email_key" ON "team_members" USING btree ("company_id","email");
CREATE INDEX "team_members_status_idx" ON "team_members" USING btree ("status");
CREATE INDEX "team_members_company_idx" ON "team_members" USING btree ("company_id");
CREATE INDEX "teamchat_channel_members_channel_idx" ON "teamchat_channel_members" USING btree ("channel_id");
CREATE INDEX "teamchat_channel_members_user_idx" ON "teamchat_channel_members" USING btree ("user_id");
CREATE INDEX "teamchat_channels_company_idx" ON "teamchat_channels" USING btree ("company_id");
CREATE INDEX "teamchat_channels_name_idx" ON "teamchat_channels" USING btree ("name");
CREATE INDEX "teamchat_messages_channel_idx" ON "teamchat_messages" USING btree ("channel_id");
CREATE INDEX "teamchat_messages_sender_idx" ON "teamchat_messages" USING btree ("sender_id");
CREATE UNIQUE INDEX "teamchat_users_email_unique" ON "teamchat_users" USING btree ("email");
CREATE INDEX "teamchat_users_company_idx" ON "teamchat_users" USING btree ("company_id");
CREATE INDEX "teamchat_users_status_idx" ON "teamchat_users" USING btree ("status");
CREATE INDEX "vault_files_folder_idx" ON "vault_files" USING btree ("folder_id");
CREATE INDEX "vault_files_uploaded_by_idx" ON "vault_files" USING btree ("uploaded_by");
CREATE INDEX "vault_folders_parent_idx" ON "vault_folders" USING btree ("parent_id");
CREATE INDEX "vault_folders_name_idx" ON "vault_folders" USING btree ("name");
CREATE UNIQUE INDEX "vault_folders_parent_name_idx" ON "vault_folders" USING btree ("parent_id","name");