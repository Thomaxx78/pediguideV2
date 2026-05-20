import { pgTable, uuid, text, timestamp, json, jsonb, varchar, boolean, integer, unique } from 'drizzle-orm/pg-core';

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

export type QuestionType = 'text' | 'textarea' | 'date' | 'single_choice' | 'multiple_choice';

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[];
}

export const DEFAULT_QUESTIONS: Question[] = [
  { id: 'q1', type: 'text', label: "Prénom de l'enfant", required: true },
  { id: 'q2', type: 'text', label: "Nom de l'enfant", required: true },
  { id: 'q3', type: 'date', label: 'Date de naissance', required: true },
  { id: 'q4', type: 'textarea', label: 'Motif de consultation principal', required: true },
  { id: 'q5', type: 'multiple_choice', label: 'Changements de comportement observés', required: false, options: ['Pleurs inhabituels', 'Agitation', 'Somnolence excessive', "Perte d'appétit", 'Irritabilité', 'Repli sur soi'] },
  { id: 'q6', type: 'multiple_choice', label: 'Signes cliniques présents', required: false, options: ['Fièvre', 'Toux', 'Difficultés respiratoires', 'Vomissements', 'Diarrhée', 'Éruption cutanée', 'Douleur abdominale', 'Maux de tête'] },
  { id: 'q7', type: 'single_choice', label: 'Depuis combien de temps ?', required: true, options: ['Moins de 24h', '1 à 3 jours', '4 à 7 jours', "Plus d'une semaine"] },
  { id: 'q8', type: 'single_choice', label: "Niveau d'inquiétude", required: true, options: ['Peu inquiet(e)', 'Modérément inquiet(e)', 'Très inquiet(e)'] },
  { id: 'q9', type: 'multiple_choice', label: 'Actions déjà prises', required: false, options: ['Médicaments donnés', 'Consulté pharmacien', 'Appelé le 15 (SAMU)', 'Passage aux urgences', 'Téléconsultation'] },
  { id: 'q10', type: 'textarea', label: 'Informations complémentaires', required: false },
];

export const doctors = pgTable('doctors', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow(),
  rpps: text('rpps').unique().notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  cpsCardUrl: text('cps_card_url'),
  accountStatus: text('account_status').default('pending_validation'),
  kycStatus: varchar('kyc_status', { length: 50 }).default('pending'),
  kycSessionId: varchar('kyc_session_id', { length: 255 }),
  kycData: jsonb('kyc_data'),
});

export const formTemplates = pgTable('form_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  questions: jsonb('questions').$type<Question[]>().notNull().$default(() => DEFAULT_QUESTIONS),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const patientSessions = pgTable('patient_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  formTemplateId: uuid('form_template_id').references(() => formTemplates.id),
  patientToken: text('patient_token').unique().notNull(),
  patientEmail: text('patient_email'),
  patientFirstName: text('patient_first_name'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  appointmentAt: timestamp('appointment_at', { withTimezone: true }),
  remindersSent: text('reminders_sent').array().notNull().default([]),
  lastReminderAt: timestamp('last_reminder_at', { withTimezone: true }),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const children = pgTable('children', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  nir: text('nir').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  birthDate: text('birth_date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

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
  customAnswers: jsonb('custom_answers').$type<Record<string, string | string[]>>(),
  formTemplateId: uuid('form_template_id').references(() => formTemplates.id),
  childId: uuid('child_id').references(() => children.id),
  nir: text('nir'),
});

export const aiSynthesisVersions = pgTable('ai_synthesis_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  diagnosisId: uuid('diagnosis_id').notNull().references(() => diagnosis.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  synthesis: jsonb('synthesis').$type<AiSynthesis>().notNull(),
  model: text('model').notNull(),
  promptVersion: text('prompt_version').notNull(),
  generatedByDoctorId: uuid('generated_by_doctor_id').references(() => doctors.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  unique('ai_synthesis_versions_diagnosis_version_unique').on(table.diagnosisId, table.version),
]);
