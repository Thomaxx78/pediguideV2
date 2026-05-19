import { pgTable, unique, uuid, timestamp, text, varchar, jsonb, foreignKey, json, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const doctors = pgTable("doctors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	rpps: text().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	cpsCardUrl: text("cps_card_url"),
	accountStatus: text("account_status").default('pending_validation'),
	kycStatus: varchar("kyc_status", { length: 50 }).default('pending'),
	kycSessionId: varchar("kyc_session_id", { length: 255 }),
	kycData: jsonb("kyc_data"),
}, (table) => [
	unique("doctors_rpps_unique").on(table.rpps),
	unique("doctors_email_unique").on(table.email),
]);

export const patientSessions = pgTable("patient_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	doctorId: uuid("doctor_id").notNull(),
	patientToken: text("patient_token").notNull(),
	patientEmail: text("patient_email"),
	patientFirstName: text("patient_first_name"),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	status: text().default('pending'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	formTemplateId: uuid("form_template_id"),
}, (table) => [
	foreignKey({
			columns: [table.doctorId],
			foreignColumns: [doctors.id],
			name: "patient_sessions_doctor_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.formTemplateId],
			foreignColumns: [formTemplates.id],
			name: "patient_sessions_form_template_id_fkey"
		}),
	unique("patient_sessions_patient_token_key").on(table.patientToken),
]);

export const formulaires = pgTable("formulaires", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	childFirstName: text("child_first_name").notNull(),
	childBirthDate: text("child_birth_date").notNull(),
	consultationReason: text("consultation_reason").notNull(),
	behaviorChanges: json("behavior_changes"),
	clinicalSigns: json("clinical_signs"),
	duration: text().notNull(),
	worryLevel: text("worry_level").notNull(),
	actionsTaken: json("actions_taken"),
	additionalNotes: text("additional_notes"),
	status: text().default('new'),
	childLastName: text("child_last_name").notNull(),
	aiSynthesis: jsonb("ai_synthesis"),
	doctorId: uuid("doctor_id"),
	sessionId: uuid("session_id"),
	customAnswers: jsonb("custom_answers"),
	formTemplateId: uuid("form_template_id"),
}, (table) => [
	foreignKey({
			columns: [table.doctorId],
			foreignColumns: [doctors.id],
			name: "formulaires_doctor_id_fkey"
		}),
	foreignKey({
			columns: [table.formTemplateId],
			foreignColumns: [formTemplates.id],
			name: "formulaires_form_template_id_fkey"
		}),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [patientSessions.id],
			name: "formulaires_session_id_fkey"
		}),
]);

export const formTemplates = pgTable("form_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	doctorId: uuid("doctor_id").notNull(),
	title: text().notNull(),
	description: text(),
	questions: jsonb().default([]).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.doctorId],
			foreignColumns: [doctors.id],
			name: "form_templates_doctor_id_fkey"
		}).onDelete("cascade"),
]);
