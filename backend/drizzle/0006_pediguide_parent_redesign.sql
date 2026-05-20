ALTER TABLE "formulaires" ALTER COLUMN "child_first_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "formulaires" ALTER COLUMN "child_last_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "formulaires" ALTER COLUMN "child_birth_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "formulaires" ALTER COLUMN "consultation_reason" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "formulaires" ALTER COLUMN "duration" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "formulaires" ALTER COLUMN "worry_level" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "weight" text;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "height" text;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "symptoms" jsonb;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "symptom_other" text;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "symptom_timeline" jsonb;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "symptom_severity" jsonb;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "allergies" jsonb;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "no_allergies" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "treatments" text;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "antecedents" jsonb;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "no_antecedents" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "vaccinations" text;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "worry" text;--> statement-breakpoint
ALTER TABLE "formulaires" ADD COLUMN "photo_name" text;