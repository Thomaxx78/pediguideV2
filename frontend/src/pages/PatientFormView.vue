<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Brand } from '@/components/ui/brand'
import ViewportShell from '@/components/ui/viewport-shell/ViewportShell.vue'
import { symptomGroups, timelineOptions, allergyOptions, antecedentOptions } from './diagnosis/diagnosisOptions'

const route = useRoute()
const router = useRouter()
const token = route.params.token as string

type QuestionType =
  | 'text' | 'textarea' | 'date' | 'single_choice' | 'multiple_choice'
  | 'symptom_picker' | 'symptom_timeline' | 'allergy_picker' | 'antecedent_picker' | 'scale'
  | 'step_break'

interface Question { id: string; type: QuestionType; label: string; required: boolean; options?: string[] }

const sessionStatus = ref<'loading' | 'valid' | 'expired' | 'completed' | 'not_found'>('loading')
const questions = ref<Question[]>([])
const answers = ref<Record<string, string | string[]>>({})
const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const submitError = ref('')
const nir = ref('')
const responseId = ref<string | null>(null)
const diagnosisId = ref<string | null>(null)

// ── Multi-step engine ────────────────────────────────────────────────────────

const currentStepIndex = ref(0)

// Split questions array into steps at each step_break. The step_break label
// becomes the title of the step that follows it.
const steps = computed(() => {
  const hasBreaks = questions.value.some(q => q.type === 'step_break')
  if (!hasBreaks) {
    return [{ title: 'Questionnaire', questions: questions.value.filter(q => q.type !== 'step_break') }]
  }

  const result: { title: string; questions: Question[] }[] = []
  let pendingTitle = ''
  let currentQs: Question[] = []

  for (const q of questions.value) {
    if (q.type === 'step_break') {
      if (currentQs.length > 0) {
        result.push({ title: pendingTitle || 'Questionnaire', questions: currentQs })
        currentQs = []
      }
      pendingTitle = q.label || 'Étape'
    } else {
      currentQs.push(q)
    }
  }
  if (currentQs.length > 0) {
    result.push({ title: pendingTitle || 'Questionnaire', questions: currentQs })
  }
  return result.length > 0 ? result : [{ title: 'Questionnaire', questions: questions.value.filter(q => q.type !== 'step_break') }]
})

const totalSteps = computed(() => steps.value.length)
const currentStep = computed(() => steps.value[currentStepIndex.value] ?? { title: '', questions: [] })
const isLastStep = computed(() => currentStepIndex.value === totalSteps.value - 1)
const progress = computed(() => Math.round(((currentStepIndex.value + 1) / totalSteps.value) * 100))

// ── Answer helpers ───────────────────────────────────────────────────────────

const getAnswer = (id: string): string | string[] => answers.value[id] ?? ''
const setAnswer = (id: string, val: string | string[]) => { answers.value[id] = val; delete errors.value[id] }

const toggleMulti = (id: string, option: string) => {
  const current = (answers.value[id] as string[]) ?? []
  const idx = current.indexOf(option)
  if (idx === -1) setAnswer(id, [...current, option])
  else setAnswer(id, current.filter(o => o !== option))
}

const isChecked = (id: string, option: string) => ((answers.value[id] as string[]) ?? []).includes(option)

// ── Rich question helpers ────────────────────────────────────────────────────

const toggleSymptom = (qId: string, symId: string) => toggleMulti(qId, symId)
const isSymptomChecked = (qId: string, symId: string) => isChecked(qId, symId)

const symptomPickerQuestion = computed(() => questions.value.find(q => q.type === 'symptom_picker'))
const selectedSymptomIds = computed<string[]>(() => {
  const id = symptomPickerQuestion.value?.id
  return id ? ((answers.value[id] as string[]) ?? []) : []
})
const allSymptomLabels = computed(() => {
  const flat: Record<string, string> = {}
  for (const g of symptomGroups) for (const o of g.options) flat[o.id] = o.label
  return flat
})

const getTimeline = (qId: string, symId: string): string => {
  try {
    const obj: Record<string, string> = answers.value[qId] ? JSON.parse(answers.value[qId] as string) : {}
    return obj[symId] ?? ''
  } catch { return '' }
}
const setTimeline = (qId: string, symId: string, val: string) => {
  try {
    const obj: Record<string, string> = answers.value[qId] ? JSON.parse(answers.value[qId] as string) : {}
    obj[symId] = val
    answers.value[qId] = JSON.stringify(obj)
    delete errors.value[qId]
  } catch {
    answers.value[qId] = JSON.stringify({ [symId]: val })
    delete errors.value[qId]
  }
}

const getScale = (id: string): number => parseInt(answers.value[id] as string) || 0
const setScale = (id: string, val: number) => { answers.value[id] = String(val); delete errors.value[id] }
const scaleLabel = (id: string): string => {
  const v = getScale(id)
  if (v <= 2) return 'Très peu inquiet'
  if (v <= 4) return 'Peu inquiet'
  if (v <= 6) return 'Modérément inquiet'
  if (v <= 8) return 'Assez inquiet'
  return 'Très inquiet'
}

// ── Validation ───────────────────────────────────────────────────────────────

const validateQuestions = (qs: Question[]): Record<string, string> => {
  const errs: Record<string, string> = {}
  for (const q of qs) {
    if (!q.required) continue
    const val = answers.value[q.id]

    if (q.type === 'symptom_picker' || q.type === 'allergy_picker' || q.type === 'antecedent_picker') {
      if (!val || (Array.isArray(val) && val.length === 0)) errs[q.id] = 'Sélectionnez au moins une option.'
    } else if (q.type === 'symptom_timeline') {
      const syms = selectedSymptomIds.value
      if (syms.length === 0) continue
      try {
        const obj: Record<string, string> = val ? JSON.parse(val as string) : {}
        if (syms.some(s => !obj[s])) errs[q.id] = 'Indiquez la durée pour chaque symptôme.'
      } catch { errs[q.id] = 'Indiquez la durée pour chaque symptôme.' }
    } else if (q.type === 'scale') {
      if (!val || val === '0') errs[q.id] = 'Ce champ est requis.'
    } else {
      const empty = !val || (Array.isArray(val) ? val.length === 0 : (val as string).trim() === '')
      if (empty) errs[q.id] = 'Ce champ est requis.'
    }
  }
  return errs
}

// ── Navigation ───────────────────────────────────────────────────────────────

const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

const goNext = () => {
  submitError.value = ''
  const stepErrs = validateQuestions(currentStep.value.questions)

  // NIR is only required on the first step
  if (currentStepIndex.value === 0 && !nir.value.trim()) {
    stepErrs['nir'] = 'Le numéro de sécurité sociale est requis.'
  }

  if (Object.keys(stepErrs).length > 0) {
    errors.value = { ...errors.value, ...stepErrs }
    return
  }

  currentStepIndex.value++
  scrollTop()
}

const goPrev = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
    scrollTop()
  }
}

const submit = async () => {
  submitError.value = ''
  const stepErrs = validateQuestions(currentStep.value.questions)
  if (Object.keys(stepErrs).length > 0) {
    errors.value = { ...errors.value, ...stepErrs }
    return
  }

  isSubmitting.value = true
  try {
    if (!responseId.value || !diagnosisId.value) throw new Error('Session invalide, rechargez la page.')

    const timelineQuestionIds = new Set(
      questions.value.filter(q => q.type === 'symptom_timeline').map(q => q.id)
    )
    const responses = Object.entries(answers.value).flatMap(([question_id, value]) => {
      if (timelineQuestionIds.has(question_id)) {
        return value ? [{ question_id, value: value as string }] : []
      }
      const values = Array.isArray(value) ? value : [value]
      return values.filter(Boolean).map(v => ({ question_id, value: v }))
    })

    const res = await fetch(`${API_BASE_URL}/diagnosis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response_id: responseId.value, responses, nir: nir.value || undefined }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erreur')
    await router.push(`/results/${diagnosisId.value}?token=${encodeURIComponent(token)}`)
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : "Erreur lors de l'envoi."
    isSubmitting.value = false
  }
}

onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/sessions/${token}`)
    if (res.status === 404) { sessionStatus.value = 'not_found'; return }
    if (res.status === 410) { sessionStatus.value = 'expired'; return }
    if (res.status === 409) { sessionStatus.value = 'completed'; return }
    if (!res.ok) { sessionStatus.value = 'not_found'; return }
    const data = await res.json()
    questions.value = data.questions ?? []
    responseId.value = data.responseId ?? null
    diagnosisId.value = data.diagnosisId ?? null
    sessionStatus.value = 'valid'
  } catch {
    sessionStatus.value = 'not_found'
  }
})
</script>

<template>
  <ViewportShell>

    <!-- Loading state -->
    <div v-if="sessionStatus === 'loading'" class="flex flex-1 items-center justify-center p-8">
      <p class="text-sm text-[var(--color-muted-strong)]">Vérification du lien…</p>
    </div>

    <!-- Error states -->
    <div v-else-if="sessionStatus !== 'valid'" class="flex flex-1 items-center justify-center p-8">
      <div class="space-y-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-center shadow-sm">
        <h1 class="text-lg font-semibold text-[var(--color-ink)]">
          <template v-if="sessionStatus === 'expired'">Lien expiré</template>
          <template v-else-if="sessionStatus === 'completed'">Formulaire déjà soumis</template>
          <template v-else>Lien introuvable</template>
        </h1>
        <p class="text-sm text-[var(--color-ink-2)]">
          <template v-if="sessionStatus === 'expired'">Ce lien a expiré. Contactez votre médecin pour en obtenir un nouveau.</template>
          <template v-else-if="sessionStatus === 'completed'">Vous avez déjà rempli ce questionnaire. Votre médecin a bien reçu vos réponses.</template>
          <template v-else>Ce lien n'existe pas ou a été supprimé.</template>
        </p>
      </div>
    </div>

    <!-- Valid form — multi-step -->
    <template v-else>
      <!-- Sticky header with progress bar -->
      <header class="sticky top-0 z-20 bg-[var(--color-surface)]/90 backdrop-blur-md border-b border-[var(--color-line)] px-4 pt-3 pb-3">
        <div class="flex items-center justify-between mb-2.5">
          <Brand />
          <span class="text-[12px] font-semibold tabular-nums text-[var(--color-muted-strong)]">
            {{ currentStepIndex + 1 }}<span class="opacity-50"> / {{ totalSteps }}</span>
          </span>
        </div>
        <!-- Progress bar -->
        <div class="h-1 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
          <div
            class="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            :style="`width: ${progress}%`"
            role="progressbar"
            :aria-valuenow="progress"
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
      </header>

      <!-- Scrollable step content -->
      <main class="flex-1 px-4 pb-36 pt-7">
        <!-- Step title -->
        <div class="mb-7">
          <h1 class="font-display text-[28px] font-semibold leading-tight tracking-[-0.02em] text-[var(--color-ink)]">
            {{ currentStep.title }}
          </h1>
        </div>

        <form novalidate @submit.prevent class="space-y-4">
          <!-- NIR field — only on the first step -->
          <div v-if="currentStepIndex === 0" class="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 space-y-3">
            <div>
              <label for="nir" class="block text-[15px] font-semibold text-[var(--color-ink)]">
                Numéro de sécurité sociale
                <span class="text-[var(--color-destructive)] ml-0.5" aria-hidden="true">*</span>
              </label>
              <p class="mt-0.5 text-[13px] text-[var(--color-ink-2)]">Permet à votre médecin de regrouper les consultations dans un même dossier.</p>
            </div>
            <input
              id="nir"
              v-model="nir"
              type="text"
              inputmode="numeric"
              maxlength="15"
              placeholder="2 05 12 75 123 456 78"
              :class="[
                'h-11 w-full rounded-xl border bg-[var(--color-bg)] px-3.5 text-sm outline-none transition-[border-color,box-shadow]',
                errors['nir']
                  ? 'border-[var(--color-destructive)]'
                  : 'border-[var(--color-line-2)] focus-visible:border-primary focus-visible:shadow-[var(--shadow-input-focus)]',
              ]"
              @input="delete errors['nir']"
            />
            <p v-if="errors['nir']" class="text-[12px] text-[var(--color-destructive)]" role="alert">{{ errors['nir'] }}</p>
          </div>

          <!-- Questions for current step -->
          <Transition name="step" mode="out-in">
            <div :key="currentStepIndex" class="space-y-4">
              <div
                v-for="q in currentStep.questions"
                :key="q.id"
                class="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 space-y-4"
                :class="{ 'border-[var(--color-destructive)]': errors[q.id] }"
              >
                <!-- Question header -->
                <div>
                  <label :for="`q-${q.id}`" class="block text-[15px] font-semibold leading-snug text-[var(--color-ink)]">
                    {{ q.label }}
                    <span v-if="q.required" class="text-[var(--color-destructive)] ml-0.5" aria-hidden="true">*</span>
                  </label>
                </div>

                <!-- Text court -->
                <input
                  v-if="q.type === 'text'"
                  :id="`q-${q.id}`"
                  type="text"
                  :value="(getAnswer(q.id) as string)"
                  class="h-11 w-full rounded-xl border border-[var(--color-line-2)] bg-[var(--color-bg)] px-3.5 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:shadow-[var(--shadow-input-focus)]"
                  @input="setAnswer(q.id, ($event.target as HTMLInputElement).value)"
                />

                <!-- Textarea -->
                <textarea
                  v-else-if="q.type === 'textarea'"
                  :id="`q-${q.id}`"
                  rows="4"
                  :value="(getAnswer(q.id) as string)"
                  class="w-full rounded-xl border border-[var(--color-line-2)] bg-[var(--color-bg)] px-3.5 py-3 text-sm outline-none transition-[border-color,box-shadow] resize-none focus-visible:border-primary focus-visible:shadow-[var(--shadow-input-focus)]"
                  @input="setAnswer(q.id, ($event.target as HTMLTextAreaElement).value)"
                />

                <!-- Date -->
                <input
                  v-else-if="q.type === 'date'"
                  :id="`q-${q.id}`"
                  type="date"
                  :value="(getAnswer(q.id) as string)"
                  class="h-11 rounded-xl border border-[var(--color-line-2)] bg-[var(--color-bg)] px-3.5 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:shadow-[var(--shadow-input-focus)]"
                  @input="setAnswer(q.id, ($event.target as HTMLInputElement).value)"
                />

                <!-- Choix unique -->
                <div v-else-if="q.type === 'single_choice'" class="space-y-2">
                  <label
                    v-for="opt in q.options"
                    :key="opt"
                    :class="[
                      'flex items-center justify-between rounded-xl border px-4 py-3.5 text-sm cursor-pointer transition-all',
                      getAnswer(q.id) === opt
                        ? 'border-primary bg-[var(--color-primary-soft)] text-primary font-medium'
                        : 'border-[var(--color-line)] bg-[var(--color-bg)] hover:border-[var(--color-line-2)] hover:bg-[var(--color-surface-2)]',
                    ]"
                  >
                    <span>{{ opt }}</span>
                    <span
                      v-if="getAnswer(q.id) === opt"
                      class="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px] shrink-0"
                    >✓</span>
                    <span v-else class="h-5 w-5 rounded-full border border-[var(--color-line-2)] shrink-0" />
                    <input type="radio" :name="`q-${q.id}`" :value="opt" :checked="getAnswer(q.id) === opt" class="sr-only" @change="setAnswer(q.id, opt)" />
                  </label>
                </div>

                <!-- Choix multiple -->
                <div v-else-if="q.type === 'multiple_choice'" class="space-y-2">
                  <label
                    v-for="opt in q.options"
                    :key="opt"
                    :class="[
                      'flex items-center justify-between rounded-xl border px-4 py-3.5 text-sm cursor-pointer transition-all',
                      isChecked(q.id, opt)
                        ? 'border-primary bg-[var(--color-primary-soft)] text-primary font-medium'
                        : 'border-[var(--color-line)] bg-[var(--color-bg)] hover:border-[var(--color-line-2)] hover:bg-[var(--color-surface-2)]',
                    ]"
                  >
                    <span>{{ opt }}</span>
                    <span
                      v-if="isChecked(q.id, opt)"
                      class="flex h-5 w-5 items-center justify-center rounded-md bg-primary text-white text-[10px] shrink-0"
                    >✓</span>
                    <span v-else class="h-5 w-5 rounded-md border border-[var(--color-line-2)] shrink-0" />
                    <input type="checkbox" :checked="isChecked(q.id, opt)" class="sr-only" @change="toggleMulti(q.id, opt)" />
                  </label>
                </div>

                <!-- Symptom picker -->
                <div v-else-if="q.type === 'symptom_picker'" class="space-y-5">
                  <div v-for="group in symptomGroups" :key="group.id" class="space-y-2.5">
                    <p class="text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--color-muted-strong)]">{{ group.label }}</p>
                    <div class="flex flex-wrap gap-2">
                      <label
                        v-for="opt in group.options"
                        :key="opt.id"
                        :class="[
                          'flex cursor-pointer items-center rounded-full border px-4 py-2 text-[13px] font-medium transition-all',
                          isSymptomChecked(q.id, opt.id)
                            ? 'border-primary bg-[var(--color-primary-soft)] text-primary'
                            : 'border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-ink)] hover:border-[var(--color-line-2)] hover:bg-[var(--color-surface-2)]',
                        ]"
                      >
                        <input type="checkbox" :checked="isSymptomChecked(q.id, opt.id)" class="sr-only" @change="toggleSymptom(q.id, opt.id)" />
                        {{ opt.label }}
                      </label>
                    </div>
                  </div>
                  <p class="text-[12px] text-[var(--color-muted-strong)]">Sélectionnez tous les symptômes présents.</p>
                </div>

                <!-- Symptom timeline -->
                <div v-else-if="q.type === 'symptom_timeline'" class="space-y-4">
                  <div v-if="selectedSymptomIds.length === 0" class="rounded-xl border border-dashed border-[var(--color-line-2)] bg-[var(--color-bg)] px-4 py-4 text-sm text-[var(--color-muted-strong)] text-center">
                    Sélectionnez d'abord des symptômes à l'étape précédente.
                  </div>
                  <div v-else v-for="symId in selectedSymptomIds" :key="symId" class="space-y-2.5 rounded-xl bg-[var(--color-bg)] p-3.5">
                    <p class="text-[13px] font-semibold text-[var(--color-ink)]">{{ allSymptomLabels[symId] ?? symId }}</p>
                    <div class="flex flex-wrap gap-1.5">
                      <label
                        v-for="opt in timelineOptions"
                        :key="opt.id"
                        :class="[
                          'flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all',
                          getTimeline(q.id, symId) === opt.id
                            ? 'border-primary bg-[var(--color-primary-soft)] text-primary'
                            : 'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-2)] hover:bg-[var(--color-surface-2)]',
                        ]"
                      >
                        <input type="radio" :checked="getTimeline(q.id, symId) === opt.id" class="sr-only" @change="setTimeline(q.id, symId, opt.id)" />
                        {{ opt.label }}
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Allergy picker -->
                <div v-else-if="q.type === 'allergy_picker'" class="flex flex-wrap gap-2">
                  <label
                    v-for="opt in [...allergyOptions, { id: 'none', label: 'Aucune allergie connue' }]"
                    :key="opt.id"
                    :class="[
                      'flex cursor-pointer items-center rounded-full border px-4 py-2 text-[13px] font-medium transition-all',
                      isChecked(q.id, opt.id)
                        ? 'border-primary bg-[var(--color-primary-soft)] text-primary'
                        : 'border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-ink)] hover:border-[var(--color-line-2)] hover:bg-[var(--color-surface-2)]',
                    ]"
                  >
                    <input type="checkbox" :checked="isChecked(q.id, opt.id)" class="sr-only" @change="toggleMulti(q.id, opt.id)" />
                    {{ opt.label }}
                  </label>
                </div>

                <!-- Antecedent picker -->
                <div v-else-if="q.type === 'antecedent_picker'" class="flex flex-wrap gap-2">
                  <label
                    v-for="opt in [...antecedentOptions, { id: 'none', label: 'Aucun antécédent' }]"
                    :key="opt.id"
                    :class="[
                      'flex cursor-pointer items-center rounded-full border px-4 py-2 text-[13px] font-medium transition-all',
                      isChecked(q.id, opt.id)
                        ? 'border-primary bg-[var(--color-primary-soft)] text-primary'
                        : 'border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-ink)] hover:border-[var(--color-line-2)] hover:bg-[var(--color-surface-2)]',
                    ]"
                  >
                    <input type="checkbox" :checked="isChecked(q.id, opt.id)" class="sr-only" @change="toggleMulti(q.id, opt.id)" />
                    {{ opt.label }}
                  </label>
                </div>

                <!-- Scale -->
                <div v-else-if="q.type === 'scale'" class="space-y-5">
                  <div class="flex flex-col items-center gap-1 py-2">
                    <span
                      :class="[
                        'text-7xl font-bold tabular-nums leading-none transition-colors duration-200',
                        getScale(q.id) > 0 ? 'text-primary' : 'text-[var(--color-line-2)]',
                      ]"
                    >{{ getScale(q.id) > 0 ? getScale(q.id) : '—' }}</span>
                    <p class="mt-1.5 text-[13px] font-medium text-[var(--color-ink-2)]">
                      {{ getScale(q.id) === 0 ? 'Déplacez le curseur' : scaleLabel(q.id) }}
                    </p>
                  </div>
                  <input
                    type="range"
                    :id="`q-${q.id}`"
                    min="1"
                    max="10"
                    step="1"
                    :value="getScale(q.id) > 0 ? getScale(q.id) : 5"
                    class="w-full cursor-pointer accent-primary"
                    @input="setScale(q.id, parseInt(($event.target as HTMLInputElement).value))"
                  />
                  <div class="flex justify-between text-[11px] text-[var(--color-muted-strong)] font-medium">
                    <span>1 – Pas inquiet</span>
                    <span>10 – Très inquiet</span>
                  </div>
                </div>

                <p v-if="errors[q.id]" class="text-[12px] font-medium text-[var(--color-destructive)]" role="alert">{{ errors[q.id] }}</p>
              </div>
            </div>
          </Transition>

          <p v-if="submitError" class="text-sm text-[var(--color-destructive)] text-center" role="alert">{{ submitError }}</p>
        </form>
      </main>

      <!-- Sticky navigation footer -->
      <footer class="fixed bottom-0 inset-x-0 z-20 bg-[var(--color-surface)]/90 backdrop-blur-md border-t border-[var(--color-line)] px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div class="mx-auto flex max-w-[440px] gap-2.5">
          <Button
            v-if="currentStepIndex > 0"
            variant="secondary"
            size="md"
            class="shrink-0 rounded-xl"
            :disabled="isSubmitting"
            @click="goPrev"
          >
            ← Retour
          </Button>
          <Button
            size="md"
            :block="true"
            class="rounded-xl font-semibold"
            :disabled="isSubmitting"
            @click="isLastStep ? submit() : goNext()"
          >
            <template v-if="isLastStep">
              {{ isSubmitting ? 'Envoi en cours…' : 'Envoyer mes réponses' }}
            </template>
            <template v-else>
              Continuer
            </template>
          </Button>
        </div>
      </footer>
    </template>
  </ViewportShell>
</template>

<style scoped>
.step-enter-active,
.step-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.step-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.step-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}
</style>
