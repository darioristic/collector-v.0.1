CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "message" text NOT NULL,
  "type" text NOT NULL DEFAULT 'info',
  "link" text,
  "read" boolean NOT NULL DEFAULT false,
  "recipient_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_recipient_id_fk"
  FOREIGN KEY ("recipient_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_company_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE CASCADE;

CREATE INDEX "notifications_recipient_idx" ON "notifications" ("recipient_id");
CREATE INDEX "notifications_company_idx" ON "notifications" ("company_id");
CREATE INDEX "notifications_read_idx" ON "notifications" ("read");
CREATE INDEX "notifications_created_at_idx" ON "notifications" ("created_at");

