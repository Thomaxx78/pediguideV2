<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL } from '@/services/api'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()
const token = route.params.token as string

type QuestionType = 'text' | 'textarea' | 'date' | 'single_choice' | 'multiple_choice'
interface Question { id: string; type: QuestionType; label: string; required: boolean; options?: string[] }

const sessionStatus = ref<'loading' | 'valid' | 'expired' | 'completed' | 'not_found'>('loading')
const questions = ref<Question[]>([])
const answers = ref<Record<string, string | string[]>>({})
const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const submitError = ref('')
const nir = ref('')

const getAnswer = (id: string): string | string[] => answers.value[id] ?? ''
const setAnswer = (id: string, val: string | string[]) => { answers.value[id] = val; delete errors.value[id] }

const toggleMulti = (id: string, option: string) => {
  const current = (answers.value[id] as string[]) ?? []
  const idx = current.indexOf(option)
  if (idx === -1) setAnswer(id, [...current, option])
  else setAnswer(id, current.filter(o => o !== option))
}

const isChecked = (id: string, option: string) => ((answers.value[id] as string[]) ?? []).includes(option)

const validate = () => {
  const errs: Record<string, string> = {}
  for (const q of questions.value) {
    if (!q.required) continue
    const val = answers.value[q.id]
    const empty = !val || (Array.isArray(val) ? val.length === 0 : val.trim() === '')
    if (empty) errs[q.id] = 'Ce champ est requis.'
  }
  errors.value = errs
  return Object.keys(errs).length === 0
}

const submit = async () => {
  if (!validate()) return
  isSubmitting.value = true
  submitError.value = ''
  try {
    const res = await fetch(`${API_BASE_URL}/sessions/${token}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: answers.value, nir: nir.value || undefined }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erreur')
    await router.push(`/results/${data.id}`)
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : "Erreur lors de l'envoi."
  } finally {
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
    sessionStatus.value = 'valid'
  } catch {
    sessionStatus.value = 'not_found'
  }
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <div class="mx-auto max-w-2xl px-4 py-10 sm:px-6">

      <section v-if="sessionStatus === 'loading'" class="rounded-2xl border border-border/70 bg-background p-8 text-center">
        <p class="text-sm text-muted-foreground">Vérification du lien...</p>
      </section>

      <section v-else-if="sessionStatus === 'expired'" class="rounded-2xl border border-border/70 bg-background p-8 text-center space-y-2">
        <h1 class="text-xl font-semibold">Lien expiré</h1>
        <p class="text-sm text-muted-foreground">Ce lien a expiré. Contactez votre médecin pour en obtenir un nouveau.</p>
      </section>

      <section v-else-if="sessionStatus === 'completed'" class="rounded-2xl border border-border/70 bg-background p-8 text-center space-y-2">
        <h1 class="text-xl font-semibold">Formulaire déjà soumis</h1>
        <p class="text-sm text-muted-foreground">Vous avez déjà rempli ce questionnaire. Votre médecin a bien reçu vos réponses.</p>
      </section>

      <section v-else-if="sessionStatus === 'not_found'" class="rounded-2xl border border-border/70 bg-background p-8 text-center space-y-2">
        <h1 class="text-xl font-semibold">Lien introuvable</h1>
        <p class="text-sm text-muted-foreground">Ce lien n'existe pas ou a été supprimé.</p>
      </section>

      <section v-else class="rounded-2xl border border-border/70 bg-background p-6 shadow-sm space-y-6">
        <header class="space-y-1 border-b border-border/70 pb-4">
          <h1 class="text-xl font-semibold text-foreground">Questionnaire pré-consultation</h1>
          <p class="text-sm text-muted-foreground">Merci de répondre à ces questions pour préparer votre consultation.</p>
        </header>

        <form novalidate @submit.prevent="submit" class="space-y-5">
          <!-- Numéro de sécurité sociale de l'enfant (optionnel) -->
          <div class="space-y-2 rounded-lg border border-border/50 bg-muted/30 p-4">
            <label for="nir" class="block text-sm font-medium text-foreground">
              Numéro de sécurité sociale de l'enfant
              <span class="ml-1 text-xs font-normal text-muted-foreground">(optionnel)</span>
            </label>
            <input
              id="nir"
              v-model="nir"
              type="text"
              maxlength="15"
              placeholder="Ex : 2 05 12 75 123 456 78"
              class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground">
              Ce numéro permet à votre médecin de regrouper les consultations de votre enfant dans un même dossier.
            </p>
          </div>

          <div v-for="q in questions" :key="q.id" class="space-y-2">
            <label :for="`q-${q.id}`" class="block text-sm font-medium text-foreground">
              {{ q.label }}
              <span v-if="q.required" class="text-destructive ml-0.5" aria-hidden="true">*</span>
            </label>

            <!-- Text court -->
            <input
              v-if="q.type === 'text'"
              :id="`q-${q.id}`"
              type="text"
              :value="(getAnswer(q.id) as string)"
              class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              :aria-invalid="!!errors[q.id]"
              @input="setAnswer(q.id, ($event.target as HTMLInputElement).value)"
            />

            <!-- Textarea -->
            <textarea
              v-else-if="q.type === 'textarea'"
              :id="`q-${q.id}`"
              rows="3"
              :value="(getAnswer(q.id) as string)"
              class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              :aria-invalid="!!errors[q.id]"
              @input="setAnswer(q.id, ($event.target as HTMLTextAreaElement).value)"
            />

            <!-- Date -->
            <input
              v-else-if="q.type === 'date'"
              :id="`q-${q.id}`"
              type="date"
              :value="(getAnswer(q.id) as string)"
              class="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              :aria-invalid="!!errors[q.id]"
              @input="setAnswer(q.id, ($event.target as HTMLInputElement).value)"
            />

            <!-- Choix unique -->
            <div v-else-if="q.type === 'single_choice'" class="space-y-2">
              <label
                v-for="opt in q.options"
                :key="opt"
                class="flex items-center gap-3 rounded-lg border border-border/70 bg-background px-3 py-2.5 text-sm cursor-pointer hover:bg-accent/50 transition-colors"
                :class="{ 'border-primary bg-primary/5': getAnswer(q.id) === opt }"
              >
                <input
                  type="radio"
                  :name="`q-${q.id}`"
                  :value="opt"
                  :checked="getAnswer(q.id) === opt"
                  class="accent-primary"
                  @change="setAnswer(q.id, opt)"
                />
                {{ opt }}
              </label>
            </div>

            <!-- Choix multiple -->
            <div v-else-if="q.type === 'multiple_choice'" class="space-y-2">
              <label
                v-for="opt in q.options"
                :key="opt"
                class="flex items-center gap-3 rounded-lg border border-border/70 bg-background px-3 py-2.5 text-sm cursor-pointer hover:bg-accent/50 transition-colors"
                :class="{ 'border-primary bg-primary/5': isChecked(q.id, opt) }"
              >
                <input
                  type="checkbox"
                  :checked="isChecked(q.id, opt)"
                  class="accent-primary"
                  @change="toggleMulti(q.id, opt)"
                />
                {{ opt }}
              </label>
            </div>

            <p v-if="errors[q.id]" class="text-xs text-destructive" role="alert">{{ errors[q.id] }}</p>
          </div>

          <p v-if="submitError" class="text-sm text-destructive text-center" role="alert">{{ submitError }}</p>

          <div class="border-t border-border/70 pt-5">
            <Button type="submit" class="w-full" :disabled="isSubmitting">
              {{ isSubmitting ? 'Envoi en cours...' : 'Envoyer mes réponses' }}
            </Button>
          </div>
        </form>
      </section>

    </div>
  </div>
</template>
