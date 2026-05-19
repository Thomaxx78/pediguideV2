CREATE TABLE "formulaires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"child_first_name" text NOT NULL,
	"child_birth_date" text NOT NULL,
	"consultation_reason" text NOT NULL,
	"behavior_changes" json,
	"clinical_signs" json,
	"duration" text NOT NULL,
	"worry_level" text NOT NULL,
	"actions_taken" json,
	"additional_notes" text,
	"status" text DEFAULT 'new'
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"rpps" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"cps_card_url" text,
	"account_status" text DEFAULT 'pending_validation',
	"kyc_status" varchar(50) DEFAULT 'pending',
	"kyc_session_id" varchar(255),
	"kyc_data" jsonb,
	CONSTRAINT "doctors_rpps_unique" UNIQUE("rpps"),
	CONSTRAINT "doctors_email_unique" UNIQUE("email")
);
