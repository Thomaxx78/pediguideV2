DO $$ BEGIN
  CREATE TYPE "question_type" AS ENUM ('short', 'long', 'radio', 'checkbox');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "diagnosis_section" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "diagnosis_id" uuid NOT NULL,
  "title" text,
  "description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "diagnosis_question" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "diagnosis_id" uuid NOT NULL,
  "section_id" uuid,
  "question" text NOT NULL,
  "description" text,
  "type" "question_type" NOT NULL,
  "required" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "diagnosis_question_proposition" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "diagnosis_id" uuid NOT NULL,
  "section_id" uuid,
  "question_id" uuid NOT NULL,
  "proposition" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "response" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "answered_at" timestamp,
  "diagnosis_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "response_to_question" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "response_id" uuid NOT NULL,
  "question_id" uuid NOT NULL,
  "proposition_id" uuid,
  "value" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "diagnosis_question" ADD COLUMN IF NOT EXISTS "required" boolean DEFAULT false;
--> statement-breakpoint
ALTER TABLE "response_to_question" ADD COLUMN IF NOT EXISTS "response_id" uuid;
--> statement-breakpoint
DELETE FROM "response_to_question" WHERE "response_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "response_to_question" ALTER COLUMN "response_id" SET NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "diagnosis_section" ADD CONSTRAINT "diagnosis_section_diagnosis_id_formulaires_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."formulaires"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "diagnosis_question" ADD CONSTRAINT "diagnosis_question_diagnosis_id_formulaires_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."formulaires"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "diagnosis_question" ADD CONSTRAINT "diagnosis_question_section_id_diagnosis_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."diagnosis_section"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "diagnosis_question_proposition" ADD CONSTRAINT "diagnosis_question_proposition_diagnosis_id_formulaires_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."formulaires"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "diagnosis_question_proposition" ADD CONSTRAINT "diagnosis_question_proposition_section_id_diagnosis_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."diagnosis_section"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "diagnosis_question_proposition" ADD CONSTRAINT "diagnosis_question_proposition_question_id_diagnosis_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."diagnosis_question"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "response" ADD CONSTRAINT "response_diagnosis_id_formulaires_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."formulaires"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "response_to_question" ADD CONSTRAINT "response_to_question_response_id_response_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."response"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "response_to_question" ADD CONSTRAINT "response_to_question_question_id_diagnosis_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."diagnosis_question"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "response_to_question" ADD CONSTRAINT "response_to_question_proposition_id_diagnosis_question_proposition_id_fk" FOREIGN KEY ("proposition_id") REFERENCES "public"."diagnosis_question_proposition"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
