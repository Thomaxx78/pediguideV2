<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Field, FieldError } from '@/components/ui/field'
import { ViewportShell } from '@/components/ui/viewport-shell'
import { useDiagnosisFormStore } from '@/stores/diagnosisForm'
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
import { API_BASE_URL } from '@/services/api'

const route = useRoute()
const router = useRouter()
const sessionToken = computed(() => route.query.token as string | undefined)
const formStore = useDiagnosisFormStore()
const { form } = storeToRefs(formStore)

const totalSteps = 5
const step = ref(1)
const isLoading = ref(false)
const errorMessage = ref('')
const stepAttempted = ref(false)
const submissionId = ref('')

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const maxBirthDate = computed(() => formatDate(new Date()))

const errors = reactive<Partial<Record<FormFieldKey, string>>>({})
const touched = reactive<Partial<Record<FormFieldKey, boolean>>>({})

const stepHeadingIds: Record<number, string> = {
  1: 'step-1-title',
  2: 'step-2-title',
  3: 'step-3-title',
  4: 'step-4-title',
  5: 'step-5-title',
}

const shouldShowError = (field: FormFieldKey) => Boolean(errors[field])
  && (touched[field] || stepAttempted.value)

const setFieldError = (field: FormFieldKey) => {
  const validator = validators[field]
  if (!validator) return
  const error = validator(form.value[field])
  if (error) errors[field] = error
  else delete errors[field]
}

const handleFieldBlur = (field: FormFieldKey) => {
  touched[field] = true
  setFieldError(field)
}

const handleFieldInput = (field: FormFieldKey) => {
  if (touched[field] || stepAttempted.value) {
    setFieldError(field)
  }
}

const handleFieldChange = (field: FormFieldKey) => {
  touched[field] = true
  setFieldError(field)
}

const validateStep = (currentStep: number) => {
  let isValid = true

  // Per-field validators
  const requiredFields = requiredFieldsByStep[currentStep] ?? []
  for (const field of requiredFields) {
    const validator = validators[field]
    if (!validator) continue
    const error = validator(form.value[field])
    if (error) {
      errors[field] = error
      isValid = false
    } else {
      delete errors[field]
    }
  }

  // Step-level rules
  if (currentStep === 2) {
    const hasSymptoms = form.value.symptoms.length > 0
    const hasOther = form.value.symptomOther.trim().length > 0
    if (!hasSymptoms && !hasOther) {
      errors.symptoms = 'Sélectionnez au moins un symptôme ou décrivez-en un dans « Autre ».'
      isValid = false
    } else {
      delete errors.symptoms
    }
  }

  if (currentStep === 3) {
    let missing = false
    for (const id of form.value.symptoms) {
      if (!form.value.symptomTimeline[id]) missing = true
    }
    if (missing) {
      errors.symptomTimeline = 'Indiquez depuis quand pour chaque symptôme.'
      isValid = false
    } else {
      delete errors.symptomTimeline
    }
  }

  return isValid
}

const focusField = async (field: FormFieldKey) => {
  await nextTick()
  const rawId = fieldIds[field] ?? ''
  if (!rawId) return
  const element = document.getElementById(rawId)
  if (element instanceof HTMLElement) {
    element.focus()
    element.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
}

const focusFirstInvalidField = async (currentStep: number) => {
  const requiredFields = requiredFieldsByStep[currentStep] ?? []
  const firstInvalid = requiredFields.find((field) => Boolean(errors[field]))
  if (firstInvalid) await focusField(firstInvalid)
}

const focusStepHeading = async () => {
  await nextTick()
  const headingId = stepHeadingIds[step.value]
  if (!headingId) return
  const heading = document.getElementById(headingId)
  if (heading instanceof HTMLElement) heading.focus()
}

const nextStep = async () => {
  stepAttempted.value = true
  if (!validateStep(step.value)) {
    await focusFirstInvalidField(step.value)
    return
  }
  stepAttempted.value = false
  step.value = Math.min(step.value + 1, totalSteps)
}

const prevStep = () => {
  stepAttempted.value = false
  step.value = Math.max(step.value - 1, 1)
}

const validateAllSteps = (): number | null => {
  const ordered = Object.keys(requiredFieldsByStep).map(Number).sort((a, b) => a - b)
  for (const s of ordered) {
    if (!validateStep(s)) return s
  }
  return null
}

const resetValidationState = () => {
  for (const key in errors) delete errors[key as FormFieldKey]
  for (const key in touched) delete touched[key as FormFieldKey]
  stepAttempted.value = false
}

const submitForm = async () => {
  errorMessage.value = ''
  const invalid = validateAllSteps()
  if (invalid) {
    step.value = invalid
    stepAttempted.value = true
    await focusFirstInvalidField(invalid)
    return
  }

  isLoading.value = true
  try {
    const url = sessionToken.value
      ? `${API_BASE_URL}/sessions/${sessionToken.value}/respond`
      : `${API_BASE_URL}/diagnosis`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')

    submissionId.value = String(data.id ?? '')
    if (!submissionId.value) throw new Error('Identifiant de soumission manquant')

    step.value = totalSteps + 1
  } catch (error) {
    console.error(error)
    errorMessage.value = error instanceof Error ? error.message : "Une erreur est survenue lors de l'envoi."
  } finally {
    isLoading.value = false
  }
}

const restart = () => {
  formStore.reset()
  resetValidationState()
  submissionId.value = ''
  step.value = 1
}

const goToResults = () => {
  if (submissionId.value) router.push(`/results/${submissionId.value}`)
}

const isConfirmation = computed(() => step.value > totalSteps)

watch(step, async () => {
  if (!stepAttempted.value) await focusStepHeading()
})
</script>

<template>
  <ViewportShell>
    <div v-if="!isConfirmation" class="flex min-h-screen flex-col">
      <!-- Sticky top bar -->
      <div class="sticky top-0 z-10 bg-[var(--color-bg)] px-5 pt-6 pb-4">
        <DiagnosisHeader :step="step" :total-steps="totalSteps" />
      </div>

      <!-- Form body -->
      <form novalidate class="flex flex-1 flex-col" @submit.prevent="submitForm">
        <div class="flex-1 px-5 py-6">
          <DiagnosisStep1
            v-if="step === 1"
            :form="form"
            :errors="errors"
            :max-birth-date="maxBirthDate"
            :should-show-error="shouldShowError"
            :error-id="errorId"
            @field-blur="handleFieldBlur"
            @field-input="handleFieldInput"
            @field-change="handleFieldChange"
          />

          <DiagnosisStep2 v-if="step === 2" :form="form" />

          <DiagnosisStep3 v-if="step === 3" :form="form" />

          <DiagnosisStep4 v-if="step === 4" :form="form" />

          <DiagnosisStep5 v-if="step === 5" :form="form" />

          <!-- Step-level errors that don't live on a per-field FieldError -->
          <FieldError
            v-if="(step === 2 && shouldShowError('symptoms')) || (step === 3 && shouldShowError('symptomTimeline'))"
            class="mt-4"
            :errors="[
              step === 2 ? errors.symptoms : undefined,
              step === 3 ? errors.symptomTimeline : undefined,
            ]"
          />

          <!-- Consent on the final step -->
          <div v-if="step === totalSteps" class="mt-6">
            <Field :data-invalid="shouldShowError('consent')" class="gap-2">
              <label
                for="consent-checkbox"
                class="flex items-start gap-3 rounded-[var(--r-md)] border border-[var(--color-line-2)] bg-[var(--color-surface)] p-3 transition-colors hover:bg-[var(--color-surface-2)] focus-within:ring-[3px] focus-within:ring-ring/45"
              >
                <input
                  id="consent-checkbox"
                  v-model="form.consent"
                  type="checkbox"
                  name="consent"
                  required
                  class="mt-0.5 size-4 rounded border-[var(--color-line-2)] accent-primary"
                  :aria-invalid="Boolean(errors.consent)"
                  :aria-describedby="shouldShowError('consent') ? errorId('consent') : undefined"
                  @change="handleFieldChange('consent')"
                />
                <span class="text-sm text-[var(--color-ink-2)]">
                  Je consens à la transmission de ces informations au professionnel de santé afin de préparer la consultation.
                </span>
              </label>
              <FieldError
                v-if="shouldShowError('consent')"
                :id="errorId('consent')"
                :errors="[errors.consent]"
              />
            </Field>
          </div>
        </div>

        <!-- Footer actions -->
        <footer class="sticky bottom-0 mt-auto bg-[var(--color-bg)] px-5 py-4 space-y-3">
          <p v-if="errorMessage" class="text-center text-sm text-destructive" role="alert">
            {{ errorMessage }}
          </p>

          <Button
            v-if="step < totalSteps"
            block
            type="button"
            @click="nextStep"
          >
            Continuer
          </Button>
          <Button
            v-else
            block
            type="submit"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Envoi...' : 'Envoyer mes réponses' }}
          </Button>

          <Button
            v-if="step > 1"
            block
            type="button"
            variant="ghost"
            @click="prevStep"
          >
            Retour
          </Button>
        </footer>
      </form>
    </div>

    <!-- Confirmation state -->
    <div v-else class="flex min-h-screen flex-col">
      <div class="px-5 pt-6">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-[var(--color-muted-strong)] uppercase tracking-[0.08em]">
            Pré-consultation
          </span>
        </div>
      </div>

      <div class="flex-1 px-5 py-8 space-y-7">
        <div class="flex flex-col items-center text-center space-y-4">
          <span class="inline-flex size-16 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-primary">
            <svg viewBox="0 0 24 24" class="size-8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
          </span>
          <h1 class="font-display text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
            C'est transmis. Merci.
          </h1>
          <p class="text-[15px] text-[var(--color-ink-2)] max-w-[320px]">
            Vos réponses ont été transmises. Le professionnel de santé les aura à disposition avant la consultation.
          </p>
        </div>

        <!-- What the doctor sees next -->
        <article class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 flex items-start gap-3">
          <span aria-hidden="true" class="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-primary">
            <svg viewBox="0 0 20 20" class="size-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 3v4M14 3v4M5 7h10v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7Z" />
            </svg>
          </span>
          <div>
            <p class="text-[14.5px] font-medium text-[var(--color-ink)]">
              Le professionnel de santé dispose déjà de toutes vos réponses.
            </p>
            <p class="mt-1 text-[13px] text-[var(--color-ink-2)]">
              Rendez-vous comme prévu — pas besoin de tout réexpliquer.
            </p>
          </div>
        </article>

        <!-- Next steps -->
        <section class="space-y-3">
          <h2 class="text-sm font-medium text-[var(--color-ink-2)] uppercase tracking-wide">
            Et maintenant&nbsp;?
          </h2>
          <ol class="space-y-3">
            <li class="flex items-start gap-3">
              <span class="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-primary text-sm font-semibold">1</span>
              <div>
                <p class="text-[15px] font-medium text-[var(--color-ink)]">Présentez-vous à l'heure</p>
                <p class="text-sm text-[var(--color-ink-2)]">Le cabinet ouvre 10 minutes avant le rendez-vous.</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-primary text-sm font-semibold">2</span>
              <div>
                <p class="text-[15px] font-medium text-[var(--color-ink)]">Le professionnel de santé aura déjà vos réponses</p>
                <p class="text-sm text-[var(--color-ink-2)]">Pas besoin de tout réexpliquer&nbsp;: il sait déjà ce qui vous amène.</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-primary text-sm font-semibold">3</span>
              <div>
                <p class="text-[15px] font-medium text-[var(--color-ink)]">En cas d'aggravation</p>
                <p class="text-sm text-[var(--color-ink-2)]">Appelez le SAMU (15) ou rendez-vous aux urgences pédiatriques.</p>
              </div>
            </li>
          </ol>
        </section>

        <p class="text-center text-xs text-[var(--color-muted-strong)]">
          Une copie a été envoyée par email. Vous pouvez fermer cette page.
        </p>
      </div>

      <!-- Confirmation footer actions -->
      <footer class="bg-[var(--color-bg)] px-5 py-4 space-y-3">
        <Button
          v-if="submissionId"
          block
          type="button"
          variant="secondary"
          @click="goToResults"
        >
          Voir le récapitulatif PDF
        </Button>
        <Button
          block
          type="button"
          variant="ghost"
          @click="restart"
        >
          Revoir le questionnaire depuis le début
        </Button>
      </footer>
    </div>
  </ViewportShell>
</template>
