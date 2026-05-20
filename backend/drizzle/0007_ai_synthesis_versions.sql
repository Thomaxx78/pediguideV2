CREATE TABLE "ai_synthesis_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "diagnosis_id" uuid NOT NULL,
  "version" integer NOT NULL,
  "synthesis" jsonb NOT NULL,
  "model" text NOT NULL,
  "prompt_version" text NOT NULL,
  "generated_by_doctor_id" uuid,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "ai_synthesis_versions_diagnosis_version_unique" UNIQUE("diagnosis_id", "version")
);
--> statement-breakpoint
ALTER TABLE "ai_synthesis_versions" ADD CONSTRAINT "ai_synthesis_versions_diagnosis_id_formulaires_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."formulaires"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ai_synthesis_versions" ADD CONSTRAINT "ai_synthesis_versions_generated_by_doctor_id_doctors_id_fk" FOREIGN KEY ("generated_by_doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "ai_synthesis_versions" (
  "diagnosis_id",
  "version",
  "synthesis",
  "model",
  "prompt_version",
  "generated_by_doctor_id",
  "created_at"
)
SELECT
  "id",
  1,
  "ai_synthesis",
  'llama-3.3-70b-versatile',
  '2026-05-20-v1',
  "doctor_id",
  COALESCE("created_at", now())
FROM "formulaires"
WHERE "ai_synthesis" IS NOT NULL;
