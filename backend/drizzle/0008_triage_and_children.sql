CREATE TABLE IF NOT EXISTS "children" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "doctor_id" uuid NOT NULL REFERENCES "doctors"("id") ON DELETE cascade,
  "nir" text NOT NULL,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "birth_date" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN IF NOT EXISTS "child_id" uuid REFERENCES "children"("id");--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN IF NOT EXISTS "nir" text;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN IF NOT EXISTS "triage_level" text;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN IF NOT EXISTS "triage_score" text;
