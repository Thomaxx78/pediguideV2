import { pgTable, uuid, text, timestamp, json, jsonb, varchar } from 'drizzle-orm/pg-core';

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

export const diagnosis = pgTable('formulaires', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow(),

  childFirstName: text('child_first_name').notNull(),
  childLastName: text('child_last_name').notNull(),
  childBirthDate: text('child_birth_date').notNull(),
  consultationReason: text('consultation_reason').notNull(),

  behaviorChanges: json('behavior_changes').$type<string[]>(),
  clinicalSigns: json('clinical_signs').$type<string[]>(),

  duration: text('duration').notNull(),
  worryLevel: text('worry_level').notNull(),

  actionsTaken: json('actions_taken').$type<string[]>(),

  additionalNotes: text('additional_notes'),

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