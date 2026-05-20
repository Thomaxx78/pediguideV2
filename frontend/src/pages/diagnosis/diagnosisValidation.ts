import type { DiagnosisFormState } from '@/stores/diagnosisForm'

export type FormFieldKey = keyof DiagnosisFormState

const normalizeText = (value: unknown) => String(value ?? '').trim()

const validateBirthDate = (value: string) => {
  if (!value) return 'La date de naissance est requise.'

  const parsedDate = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsedDate.getTime())) {
    return 'La date de naissance est invalide.'
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (parsedDate > today) {
    return 'La date de naissance ne peut pas être dans le futur.'
  }
  return null
}

const validateWeight = (value: string) => {
  const text = normalizeText(value).replace(',', '.')
  if (!text) return 'Le poids est requis.'
  const n = Number(text)
  if (Number.isNaN(n) || n <= 0) return 'Le poids doit être un nombre positif.'
  if (n > 120) return 'Le poids semble trop élevé. Vérifiez la valeur.'
  return null
}

const validateGender = (value: unknown) => {
  return value ? null : 'Merci de sélectionner une option.'
}

const validateConsent = (value: unknown) => {
  return value ? null : "Merci de donner votre consentement avant l'envoi."
}

const validateNonEmpty = (value: unknown, message: string) => {
  return normalizeText(value) ? null : message
}

/**
 * Validators for individual fields. The DiagnosisView wires these by calling
 * validator(form[field]). For fields that don't have a per-field validator
 * (symptoms, symptomTimeline, symptomSeverity), step-level validation in
 * DiagnosisView handles the rules.
 */
export const validators: Partial<Record<FormFieldKey, (value: unknown) => string | null>> = {
  childFirstName: (v) => validateNonEmpty(v, "Le prénom de l'enfant est requis."),
  childBirthDate: (v) => validateBirthDate(String(v ?? '')),
  weight: (v) => validateWeight(String(v ?? '')),
  gender: validateGender,
  consent: validateConsent,
}

export const requiredFieldsByStep: Record<number, FormFieldKey[]> = {
  1: ['childFirstName', 'childBirthDate', 'weight', 'gender'],
  // Steps 2 & 3 use step-level validation (symptom list + per-symptom maps).
  2: [],
  3: [],
  4: [],
  5: ['consent'],
}

/**
 * DOM IDs of the first interactive element per field. Used to scroll/focus
 * the first invalid field on Continue.
 */
export const fieldIds: Partial<Record<FormFieldKey, string>> = {
  childFirstName: 'child-first-name',
  childBirthDate: 'child-birth-date',
  weight: 'child-weight',
  height: 'child-height',
  gender: 'child-gender',
  symptoms: 'symptoms-group',
  symptomOther: 'symptoms-other',
  allergies: 'allergies-group',
  treatments: 'treatments',
  antecedents: 'antecedents-group',
  vaccinations: 'vaccinations',
  worry: 'worry',
  additionalNotes: 'additional-notes',
  consent: 'consent-checkbox',
}

export const errorId = (field: FormFieldKey) => `${fieldIds[field] ?? field}-error`
