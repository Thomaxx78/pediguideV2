import { pgTable, unique, uuid, timestamp, text, varchar, jsonb, foreignKey, boolean, json, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const questionType = pgEnum("question_type", ['short', 'long', 'radio', 'checkbox'])


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
	firstName: text("first_name"),
	lastName: text("last_name"),
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
	appointmentAt: timestamp("appointment_at", { withTimezone: true, mode: 'string' }),
	remindersSent: text("reminders_sent").array().default([""]).notNull(),
	lastReminderAt: timestamp("last_reminder_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.doctorId],
			foreignColumns: [doctors.id],
			name: "patient_sessions_doctor_id_doctors_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.formTemplateId],
			foreignColumns: [formTemplates.id],
			name: "patient_sessions_form_template_id_form_templates_id_fk"
		}),
	unique("patient_sessions_patient_token_unique").on(table.patientToken),
]);

export const children = pgTable("children", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	doctorId: uuid("doctor_id").notNull(),
	nir: text().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	birthDate: text("birth_date").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.doctorId],
			foreignColumns: [doctors.id],
			name: "children_doctor_id_doctors_id_fk"
		}).onDelete("cascade"),
]);

export const formTemplates = pgTable("form_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	doctorId: uuid("doctor_id").notNull(),
	title: text().notNull(),
	description: text(),
	questions: jsonb().notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.doctorId],
			foreignColumns: [doctors.id],
			name: "form_templates_doctor_id_doctors_id_fk"
		}).onDelete("cascade"),
]);

export const formulaires = pgTable("formulaires", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	status: text().default('new'),
	aiSynthesis: jsonb("ai_synthesis"),
	doctorId: uuid("doctor_id"),
	sessionId: uuid("session_id"),
	childFirstName: text("child_first_name"),
	childLastName: text("child_last_name"),
	childBirthDate: text("child_birth_date"),
	consultationReason: text("consultation_reason"),
	behaviorChanges: json("behavior_changes"),
	clinicalSigns: json("clinical_signs"),
	duration: text(),
	worryLevel: text("worry_level"),
	actionsTaken: json("actions_taken"),
	additionalNotes: text("additional_notes"),
	weight: text(),
	height: text(),
	gender: text(),
	symptoms: jsonb(),
	symptomOther: text("symptom_other"),
	symptomTimeline: jsonb("symptom_timeline"),
	symptomSeverity: jsonb("symptom_severity"),
	allergies: jsonb(),
	noAllergies: boolean("no_allergies").default(false),
	treatments: text(),
	antecedents: jsonb(),
	noAntecedents: boolean("no_antecedents").default(false),
	vaccinations: text(),
	worry: text(),
	photoName: text("photo_name"),
	customAnswers: jsonb("custom_answers"),
	formTemplateId: uuid("form_template_id"),
	childId: uuid("child_id"),
	nir: text(),
	triageLevel: text("triage_level"),
	triageScore: text("triage_score"),
}, (table) => [
	foreignKey({
			columns: [table.childId],
			foreignColumns: [children.id],
			name: "formulaires_child_id_children_id_fk"
		}),
	foreignKey({
			columns: [table.doctorId],
			foreignColumns: [doctors.id],
			name: "formulaires_doctor_id_doctors_id_fk"
		}),
	foreignKey({
			columns: [table.formTemplateId],
			foreignColumns: [formTemplates.id],
			name: "formulaires_form_template_id_form_templates_id_fk"
		}),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [patientSessions.id],
			name: "formulaires_session_id_patient_sessions_id_fk"
		}),
]);

export const aiSynthesisVersions = pgTable("ai_synthesis_versions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	diagnosisId: uuid("diagnosis_id").notNull(),
	version: integer().notNull(),
	synthesis: jsonb().notNull(),
	model: text().notNull(),
	promptVersion: text("prompt_version").notNull(),
	generatedByDoctorId: uuid("generated_by_doctor_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.diagnosisId],
			foreignColumns: [formulaires.id],
			name: "ai_synthesis_versions_diagnosis_id_formulaires_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.generatedByDoctorId],
			foreignColumns: [doctors.id],
			name: "ai_synthesis_versions_generated_by_doctor_id_doctors_id_fk"
		}),
	unique("ai_synthesis_versions_diagnosis_version_unique").on(table.diagnosisId, table.version),
]);

export const responseToQuestion = pgTable("response_to_question", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	questionId: uuid("question_id").notNull(),
	propositionId: uuid("proposition_id"),
	value: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.propositionId],
			foreignColumns: [diagnosisQuestionProposition.id],
			name: "response_to_question_proposition_id_diagnosis_question_proposit"
		}),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [diagnosisQuestion.id],
			name: "response_to_question_question_id_diagnosis_question_id_fk"
		}),
]);

export const response = pgTable("response", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	diagnosisId: uuid("diagnosis_id"),
	answeredAt: timestamp("answered_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.diagnosisId],
			foreignColumns: [formulaires.id],
			name: "response_diagnosis_id_formulaires_id_fk"
		}),
]);

export const diagnosisQuestionProposition = pgTable("diagnosis_question_proposition", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	diagnosisId: uuid("diagnosis_id").notNull(),
	sectionId: uuid("section_id"),
	questionId: uuid("question_id").notNull(),
	proposition: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.diagnosisId],
			foreignColumns: [formulaires.id],
			name: "diagnosis_question_proposition_diagnosis_id_formulaires_id_fk"
		}),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [diagnosisQuestion.id],
			name: "diagnosis_question_proposition_question_id_diagnosis_question_i"
		}),
	foreignKey({
			columns: [table.sectionId],
			foreignColumns: [diagnosisSection.id],
			name: "diagnosis_question_proposition_section_id_diagnosis_section_id_"
		}),
]);

export const diagnosisSection = pgTable("diagnosis_section", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	diagnosisId: uuid("diagnosis_id").notNull(),
	title: text(),
	description: text(),
}, (table) => [
	foreignKey({
			columns: [table.diagnosisId],
			foreignColumns: [formulaires.id],
			name: "diagnosis_section_diagnosis_id_formulaires_id_fk"
		}),
]);

export const diagnosisQuestion = pgTable("diagnosis_question", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	diagnosisId: uuid("diagnosis_id").notNull(),
	sectionId: uuid("section_id"),
	question: text().notNull(),
	description: text(),
	type: questionType().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.diagnosisId],
			foreignColumns: [formulaires.id],
			name: "diagnosis_question_diagnosis_id_formulaires_id_fk"
		}),
	foreignKey({
			columns: [table.sectionId],
			foreignColumns: [diagnosisSection.id],
			name: "diagnosis_question_section_id_diagnosis_section_id_fk"
		}),
]);
