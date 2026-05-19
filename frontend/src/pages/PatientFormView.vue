<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL } from '@/services/api'
import { useDiagnosisFormStore } from '@/stores/diagnosisForm'
import { storeToRefs } from 'pinia'
import { computed, nextTick, reactive } from 'vue'
import { Button } from '@/components/ui/button'
import { Field, FieldError } from '@/components/ui/field'
import DiagnosisHeader from '@/pages/diagnosis/DiagnosisHeader.vue'
import DiagnosisStep1 from '@/pages/diagnosis/DiagnosisStep1.vue'
import DiagnosisStep2 from '@/pages/diagnosis/DiagnosisStep2.vue'
import DiagnosisStep3 from '@/pages/diagnosis/DiagnosisStep3.vue'
import DiagnosisStep4 from '@/pages/diagnosis/DiagnosisStep4.vue'
import DiagnosisStep5 from '@/pages/diagnosis/DiagnosisStep5.vue'
import {
  errorId,
  fieldIds,
  requiredFieldsByStep,
  validators,
  type FormFieldKey,
} from '@/pages/diagnosis/diagnosisValidation'

const route = useRoute()
const router = useRouter()
const token = route.params.token as string

const sessionStatus = ref<'loading' | 'valid' | 'expired' | 'completed' | 'not_found'>('loading')
const sessionError = ref('')

const formStore = useDiagnosisFormStore()
const { form } = storeToRefs(formStore)

const totalSteps = 5
const step = ref(1)
const isLoading = ref(false)
const errorMessage = ref('')
const stepAttempted = ref(false)
const progress = computed(() => (step.value / totalSteps) * 100)
const maxBirthDate = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const errors = reactive<Partial<Record<FormFieldKey, string>>>({})
const touched = reactive<Partial<Record<FormFieldKey, boolean>>>({})

const stepHeadingIds: Record<number, string> = { 1: 'step-1-title', 2: 'step-2-title', 3: 'step-3-title', 4: 'step-4-title', 5: 'step-5-title' }

const getValueForValidator = (field: FormFieldKey): string | boolean => {
  const val = form.value[field]
  if (Array.isArray(val)) return val.length > 0 ? 'filled' : ''
  if (typeof val === 'boolean') return val
  if (val === null || val === undefined) return ''
  return String(val)
}

const shouldShowError = (field: FormFieldKey) => Boolean(errors[field]) && (touched[field] || stepAttempted.value)

const setFieldError = (field: FormFieldKey) => {
  const validator = validators[field]
  if (!validator) return
  const error = validator(getValueForValidator(field))
  if (error) errors[field] = error
  else delete errors[field]
}

const handleFieldBlur = (field: FormFieldKey) => { touched[field] = true; setFieldError(field) }
const handleFieldInput = (field: FormFieldKey) => { if (touched[field] || stepAttempted.value) setFieldError(field) }
const handleFieldChange = (field: FormFieldKey) => { touched[field] = true; setFieldError(field) }

const validateStep = (currentStep: number) => {
  const fields = requiredFieldsByStep[currentStep] ?? []
  let valid = true
  fields.forEach(field => {
    const error = validators[field]?.(getValueForValidator(field))
    if (error) { errors[field] = error; valid = false }
    else delete errors[field]
  })
  return valid
}

const focusField = async (field: FormFieldKey) => {
  await nextTick()
  const el = document.getElementById(String(fieldIds[field] || ''))
  if (el instanceof HTMLElement) { el.focus(); el.scrollIntoView({ block: 'center' }) }
}

const focusFirstInvalid = async (s: number) => {
  const first = (requiredFieldsByStep[s] ?? []).find(f => Boolean(errors[f]))
  if (first) await focusField(first)
}

const focusHeading = async () => {
  await nextTick()
  const el = document.getElementById(stepHeadingIds[step.value])
  if (el instanceof HTMLElement) el.focus()
}

const nextStep = async () => {
  stepAttempted.value = true
  if (!validateStep(step.value)) { await focusFirstInvalid(step.value); return }
  stepAttempted.value = false
  step.value = Math.min(step.value + 1, totalSteps)
}

const prevStep = () => { stepAttempted.value = false; step.value = Math.max(step.value - 1, 1) }

const validateAll = () => {
  let firstInvalid: number | null = null
  Object.keys(requiredFieldsByStep).map(Number).sort().forEach(s => {
    if (!validateStep(s) && firstInvalid === null) firstInvalid = s
  })
  return firstInvalid
}

const submitForm = async () => {
  errorMessage.value = ''
  const invalidStep = validateAll()
  if (invalidStep) { step.value = invalidStep; stepAttempted.value = true; await focusFirstInvalid(invalidStep); return }

  isLoading.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/sessions/${token}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erreur inconnue')
    formStore.reset()
    await router.push(`/results/${data.id}`)
  } catch (err) {
    errorMessage.value = "Une erreur est survenue lors de l'envoi."
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/sessions/${token}`)
    if (res.status === 404) { sessionStatus.value = 'not_found'; return }
    if (res.status === 410) { sessionStatus.value = 'expired'; return }
    if (res.status === 409) { sessionStatus.value = 'completed'; return }
    if (!res.ok) { sessionStatus.value = 'not_found'; return }
    sessionStatus.value = 'valid'
  } catch {
    sessionStatus.value = 'not_found'
  }
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <div class="mx-auto max-w-2xl px-4 py-10 sm:px-6">

      <!-- États non valides -->
      <section v-if="sessionStatus === 'loading'" class="rounded-2xl border border-border/70 bg-background p-8 text-center">
        <p class="text-sm text-muted-foreground">Vérification du lien...</p>
      </section>

      <section v-else-if="sessionStatus === 'expired'" class="rounded-2xl border border-border/70 bg-background p-8 text-center space-y-2">
        <h1 class="text-xl font-semibold text-foreground">Lien expiré</h1>
        <p class="text-sm text-muted-foreground">Ce lien de consultation a expiré. Contactez votre médecin pour en obtenir un nouveau.</p>
      </section>

      <section v-else-if="sessionStatus === 'completed'" class="rounded-2xl border border-border/70 bg-background p-8 text-center space-y-2">
        <h1 class="text-xl font-semibold text-foreground">Formulaire déjà soumis</h1>
        <p class="text-sm text-muted-foreground">Vous avez déjà rempli ce questionnaire. Votre médecin a bien reçu vos réponses.</p>
      </section>

      <section v-else-if="sessionStatus === 'not_found'" class="rounded-2xl border border-border/70 bg-background p-8 text-center space-y-2">
        <h1 class="text-xl font-semibold text-foreground">Lien introuvable</h1>
        <p class="text-sm text-muted-foreground">Ce lien n'existe pas ou a été supprimé.</p>
      </section>

      <!-- Formulaire valide -->
      <section v-else class="rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
        <DiagnosisHeader :step="step" :total-steps="totalSteps" :progress="progress" />

        <form novalidate @submit.prevent="submitForm" class="mt-8 space-y-6">
          <DiagnosisStep1 v-if="step === 1" :form="form" :errors="errors" :max-birth-date="maxBirthDate" :should-show-error="shouldShowError" :error-id="errorId" @field-blur="handleFieldBlur" @field-input="handleFieldInput" />
          <DiagnosisStep2 v-if="step === 2" :form="form" />
          <DiagnosisStep3 v-if="step === 3" :form="form" :errors="errors" :should-show-error="shouldShowError" :error-id="errorId" @field-change="handleFieldChange" />
          <DiagnosisStep4 v-if="step === 4" :form="form" />
          <DiagnosisStep5 v-if="step === 5" :form="form" />

          <div v-if="step === totalSteps" class="space-y-3 rounded-xl border border-border/70 bg-background/60 p-4">
            <p class="text-sm font-medium text-foreground">Consentement</p>
            <Field :data-invalid="shouldShowError('consent')" class="gap-2">
              <label for="consent-checkbox" class="flex items-start gap-3 rounded-lg border border-border/70 bg-background p-3 transition-colors hover:bg-accent/60">
                <input id="consent-checkbox" v-model="form.consent" type="checkbox" name="consent" required class="mt-0.5 h-4 w-4 rounded border-input accent-primary" :aria-invalid="Boolean(errors.consent)" @change="handleFieldChange('consent')" />
                <span class="text-sm text-foreground">Je consens à la transmission de ces informations au médecin afin de préparer la consultation. <span class="text-destructive" aria-hidden="true">*</span></span>
              </label>
              <FieldError v-if="shouldShowError('consent')" :id="errorId('consent')" :errors="[errors.consent]" />
            </Field>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-6">
            <Button v-if="step > 1" type="button" variant="outline" @click="prevStep">Retour</Button>
            <span v-else aria-hidden="true"></span>
            <Button v-if="step < totalSteps" type="button" @click="nextStep">Continuer</Button>
            <Button v-else type="submit" :disabled="isLoading">{{ isLoading ? 'Envoi...' : 'Envoyer mes réponses' }}</Button>
          </div>

          <p v-if="errorMessage" class="text-center text-sm text-destructive" role="alert">{{ errorMessage }}</p>
        </form>
      </section>

    </div>
  </div>
</template>
