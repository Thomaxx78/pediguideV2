import { relations } from "drizzle-orm/relations";
import { doctors, patientSessions, formTemplates, formulaires } from "./schema";

export const patientSessionsRelations = relations(patientSessions, ({one, many}) => ({
	doctor: one(doctors, {
		fields: [patientSessions.doctorId],
		references: [doctors.id]
	}),
	formTemplate: one(formTemplates, {
		fields: [patientSessions.formTemplateId],
		references: [formTemplates.id]
	}),
	formulaires: many(formulaires),
}));

export const doctorsRelations = relations(doctors, ({many}) => ({
	patientSessions: many(patientSessions),
	formulaires: many(formulaires),
	formTemplates: many(formTemplates),
}));

export const formTemplatesRelations = relations(formTemplates, ({one, many}) => ({
	patientSessions: many(patientSessions),
	formulaires: many(formulaires),
	doctor: one(doctors, {
		fields: [formTemplates.doctorId],
		references: [doctors.id]
	}),
}));

export const formulairesRelations = relations(formulaires, ({one}) => ({
	doctor: one(doctors, {
		fields: [formulaires.doctorId],
		references: [doctors.id]
	}),
	formTemplate: one(formTemplates, {
		fields: [formulaires.formTemplateId],
		references: [formTemplates.id]
	}),
	patientSession: one(patientSessions, {
		fields: [formulaires.sessionId],
		references: [patientSessions.id]
	}),
}));