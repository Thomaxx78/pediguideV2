import { reactive } from 'vue'
import { defineStore } from 'pinia'

export type Gender = 'fille' | 'garcon' | 'autre' | ''
export type Vaccinations = 'oui' | 'non' | 'sais-pas' | ''

export type DiagnosisFormState = {
  // Step 1 — Child info (Pediguide redesign)
  childFirstName: string
  childLastName: string
  childBirthDate: string
  nir: string
  weight: string           // kg, decimal
  height: string           // cm, optional
  gender: Gender

  // Step 2 — Symptoms
  symptoms: string[]                          // chip ids selected (see diagnosisOptions)
  symptomOther: string

  // Step 3 — Timeline + severity per symptom
  symptomTimeline: Record<string, string>     // symptomId -> timeline chip id
  symptomSeverity: Record<string, number>     // symptomId -> 0–10

  // Step 4 — History & allergies
  allergies: string[]
  noAllergies: boolean
  treatments: string
  antecedents: string[]
  noAntecedents: boolean
  vaccinations: Vaccinations

  // Step 5 — Context + photo
  worry: string
  photoName: string                           // local filename only (no upload v1)
  additionalNotes: string

  // Consent
  consent: boolean
}

const createFormState = (): DiagnosisFormState => ({
  childFirstName: '',
  childLastName: '',
  childBirthDate: '',
  nir: '',
  weight: '',
  height: '',
  gender: '',
  symptoms: [],
  symptomOther: '',
  symptomTimeline: {},
  symptomSeverity: {},
  allergies: [],
  noAllergies: false,
  treatments: '',
  antecedents: [],
  noAntecedents: false,
  vaccinations: '',
  worry: '',
  photoName: '',
  additionalNotes: '',
  consent: false,
})

export const useDiagnosisFormStore = defineStore('diagnosisForm', () => {
  const form = reactive<DiagnosisFormState>(createFormState())

  const reset = () => {
    Object.assign(form, createFormState())
  }

  return { form, reset }
})
