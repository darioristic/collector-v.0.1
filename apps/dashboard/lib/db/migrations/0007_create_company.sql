CREATE TABLE IF NOT EXISTS "company" (
  "id" serial PRIMARY KEY,
  "owner_id" uuid NOT NULL UNIQUE,
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
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "company"
  ADD CONSTRAINT "company_owner_id_users_fk"
  FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE;

