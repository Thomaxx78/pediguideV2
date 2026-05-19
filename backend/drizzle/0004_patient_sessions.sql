CREATE TABLE "patient_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "doctor_id" uuid NOT NULL REFERENCES "doctors"("id") ON DELETE CASCADE,
  "patient_token" text UNIQUE NOT NULL,
  "patient_email" text,
  "patient_first_name" text,
  "expires_at" timestamptz NOT NULL,
  "status" text DEFAULT 'pending',
  "created_at" timestamp DEFAULT now()
);

ALTER TABLE "formulaires" ADD COLUMN "doctor_id" uuid REFERENCES "doctors"("id");
ALTER TABLE "formulaires" ADD COLUMN "session_id" uuid REFERENCES "patient_sessions"("id");
