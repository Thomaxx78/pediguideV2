import { relations } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, json, jsonb, varchar, pgEnum } from 'drizzle-orm/pg-core';

export interface AiSynthesis {
  motif_principal: string;
  symptomes_cles: string[];
  duree_evolution: string;
  niveau_inquietude_parent: 'faible' | 'modéré' | 'élevé';
  actions_deja_prises: string[];
  points_attention: string[];
  niveau_priorite: 'non_urgent' | 'a_surveiller' | 'urgent';
  resume_message_libre: string | null;
  disclaimer: string;
}

export const question_type_enum = pgEnum('question_type', [
  'short',
  'long',
  'radio',
  'checkbox',
])

export const diagnosis = pgTable('formulaires', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow(),

  // childFirstName: text('child_first_name').notNull(),
  // childLastName: text('child_last_name').notNull(),
  // childBirthDate: text('child_birth_date').notNull(),
  // consultationReason: text('consultation_reason').notNull(),

  // behaviorChanges: json('behavior_changes').$type<string[]>(),
  // clinicalSigns: json('clinical_signs').$type<string[]>(),

  // duration: text('duration').notNull(),
  // worryLevel: text('worry_level').notNull(),

  // actionsTaken: json('actions_taken').$type<string[]>(),

  // additionalNotes: text('additional_notes'),

  status: text('status').default('new'),
  aiSynthesis: jsonb('ai_synthesis').$type<AiSynthesis>(),
  doctorId: uuid('doctor_id').references(() => doctors.id),
  sessionId: uuid('session_id').references(() => patientSessions.id),
});

export const patientSessions = pgTable('patient_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  patientToken: text('patient_token').unique().notNull(),
  patientEmail: text('patient_email'),
  patientFirstName: text('patient_first_name'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  status: text('status').default('pending'), // pending | completed | expired
  createdAt: timestamp('created_at').defaultNow(),
});

export const doctors = pgTable('doctors', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow(),

  rpps: text('rpps').unique().notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),

  cpsCardUrl: text('cps_card_url'),

  accountStatus: text('account_status').default('pending_validation'),

  // KYC/Identity verification fields (Didit integration)
  kycStatus: varchar('kyc_status', { length: 50 }).default('pending'), // 'verified', 'rejected', 'pending'
  kycSessionId: varchar('kyc_session_id', { length: 255 }),
  kycData: jsonb('kyc_data'), // Store additional verification details from webhooks
});

export const diagnosis_section_table = pgTable('diagnosis_section', {
  id: uuid('id').defaultRandom().primaryKey(),
  diagnosis_id: uuid('diagnosis_id').references(() => diagnosis.id).notNull(),

  title: text('title'),
  description: text('description'),
})

export const diagnosis_question_table = pgTable('diagnosis_question', {
  id: uuid('id').defaultRandom().primaryKey(),
  diagnosis_id: uuid('diagnosis_id').references(() => diagnosis.id).notNull(),
  section_id: uuid('section_id').references(() => diagnosis_section_table.id),

  question: text('question').notNull(),
  description: text('description'),
  type: question_type_enum().notNull(),
})

export const diagnosis_question_proposition_table = pgTable('diagnosis_question_proposition', {
  id: uuid('id').defaultRandom().primaryKey(),
  diagnosis_id: uuid('diagnosis_id').references(() => diagnosis.id).notNull(),
  section_id: uuid('section_id').references(() => diagnosis_section_table.id),
  question_id: uuid('question_id').references(() => diagnosis_question_table.id).notNull(),

  proposition: text('proposition').notNull()
})

export const diagnosisRelations = relations(diagnosis, ({ many }) => ({
  sections: many(diagnosis_section_table),

  questions: many(diagnosis_question_table),
}))

export const diagnosisSectionRelations = relations(diagnosis_section_table, ({ one, many }) => ({
  diagnosis: one(diagnosis, {
    fields: [diagnosis_section_table.diagnosis_id],
    references: [diagnosis.id],
  }),
  questions: many(diagnosis_question_table),
}))

export const diagnosisQuestionRelations = relations(diagnosis_question_table, ({ one, many }) => ({
  diagnosis: one(diagnosis, {
    fields: [diagnosis_question_table.diagnosis_id],
    references: [diagnosis.id],
  }),
  section: one(diagnosis_section_table, {
    fields: [diagnosis_question_table.section_id],
    references: [diagnosis_section_table.id],
  }),

  propositions: many(diagnosis_question_proposition_table),
}))

export const diagnosisQuestionPropositionRealtions = relations(diagnosis_question_proposition_table, ({ one }) => ({
  question: one(diagnosis_question_table, {
    fields: [diagnosis_question_proposition_table.question_id],
    references: [diagnosis_question_table.id],
  }),
}))
