CREATE TABLE "children" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"nir" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"birth_date" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "form_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"questions" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "patient_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"form_template_id" uuid,
	"patient_token" text NOT NULL,
	"patient_email" text,
	"patient_first_name" text,
	"expires_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "patient_sessions_patient_token_unique" UNIQUE("patient_token")
);
--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "ai_synthesis" jsonb;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "doctor_id" uuid;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "custom_answers" jsonb;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "form_template_id" uuid;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "child_id" uuid;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "nir" text;--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_templates" ADD CONSTRAINT "form_templates_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_sessions" ADD CONSTRAINT "patient_sessions_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_sessions" ADD CONSTRAINT "patient_sessions_form_template_id_form_templates_id_fk" FOREIGN KEY ("form_template_id") REFERENCES "public"."form_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formulaires" ADD CONSTRAINT "formulaires_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formulaires" ADD CONSTRAINT "formulaires_session_id_patient_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."patient_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formulaires" ADD CONSTRAINT "formulaires_form_template_id_form_templates_id_fk" FOREIGN KEY ("form_template_id") REFERENCES "public"."form_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formulaires" ADD CONSTRAINT "formulaires_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE no action ON UPDATE no action;