import { relations } from "drizzle-orm/relations";
import { doctors, patientSessions, formTemplates, children, formulaires, aiSynthesisVersions, diagnosisQuestionProposition, responseToQuestion, diagnosisQuestion, response, diagnosisSection } from "./schema";

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
	children: many(children),
	formTemplates: many(formTemplates),
	formulaires: many(formulaires),
	aiSynthesisVersions: many(aiSynthesisVersions),
}));

export const formTemplatesRelations = relations(formTemplates, ({one, many}) => ({
	patientSessions: many(patientSessions),
	doctor: one(doctors, {
		fields: [formTemplates.doctorId],
		references: [doctors.id]
	}),
	formulaires: many(formulaires),
}));

export const childrenRelations = relations(children, ({one, many}) => ({
	doctor: one(doctors, {
		fields: [children.doctorId],
		references: [doctors.id]
	}),
	formulaires: many(formulaires),
}));

export const formulairesRelations = relations(formulaires, ({one, many}) => ({
	child: one(children, {
		fields: [formulaires.childId],
		references: [children.id]
	}),
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
	aiSynthesisVersions: many(aiSynthesisVersions),
	responses: many(response),
	diagnosisQuestionPropositions: many(diagnosisQuestionProposition),
	diagnosisSections: many(diagnosisSection),
	diagnosisQuestions: many(diagnosisQuestion),
}));

export const aiSynthesisVersionsRelations = relations(aiSynthesisVersions, ({one}) => ({
	formulaire: one(formulaires, {
		fields: [aiSynthesisVersions.diagnosisId],
		references: [formulaires.id]
	}),
	doctor: one(doctors, {
		fields: [aiSynthesisVersions.generatedByDoctorId],
		references: [doctors.id]
	}),
}));

export const responseToQuestionRelations = relations(responseToQuestion, ({one}) => ({
	diagnosisQuestionProposition: one(diagnosisQuestionProposition, {
		fields: [responseToQuestion.propositionId],
		references: [diagnosisQuestionProposition.id]
	}),
	diagnosisQuestion: one(diagnosisQuestion, {
		fields: [responseToQuestion.questionId],
		references: [diagnosisQuestion.id]
	}),
}));

export const diagnosisQuestionPropositionRelations = relations(diagnosisQuestionProposition, ({one, many}) => ({
	responseToQuestions: many(responseToQuestion),
	formulaire: one(formulaires, {
		fields: [diagnosisQuestionProposition.diagnosisId],
		references: [formulaires.id]
	}),
	diagnosisQuestion: one(diagnosisQuestion, {
		fields: [diagnosisQuestionProposition.questionId],
		references: [diagnosisQuestion.id]
	}),
	diagnosisSection: one(diagnosisSection, {
		fields: [diagnosisQuestionProposition.sectionId],
		references: [diagnosisSection.id]
	}),
}));

export const diagnosisQuestionRelations = relations(diagnosisQuestion, ({one, many}) => ({
	responseToQuestions: many(responseToQuestion),
	diagnosisQuestionPropositions: many(diagnosisQuestionProposition),
	formulaire: one(formulaires, {
		fields: [diagnosisQuestion.diagnosisId],
		references: [formulaires.id]
	}),
	diagnosisSection: one(diagnosisSection, {
		fields: [diagnosisQuestion.sectionId],
		references: [diagnosisSection.id]
	}),
}));

export const responseRelations = relations(response, ({one}) => ({
	formulaire: one(formulaires, {
		fields: [response.diagnosisId],
		references: [formulaires.id]
	}),
}));

export const diagnosisSectionRelations = relations(diagnosisSection, ({one, many}) => ({
	diagnosisQuestionPropositions: many(diagnosisQuestionProposition),
	formulaire: one(formulaires, {
		fields: [diagnosisSection.diagnosisId],
		references: [formulaires.id]
	}),
	diagnosisQuestions: many(diagnosisQuestion),
}));