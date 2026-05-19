import { reactive } from 'vue'
import { defineStore } from 'pinia'

export type DiagnosisFormState = {
  childFirstName: string
  childLastName: string
  childBirthDate: string
  consultationReason: string
  behaviorChanges: string[]
  clinicalSigns: string[]
  duration: string
  worryLevel: string
  actionsTaken: string[]
  additionalNotes: string
  consent: boolean
}

const createFormState = (): DiagnosisFormState => ({
  childFirstName: '',
  childLastName: '',
  childBirthDate: '',
  consultationReason: '',
  behaviorChanges: [],
  clinicalSigns: [],
  duration: '',
  worryLevel: '',
  actionsTaken: [],
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
