-- Create notification_preference_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "public"."notification_preference_type" AS ENUM('invoice', 'payment', 'transaction', 'daily_summary', 'quote', 'deal', 'project', 'task', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_notification_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS "user_notification_preferences" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "notification_type" "notification_preference_type" NOT NULL,
    "email_enabled" boolean DEFAULT true NOT NULL,
    "in_app_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "user_notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "user_notification_preferences_user_type_idx" ON "user_notification_preferences" USING btree ("user_id","notification_type");
CREATE INDEX IF NOT EXISTS "user_notification_preferences_user_idx" ON "user_notification_preferences" USING btree ("user_id");

