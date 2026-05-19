ALTER TABLE "patient_sessions" ADD COLUMN "appointment_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "patient_sessions" ADD COLUMN "reminders_sent" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_sessions" ADD COLUMN "last_reminder_at" timestamp with time zone;