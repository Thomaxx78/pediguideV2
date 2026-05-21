<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import {
  Activity,
  AlignLeft,
  AlertCircle,
  BarChart2,
  Calendar,
  CircleDot,
  Clock,
  GripVertical,
  ListChecks,
  Minus,
  Stethoscope,
  Type,
  type LucideIcon,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Chip } from '@/components/ui/chip'
import { API_BASE_URL } from '@/services/api'
import { randomUUID } from '@/lib/uuid'

const route = useRoute()
const router = useRouter()

type QuestionType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'single_choice'
  | 'multiple_choice'
  | 'symptom_picker'
  | 'symptom_timeline'
  | 'allergy_picker'
  | 'antecedent_picker'
  | 'scale'
  | 'step_break'

interface Question {
  id: string
  type: QuestionType
  label: string
  required: boolean
  options?: string[]
}

const isNew = route.params.id === 'nouveau'
const fromDefault = route.query.from === 'default'

const title = ref('')
const description = ref('')
const questions = ref<Question[]>([])
const activeId = ref<string | null>(null)
const isSaving = ref(false)
const isLoading = ref(!isNew)
const error = ref('')

const activeIndex = computed<number>({
  get: () => {
    if (!activeId.value) return 0
    const i = questions.value.findIndex((q) => q.id === activeId.value)
    return i === -1 ? 0 : i
  },
  set: (next: number) => {
    const q = questions.value[next]
    if (q) activeId.value = q.id
  },
})

const setActive = (id: string) => {
  activeId.value = id
}

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('authToken')}`,
})

const typeOptions: { value: QuestionType; label: string; icon: LucideIcon; rich?: boolean; hint?: string }[] = [
  { value: 'text',             label: 'Texte court',               icon: Type },
  { value: 'textarea',         label: 'Texte long',                icon: AlignLeft },
  { value: 'date',             label: 'Date',                      icon: Calendar },
  { value: 'single_choice',   label: 'Choix unique',              icon: CircleDot },
  { value: 'multiple_choice', label: 'Choix multiple',            icon: ListChecks },
  { value: 'symptom_picker',   label: 'Sélecteur de symptômes',   icon: Activity,    rich: true, hint: 'Grille de symptômes pré-remplie (Général, Respiratoire, Digestif, Peau & ORL)' },
  { value: 'symptom_timeline', label: 'Chronologie des symptômes',icon: Clock,        rich: true, hint: 'Pour chaque symptôme coché, demande "depuis combien de temps ?"' },
  { value: 'allergy_picker',   label: 'Allergies connues',        icon: AlertCircle, rich: true, hint: 'Liste pré-remplie des allergies courantes' },
  { value: 'antecedent_picker',label: 'Antécédents médicaux',     icon: Stethoscope, rich: true, hint: 'Liste pré-remplie des antécédents (asthme, eczéma…)' },
  { value: 'scale',            label: 'Échelle 1 – 10',           icon: BarChart2,   rich: true, hint: "Curseur d'intensité (ex : niveau d'inquiétude)" },
]

const typeLabelByValue: Record<QuestionType, string> = {
  ...Object.fromEntries(typeOptions.map((t) => [t.value, t.label])),
  step_break: 'Séparateur d\'étape',
} as Record<QuestionType, string>

const activeQuestion = computed<Question | null>(() => {
  if (activeIndex.value < 0 || activeIndex.value >= questions.value.length) return null
  return questions.value[activeIndex.value] ?? null
})

const richTypes: QuestionType[] = ['symptom_picker', 'symptom_timeline', 'allergy_picker', 'antecedent_picker', 'scale']

// Counts excluding step_breaks
const questionCount = computed(() => questions.value.filter(q => q.type !== 'step_break').length)
const stepCount = computed(() => questions.value.filter(q => q.type === 'step_break').length)

// Map question id to its display number (skipping step_breaks)
const questionNumbers = computed(() => {
  const nums: Record<string, number> = {}
  let count = 0
  for (const q of questions.value) {
    if (q.type !== 'step_break') {
      count++
      nums[q.id] = count
    }
  }
  return nums
})

const setActiveType = (value: QuestionType) => {
  const q = activeQuestion.value
  if (!q || q.type === 'step_break') return
  q.type = value
  if (value === 'single_choice' || value === 'multiple_choice') {
    if (!q.options?.length) q.options = ['Option 1', 'Option 2']
  } else {
    q.options = []
  }
}

const toggleRequired = () => {
  const q = activeQuestion.value
  if (q && q.type !== 'step_break') q.required = !q.required
}

const addQuestion = () => {
  const newQ: Question = { id: randomUUID(), type: 'text', label: '', required: false, options: [] }
  questions.value.push(newQ)
  activeId.value = newQ.id
}

const addStepBreak = () => {
  const newQ: Question = { id: randomUUID(), type: 'step_break', label: '', required: false }
  questions.value.push(newQ)
  activeId.value = newQ.id
}

const removeQuestion = (index: number) => {
  const removed = questions.value[index]
  questions.value.splice(index, 1)
  if (removed && removed.id === activeId.value) {
    const next = questions.value[index] ?? questions.value[index - 1]
    activeId.value = next?.id ?? null
  }
}

const moveUp = (index: number) => {
  if (index === 0) return
  const [q] = questions.value.splice(index, 1)
  if (q === undefined) return
  questions.value.splice(index - 1, 0, q)
}

const moveDown = (index: number) => {
  if (index === questions.value.length - 1) return
  const [q] = questions.value.splice(index, 1)
  if (q === undefined) return
  questions.value.splice(index + 1, 0, q)
}

const addOption = () => {
  const q = activeQuestion.value
  if (!q || q.type === 'step_break') return
  if (!q.options) q.options = []
  q.options.push('')
}

const removeOption = (i: number) => {
  const q = activeQuestion.value
  q?.options?.splice(i, 1)
}

const loadDefaultTemplate = () => {
  questions.value = [
    { id: randomUUID(), type: 'step_break',      label: 'Informations enfant',          required: false },
    { id: randomUUID(), type: 'text',            label: "Prénom de l'enfant",           required: true },
    { id: randomUUID(), type: 'text',            label: "Nom de l'enfant",              required: true },
    { id: randomUUID(), type: 'date',            label: 'Date de naissance',            required: true },
    { id: randomUUID(), type: 'single_choice',   label: 'Genre',                        required: false, options: ['Fille', 'Garçon', 'Autre'] },
    { id: randomUUID(), type: 'step_break',      label: 'Motif de consultation',        required: false },
    { id: randomUUID(), type: 'textarea',        label: 'Motif de consultation',        required: true },
    { id: randomUUID(), type: 'step_break',      label: 'Symptômes',                    required: false },
    { id: randomUUID(), type: 'symptom_picker',  label: 'Symptômes présents',           required: true },
    { id: randomUUID(), type: 'symptom_timeline',label: 'Depuis combien de temps ?',    required: true },
    { id: randomUUID(), type: 'multiple_choice', label: 'Signes cliniques observés',    required: false, options: ['Fièvre > 39°C', 'Difficultés respiratoires', 'Raideur de nuque', 'Convulsions', 'Éruption cutanée', 'Douleur abdominale intense'] },
    { id: randomUUID(), type: 'multiple_choice', label: 'Changements de comportement',  required: false, options: ['Pleurs inhabituels', 'Agitation', 'Somnolence excessive', "Perte d'appétit", 'Irritabilité'] },
    { id: randomUUID(), type: 'step_break',      label: 'Antécédents & traitements',    required: false },
    { id: randomUUID(), type: 'allergy_picker',  label: 'Allergies connues',            required: false },
    { id: randomUUID(), type: 'antecedent_picker',label: 'Antécédents médicaux',        required: false },
    { id: randomUUID(), type: 'textarea',        label: 'Traitements en cours',         required: false },
    { id: randomUUID(), type: 'step_break',      label: "Niveau d'urgence",             required: false },
    { id: randomUUID(), type: 'scale',           label: "Niveau d'inquiétude (1 à 10)", required: true },
    { id: randomUUID(), type: 'textarea',        label: 'Informations complémentaires', required: false },
  ]
  activeId.value = questions.value[0]?.id ?? null
}

const save = async () => {
  if (!title.value.trim()) { error.value = 'Le titre est requis.'; return }
  if (questions.value.filter(q => q.type !== 'step_break').length === 0) { error.value = 'Ajoutez au moins une question.'; return }
  error.value = ''
  isSaving.value = true

  try {
    const body = { title: title.value, description: description.value, questions: questions.value }
    const url = isNew ? `${API_BASE_URL}/templates` : `${API_BASE_URL}/templates/${route.params.id}`
    const method = isNew ? 'POST' : 'PUT'

    const res = await fetch(url, { method, headers: authHeader(), body: JSON.stringify(body) })
    if (!res.ok) throw new Error('Erreur sauvegarde')
    router.push('/dashboard/formulaires')
  } catch {
    error.value = 'Erreur lors de la sauvegarde.'
  } finally {
    isSaving.value = false
  }
}

watch([questions, activeId], () => {
  if (!questions.value.length) {
    activeId.value = null
    return
  }
  if (!activeId.value || !questions.value.some((q) => q.id === activeId.value)) {
    activeId.value = questions.value[0]?.id ?? null
  }
}, { deep: true })

onMounted(async () => {
  if (isNew) {
    if (fromDefault) {
      loadDefaultTemplate()
    } else if (!questions.value.length) {
      addQuestion()
    }
    return
  }

  try {
    const res = await fetch(`${API_BASE_URL}/templates/${route.params.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
    })
    const data = await res.json()
    title.value = data.title ?? ''
    description.value = data.description ?? ''
    questions.value = (data.questions ?? []) as Question[]
    if (!questions.value.filter(q => q.type !== 'step_break').length) addQuestion()
  } catch {
    error.value = 'Impossible de charger le formulaire.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="flex min-h-[calc(100vh-64px)] flex-col bg-[var(--color-bg)]">
    <!-- Top utility bar -->
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 md:px-6">
      <div class="flex flex-col">
        <p class="text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
          Modèle · Brouillon
        </p>
        <p class="text-[14.5px] font-medium text-[var(--color-ink)]">
          {{ title || (isNew ? 'Nouveau formulaire' : 'Modifier le formulaire') }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" @click="router.push('/dashboard/formulaires')">
          Annuler
        </Button>
        <Button size="sm" :disabled="isSaving" @click="save">
          {{ isSaving ? 'Enregistrement…' : 'Enregistrer' }}
        </Button>
      </div>
    </header>

    <div v-if="isLoading" class="p-8 text-center text-sm text-[var(--color-ink-2)]">Chargement…</div>

    <template v-else>
      <!-- 3-pane shell ≥ lg, single column < lg -->
      <div class="grid flex-1 lg:grid-cols-[280px_1fr_320px]">
        <!-- LEFT — question list (desktop) -->
        <aside class="hidden border-r border-[var(--color-line)] bg-[var(--color-surface)] p-5 lg:flex lg:flex-col lg:gap-3">
          <div class="border-b border-[var(--color-line)] pb-3">
            <p class="font-display text-[15px] font-medium text-[var(--color-ink)]">
              {{ questionCount }} question{{ questionCount > 1 ? 's' : '' }}
              <span v-if="stepCount > 0" class="text-[var(--color-muted-strong)]">· {{ stepCount }} étape{{ stepCount > 1 ? 's' : '' }}</span>
            </p>
            <p class="text-[12px] text-[var(--color-muted-strong)]">
              Cliquez pour modifier
            </p>
          </div>

          <VueDraggable
            v-model="questions"
            tag="ol"
            handle=".pg-q-grip"
            :animation="160"
            ghost-class="pg-drag-ghost"
            chosen-class="pg-drag-chosen"
            class="flex flex-col gap-1"
          >
            <li v-for="(q, i) in questions" :key="q.id">
              <!-- Step break separator -->
              <div
                v-if="q.type === 'step_break'"
                :aria-current="i === activeIndex ? 'true' : undefined"
                :class="[
                  'group flex w-full items-center gap-2 rounded-[var(--r-sm)] border px-2.5 py-2 cursor-pointer transition-colors',
                  i === activeIndex
                    ? 'border-[color-mix(in_oklab,var(--color-primary-base)_30%,transparent)] bg-[var(--color-primary-soft)]'
                    : 'border-transparent hover:bg-[var(--color-surface-2)]',
                ]"
                @click="setActive(q.id)"
              >
                <button
                  type="button"
                  class="pg-q-grip inline-flex size-6 items-center justify-center rounded-[4px] text-[var(--color-muted-strong)] cursor-grab active:cursor-grabbing hover:text-[var(--color-ink)] hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-ring/45"
                  aria-label="Réordonner"
                  tabindex="-1"
                >
                  <GripVertical class="size-4" aria-hidden="true" />
                </button>
                <Minus class="size-3.5 shrink-0 text-[var(--color-muted-strong)]" aria-hidden="true" />
                <span class="truncate text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted-strong)]">
                  {{ q.label || 'Nouvelle étape' }}
                </span>
              </div>

              <!-- Regular question -->
              <div
                v-else
                :aria-current="i === activeIndex ? 'true' : undefined"
                :class="[
                  'group grid w-full grid-cols-[auto_24px_1fr_auto] items-center gap-2.5 rounded-[var(--r-sm)] border px-2.5 py-2 text-left transition-colors',
                  i === activeIndex
                    ? 'border-[color-mix(in_oklab,var(--color-primary-base)_30%,transparent)] bg-[var(--color-primary-soft)]'
                    : 'border-transparent hover:bg-[var(--color-surface-2)]',
                ]"
              >
                <button
                  type="button"
                  class="pg-q-grip inline-flex size-6 items-center justify-center rounded-[4px] text-[var(--color-muted-strong)] cursor-grab active:cursor-grabbing hover:text-[var(--color-ink)] hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-ring/45"
                  aria-label="Réordonner cette question (maintenir et glisser)"
                  tabindex="-1"
                >
                  <GripVertical class="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  :class="[
                    'inline-flex size-[22px] items-center justify-center rounded-full text-[11px] font-medium',
                    i === activeIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-ink-2)]',
                  ]"
                  @click="setActive(q.id)"
                  :aria-label="`Question ${questionNumbers[q.id]}`"
                >{{ questionNumbers[q.id] }}</button>
                <button
                  type="button"
                  class="min-w-0 text-left"
                  @click="setActive(q.id)"
                >
                  <span class="block truncate text-[13.5px] font-medium text-[var(--color-ink)]">
                    {{ q.label || 'Question sans titre' }}
                  </span>
                  <span class="block truncate text-[11.5px] text-[var(--color-muted-strong)]">
                    {{ typeLabelByValue[q.type] }}
                  </span>
                </button>
                <span
                  v-if="q.required"
                  class="text-[10px] font-semibold uppercase tracking-wide text-primary"
                  title="Obligatoire"
                >REQ</span>
              </div>
            </li>
          </VueDraggable>

          <button
            type="button"
            class="mt-1 inline-flex items-center justify-center gap-1.5 rounded-[var(--r-sm)] border border-dashed border-[var(--color-line-2)] bg-transparent px-3 py-2.5 text-[13px] text-[var(--color-ink-2)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
            @click="addQuestion"
          >
            + Ajouter une question
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-1.5 rounded-[var(--r-sm)] border border-dashed border-[var(--color-line-2)] bg-transparent px-3 py-2 text-[12.5px] text-[var(--color-muted-strong)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
            @click="addStepBreak"
          >
            <Minus class="size-3.5" aria-hidden="true" />
            Insérer une étape
          </button>

          <button
            type="button"
            class="mt-1 inline-flex items-center justify-center gap-1.5 rounded-[var(--r-sm)] bg-transparent px-3 py-2 text-[12.5px] text-[var(--color-muted-strong)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
            @click="loadDefaultTemplate"
          >
            Partir du modèle par défaut
          </button>
        </aside>

        <!-- CENTER — editor + preview -->
        <main class="flex flex-col gap-6 px-4 py-6 md:px-8 lg:py-8">
          <!-- Title + description -->
          <section class="space-y-2 border-b border-[var(--color-line)] pb-5">
            <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
              {{ isNew ? 'Nouveau modèle' : 'Modifier le modèle' }}
            </p>
            <input
              v-model="title"
              type="text"
              placeholder="Titre du formulaire — Ex. Consultation générale enfant"
              class="w-full bg-transparent font-display text-2xl font-medium tracking-[-0.018em] text-[var(--color-ink)] placeholder:text-[var(--color-line-2)] focus-visible:outline-none"
            />
            <input
              v-model="description"
              type="text"
              placeholder="Description (optionnel) — Ex. Pour les consultations de routine 0-6 ans"
              class="w-full bg-transparent text-[14px] text-[var(--color-ink-2)] placeholder:text-[var(--color-muted-strong)] focus-visible:outline-none"
            />
          </section>

          <!-- Mobile/tablet — question switcher bar -->
          <div class="flex flex-col gap-3 lg:hidden">
            <div class="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div class="flex gap-1.5" role="tablist" aria-label="Questions">
                <button
                  v-for="(q, i) in questions"
                  :key="q.id"
                  type="button"
                  role="tab"
                  :aria-pressed="i === activeIndex"
                  :class="[
                    'shrink-0 rounded-full border px-3 py-1.5 text-[12.5px]',
                    i === activeIndex
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-2)]',
                  ]"
                  @click="activeIndex = i"
                >
                  <template v-if="q.type === 'step_break'">— {{ q.label || 'Étape' }}</template>
                  <template v-else>
                    Q{{ questionNumbers[q.id] }}
                    <span v-if="q.required" aria-hidden="true" class="ml-1 inline-block size-1 rounded-full bg-current opacity-70"></span>
                  </template>
                </button>
                <button
                  type="button"
                  class="shrink-0 rounded-full border border-dashed border-[var(--color-line-2)] bg-transparent px-3 py-1.5 text-[12.5px] text-[var(--color-ink-2)]"
                  @click="addQuestion"
                >
                  + Question
                </button>
                <button
                  type="button"
                  class="shrink-0 rounded-full border border-dashed border-[var(--color-line-2)] bg-transparent px-3 py-1.5 text-[12.5px] text-[var(--color-ink-2)]"
                  @click="addStepBreak"
                >
                  — Étape
                </button>
              </div>
            </div>
          </div>

          <!-- Active question editor -->
          <article
            v-if="activeQuestion"
            class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 md:p-6"
          >
            <header class="flex items-center justify-between gap-3">
              <span class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
                <template v-if="activeQuestion.type === 'step_break'">Séparateur d'étape</template>
                <template v-else>Question {{ questionNumbers[activeQuestion.id] }}</template>
              </span>
              <div class="flex items-center gap-2 text-[12.5px] text-[var(--color-muted-strong)]">
                <button
                  type="button"
                  class="rounded-[var(--r-sm)] px-1.5 py-0.5 hover:bg-[var(--color-surface-2)] disabled:opacity-40"
                  :disabled="activeIndex === 0"
                  @click="moveUp(activeIndex)"
                  aria-label="Monter"
                >↑</button>
                <button
                  type="button"
                  class="rounded-[var(--r-sm)] px-1.5 py-0.5 hover:bg-[var(--color-surface-2)] disabled:opacity-40"
                  :disabled="activeIndex === questions.length - 1"
                  @click="moveDown(activeIndex)"
                  aria-label="Descendre"
                >↓</button>
                <button
                  type="button"
                  class="rounded-[var(--r-sm)] px-1.5 py-0.5 hover:bg-[var(--color-surface-2)] hover:text-destructive"
                  @click="removeQuestion(activeIndex)"
                  aria-label="Supprimer"
                >✕</button>
              </div>
            </header>

            <!-- Step break editor -->
            <template v-if="activeQuestion.type === 'step_break'">
              <Field class="mt-4">
                <FieldLabel for="step-label">Titre de l'étape</FieldLabel>
                <Input
                  id="step-label"
                  v-model="activeQuestion.label"
                  size="md"
                  placeholder="Ex : Symptômes, Antécédents…"
                />
              </Field>
              <p class="mt-3 rounded-[var(--r-sm)] bg-[var(--color-surface-2)] px-3 py-2.5 text-[12px] text-[var(--color-muted-strong)]">
                Ce séparateur définit le titre de la prochaine étape visible par les parents. Faites glisser pour le repositionner.
              </p>
              <section class="mt-5 rounded-[var(--r-md)] border border-[var(--color-line)] bg-[var(--color-surface-2)] p-4">
                <p class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">Aperçu</p>
                <div class="mt-3 flex items-center gap-3">
                  <div class="h-px flex-1 bg-[var(--color-line)]" />
                  <span class="text-[13px] font-semibold text-[var(--color-ink)]">{{ activeQuestion.label || 'Nouvelle étape' }}</span>
                  <div class="h-px flex-1 bg-[var(--color-line)]" />
                </div>
                <p class="mt-2 text-[11px] italic text-[var(--color-muted-strong)]">
                  Les questions suivantes apparaîtront dans cette étape côté parent.
                </p>
              </section>
            </template>

            <!-- Regular question editor -->
            <template v-else>
              <Field class="mt-4">
                <FieldLabel for="q-label">Libellé de la question</FieldLabel>
                <Input
                  id="q-label"
                  v-model="activeQuestion.label"
                  size="md"
                  placeholder="Ex. Quelle est la localisation principale de l'eczéma ?"
                />
              </Field>

              <!-- Options (single/multiple choice only) -->
              <div
                v-if="activeQuestion.type === 'single_choice' || activeQuestion.type === 'multiple_choice'"
                class="mt-5 space-y-2"
              >
                <p class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
                  Options de réponse
                </p>
                <VueDraggable
                  v-if="activeQuestion.options"
                  v-model="activeQuestion.options"
                  handle=".pg-opt-grip"
                  :animation="160"
                  ghost-class="pg-drag-ghost"
                  chosen-class="pg-drag-chosen"
                  class="flex flex-col gap-2"
                >
                  <div
                    v-for="(_opt, oi) in activeQuestion.options"
                    :key="`opt-${oi}`"
                    class="flex items-center gap-2"
                  >
                    <button
                      type="button"
                      class="pg-opt-grip inline-flex size-8 items-center justify-center rounded-[var(--r-sm)] text-[var(--color-muted-strong)] cursor-grab active:cursor-grabbing hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-ring/45"
                      aria-label="Réordonner cette option"
                      tabindex="-1"
                    >
                      <GripVertical class="size-4" aria-hidden="true" />
                    </button>
                    <Input
                      v-model="activeQuestion.options![oi]"
                      size="md"
                      :placeholder="`Option ${oi + 1}`"
                      class="flex-1"
                    />
                    <button
                      type="button"
                      class="rounded-[var(--r-sm)] px-2 py-1 text-[var(--color-muted-strong)] hover:bg-[var(--color-surface-2)] hover:text-destructive"
                      @click="removeOption(oi)"
                      aria-label="Supprimer cette option"
                    >✕</button>
                  </div>
                </VueDraggable>
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-dashed border-[var(--color-line-2)] bg-transparent px-3 py-2 text-[13px] text-[var(--color-ink-2)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
                  @click="addOption"
                >+ Ajouter une option</button>
              </div>

              <!-- Mobile-only type picker -->
              <div class="mt-5 lg:hidden">
                <p class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
                  Type de réponse
                </p>
                <div class="mt-2 flex flex-wrap gap-1.5">
                  <button
                    v-for="t in typeOptions"
                    :key="t.value"
                    type="button"
                    :aria-pressed="t.value === activeQuestion.type"
                    :class="[
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px]',
                      t.value === activeQuestion.type
                        ? 'border-primary bg-[var(--color-primary-soft)] text-primary'
                        : t.rich
                          ? 'border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-ink-2)]'
                          : 'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-2)]',
                    ]"
                    @click="setActiveType(t.value)"
                  >
                    <component :is="t.icon" class="size-3.5" aria-hidden="true" />
                    {{ t.label }}
                  </button>
                </div>
              </div>

              <!-- Mobile-only required toggle -->
              <label
                class="mt-5 flex items-center justify-between border-t border-[var(--color-line)] pt-4 text-[13.5px] text-[var(--color-ink)] lg:hidden"
              >
                <span>Réponse obligatoire</span>
                <input
                  type="checkbox"
                  :checked="activeQuestion.required"
                  class="size-4 accent-primary"
                  @change="toggleRequired"
                />
              </label>

              <!-- Live preview -->
              <section class="mt-6 rounded-[var(--r-md)] border border-[var(--color-line)] bg-[var(--color-surface-2)] p-5">
                <p class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
                  Aperçu côté parent
                </p>
                <div class="mt-3">
                  <p class="text-[14px] font-medium text-[var(--color-ink)]">
                    {{ activeQuestion.label || 'Question sans titre' }}
                    <span v-if="activeQuestion.required" class="text-[11px] font-normal text-[var(--color-muted-strong)]"> · obligatoire</span>
                  </p>

                  <input
                    v-if="activeQuestion.type === 'text'"
                    disabled
                    type="text"
                    placeholder="Réponse texte courte"
                    class="mt-2 h-10 w-full rounded-[var(--r-sm)] border border-[var(--color-line-2)] bg-[var(--color-surface)] px-3 text-[14px] text-[var(--color-muted-strong)]"
                  />
                  <textarea
                    v-else-if="activeQuestion.type === 'textarea'"
                    disabled
                    rows="3"
                    placeholder="Réponse texte longue"
                    class="mt-2 w-full rounded-[var(--r-md)] border border-[var(--color-line-2)] bg-[var(--color-surface)] px-3 py-2 text-[14px] text-[var(--color-muted-strong)]"
                  ></textarea>
                  <input
                    v-else-if="activeQuestion.type === 'date'"
                    disabled
                    type="date"
                    class="mt-2 h-10 w-full rounded-[var(--r-sm)] border border-[var(--color-line-2)] bg-[var(--color-surface)] px-3 text-[14px] text-[var(--color-muted-strong)]"
                  />
                  <div
                    v-else-if="activeQuestion.type === 'single_choice' || activeQuestion.type === 'multiple_choice'"
                    class="mt-2 flex flex-wrap gap-2"
                  >
                    <Chip
                      v-for="(opt, oi) in activeQuestion.options"
                      :key="oi"
                      :model-value="false"
                      :role="activeQuestion.type === 'single_choice' ? 'radio' : 'checkbox'"
                      disabled
                    >{{ opt || `Option ${oi + 1}` }}</Chip>
                  </div>

                  <!-- Rich type previews -->
                  <div v-else-if="activeQuestion.type === 'symptom_picker'" class="mt-3 space-y-2">
                    <div v-for="group in ['Général', 'Respiratoire', 'Digestif', 'Peau & ORL']" :key="group" class="rounded-[var(--r-sm)] border border-[var(--color-line)] p-2">
                      <p class="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">{{ group }}</p>
                      <div class="flex flex-wrap gap-1.5">
                        <span v-for="n in 4" :key="n" class="rounded-full border border-[var(--color-line-2)] px-2 py-0.5 text-[11px] text-[var(--color-muted-strong)]">Symptôme</span>
                      </div>
                    </div>
                  </div>

                  <div v-else-if="activeQuestion.type === 'symptom_timeline'" class="mt-3 space-y-1.5">
                    <div v-for="i in 2" :key="i" class="flex items-center justify-between rounded-[var(--r-sm)] border border-[var(--color-line)] px-3 py-2">
                      <span class="text-[12px] text-[var(--color-muted-strong)]">Symptôme {{ i }}</span>
                      <div class="flex gap-1">
                        <span v-for="t in ['Aujourd\'hui', 'Hier', '2-3j']" :key="t" class="rounded-full border border-[var(--color-line-2)] px-2 py-0.5 text-[10px] text-[var(--color-muted-strong)]">{{ t }}</span>
                      </div>
                    </div>
                    <p class="text-[11px] italic text-[var(--color-muted-strong)]">Affiché pour chaque symptôme sélectionné</p>
                  </div>

                  <div v-else-if="activeQuestion.type === 'allergy_picker'" class="mt-2 flex flex-wrap gap-1.5">
                    <span v-for="a in ['Arachide', 'Lait', 'Œuf', 'Pollen', 'Pénicilline', '+ autres…']" :key="a" class="rounded-full border border-[var(--color-line-2)] px-2 py-0.5 text-[11px] text-[var(--color-muted-strong)]">{{ a }}</span>
                  </div>

                  <div v-else-if="activeQuestion.type === 'antecedent_picker'" class="mt-2 flex flex-wrap gap-1.5">
                    <span v-for="a in ['Asthme', 'Eczéma', 'Allergie alim.', 'Diabète', '+ autres…']" :key="a" class="rounded-full border border-[var(--color-line-2)] px-2 py-0.5 text-[11px] text-[var(--color-muted-strong)]">{{ a }}</span>
                  </div>

                  <div v-else-if="activeQuestion.type === 'scale'" class="mt-3">
                    <div class="flex items-center justify-center py-2">
                      <span class="text-4xl font-bold text-primary">5</span>
                    </div>
                    <input type="range" min="1" max="10" value="5" disabled class="w-full" />
                    <div class="mt-1 flex justify-between text-[10px] text-[var(--color-muted-strong)]">
                      <span>Pas du tout</span><span>Extrêmement</span>
                    </div>
                  </div>
                </div>
              </section>
            </template>
          </article>
        </main>

        <!-- RIGHT — type picker + settings (desktop) -->
        <aside class="hidden border-l border-[var(--color-line)] bg-[var(--color-surface)] p-5 lg:flex lg:flex-col lg:gap-6 overflow-y-auto">
          <!-- Hide type picker and settings when editing a step_break -->
          <template v-if="activeQuestion && activeQuestion.type !== 'step_break'">
            <section>
              <h3 class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
                Types simples
              </h3>
              <div class="mt-3 grid grid-cols-2 gap-1.5">
                <button
                  v-for="t in typeOptions.filter(t => !t.rich)"
                  :key="t.value"
                  type="button"
                  :aria-pressed="activeQuestion ? t.value === activeQuestion.type : false"
                  :class="[
                    'flex flex-col items-center gap-1 rounded-[var(--r-sm)] border px-2 py-2.5 text-[12.5px] transition-colors',
                    activeQuestion && t.value === activeQuestion.type
                      ? 'border-[color-mix(in_oklab,var(--color-primary-base)_35%,transparent)] bg-[var(--color-primary-soft)] text-primary'
                      : 'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-2)] hover:border-[var(--color-line-2)] hover:text-[var(--color-ink)]',
                  ]"
                  @click="setActiveType(t.value)"
                >
                  <component :is="t.icon" class="size-4" aria-hidden="true" />
                  <span>{{ t.label }}</span>
                </button>
              </div>
            </section>

            <section>
              <h3 class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
                Blocs enrichis
              </h3>
              <div class="mt-3 flex flex-col gap-1.5">
                <button
                  v-for="t in typeOptions.filter(t => t.rich)"
                  :key="t.value"
                  type="button"
                  :aria-pressed="activeQuestion ? t.value === activeQuestion.type : false"
                  :title="t.hint"
                  :class="[
                    'flex items-center gap-2.5 rounded-[var(--r-sm)] border px-3 py-2 text-left text-[12.5px] transition-colors',
                    activeQuestion && t.value === activeQuestion.type
                      ? 'border-[color-mix(in_oklab,var(--color-primary-base)_35%,transparent)] bg-[var(--color-primary-soft)] text-primary'
                      : 'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-2)] hover:border-[var(--color-line-2)] hover:text-[var(--color-ink)]',
                  ]"
                  @click="setActiveType(t.value)"
                >
                  <component :is="t.icon" class="size-4 shrink-0" aria-hidden="true" />
                  <div>
                    <p class="font-medium leading-tight">{{ t.label }}</p>
                    <p class="text-[11px] leading-snug opacity-70">{{ t.hint }}</p>
                  </div>
                </button>
              </div>
            </section>

            <section>
              <h3 class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
                Paramètres
              </h3>
              <label class="mt-3 flex items-center justify-between border-t border-[var(--color-line)] pt-3 text-[13.5px] text-[var(--color-ink)]">
                <span>Réponse obligatoire</span>
                <input
                  type="checkbox"
                  :checked="activeQuestion.required"
                  class="size-4 accent-primary"
                  @change="toggleRequired"
                />
              </label>
            </section>
          </template>

          <!-- Step break hint in right panel -->
          <template v-else-if="activeQuestion && activeQuestion.type === 'step_break'">
            <section>
              <h3 class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
                Séparateur d'étape
              </h3>
              <p class="mt-3 text-[13px] leading-relaxed text-[var(--color-ink-2)]">
                Les séparateurs d'étape divisent le formulaire en plusieurs pages côté parent. Chaque séparateur définit le titre de l'étape qui suit.
              </p>
              <p class="mt-3 text-[12px] text-[var(--color-muted-strong)]">
                Faites glisser pour repositionner l'étape dans la liste.
              </p>
            </section>
          </template>

          <section class="mt-auto">
            <Button :block="true" size="md" :disabled="isSaving" @click="save">
              {{ isSaving ? 'Enregistrement…' : 'Enregistrer le formulaire' }}
            </Button>
            <p class="mt-3 text-[11.5px] leading-snug text-[var(--color-muted-strong)]">
              Une fois enregistré, vous pourrez l'envoyer à un parent depuis le tableau de bord.
            </p>
          </section>
        </aside>
      </div>

      <p v-if="error" class="px-4 pb-3 text-sm text-destructive md:px-6" role="alert">{{ error }}</p>

      <!-- Mobile sticky footer -->
      <footer class="sticky bottom-0 border-t border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 lg:hidden">
        <Button :block="true" size="md" :disabled="isSaving" @click="save">
          {{ isSaving ? 'Enregistrement…' : 'Enregistrer le formulaire' }}
        </Button>
      </footer>
    </template>
  </div>
</template>
