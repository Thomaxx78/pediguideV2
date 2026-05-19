<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { API_BASE_URL } from '@/services/api'
import { randomUUID } from '@/lib/uuid'

const route = useRoute()
const router = useRouter()

type QuestionType = 'text' | 'textarea' | 'date' | 'single_choice' | 'multiple_choice'

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
const isSaving = ref(false)
const isLoading = ref(!isNew)
const error = ref('')

const authHeader = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
})

const typeLabels: Record<QuestionType, string> = {
  text: 'Texte court',
  textarea: 'Texte long',
  date: 'Date',
  single_choice: 'Choix unique',
  multiple_choice: 'Choix multiple',
}

const addQuestion = () => {
  questions.value.push({ id: randomUUID(), type: 'text', label: '', required: false, options: [] })
}

const removeQuestion = (index: number) => {
  questions.value.splice(index, 1)
}

const moveUp = (index: number) => {
  if (index === 0) return
  const q = questions.value.splice(index, 1)[0]
  questions.value.splice(index - 1, 0, q)
}

const moveDown = (index: number) => {
  if (index === questions.value.length - 1) return
  const q = questions.value.splice(index, 1)[0]
  questions.value.splice(index + 1, 0, q)
}

const addOption = (q: Question) => {
  if (!q.options) q.options = []
  q.options.push('')
}

const removeOption = (q: Question, i: number) => {
  q.options?.splice(i, 1)
}

const loadDefaultTemplate = () => {
  questions.value = [
    { id: randomUUID(), type: 'text', label: "Prénom de l'enfant", required: true },
    { id: randomUUID(), type: 'text', label: "Nom de l'enfant", required: true },
    { id: randomUUID(), type: 'date', label: 'Date de naissance', required: true },
    { id: randomUUID(), type: 'textarea', label: 'Motif de consultation', required: true },
    { id: randomUUID(), type: 'single_choice', label: 'Niveau de fièvre', required: false, options: ['Pas de fièvre', '37-38°C', '38-39°C', '> 39°C'] },
    { id: randomUUID(), type: 'textarea', label: 'Médicaments ou traitements en cours', required: false },
    { id: randomUUID(), type: 'textarea', label: 'Allergies connues', required: false },
    { id: randomUUID(), type: 'textarea', label: 'Message libre pour le médecin', required: false },
  ]
}

const onTypeChange = (q: Question) => {
  if (q.type === 'single_choice' || q.type === 'multiple_choice') {
    if (!q.options?.length) q.options = ['Option 1', 'Option 2']
  } else {
    q.options = []
  }
}

const save = async () => {
  if (!title.value.trim()) { error.value = 'Le titre est requis.'; return }
  if (!questions.value.length) { error.value = 'Ajoutez au moins une question.'; return }
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

onMounted(async () => {
  if (isNew) {
    if (fromDefault) {
      const res = await fetch(`${API_BASE_URL}/templates`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ title: 'Nouveau formulaire', startFromDefault: true }),
      })
      const created = await res.json()
      title.value = ''
      questions.value = created.questions
    }
    return
  }

  try {
    const res = await fetch(`${API_BASE_URL}/templates/${route.params.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
    const data = await res.json()
    title.value = data.title
    description.value = data.description || ''
    questions.value = data.questions
  } catch {
    error.value = 'Impossible de charger le formulaire.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 py-10">
    <header class="flex items-center justify-between gap-4">
      <h1 class="text-3xl font-semibold tracking-tight text-foreground">
        {{ isNew ? 'Nouveau formulaire' : 'Modifier le formulaire' }}
      </h1>
      <Button variant="outline" @click="router.push('/dashboard/formulaires')">Annuler</Button>
    </header>

    <div v-if="isLoading" class="p-8 text-center text-sm text-muted-foreground">Chargement...</div>

    <template v-else>
      <!-- Infos générales -->
      <div class="rounded-2xl border border-border/70 bg-background p-5 space-y-4">
        <h2 class="font-semibold text-foreground">Informations générales</h2>
        <Field>
          <FieldLabel for="tpl-title">Titre du formulaire *</FieldLabel>
          <Input id="tpl-title" v-model="title" placeholder="Ex: Consultation pédiatrie générale" />
        </Field>
        <Field>
          <FieldLabel for="tpl-desc">Description <span class="text-muted-foreground">(optionnel)</span></FieldLabel>
          <Input id="tpl-desc" v-model="description" placeholder="Ex: Pour les consultations de routine 0-6 ans" />
        </Field>
      </div>

      <!-- Questions -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-foreground">Questions <span class="text-muted-foreground text-sm">({{ questions.length }})</span></h2>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" @click="loadDefaultTemplate">
              Modèle par défaut
            </Button>
            <Button size="sm" @click="addQuestion">+ Ajouter une question</Button>
          </div>
        </div>

        <div v-if="!questions.length" class="rounded-2xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
          Aucune question. Cliquez sur "Ajouter une question" ou chargez le modèle par défaut.
        </div>

        <div v-for="(q, i) in questions" :key="q.id" class="rounded-2xl border border-border/70 bg-background p-4 space-y-3">
          <div class="flex items-start justify-between gap-3">
            <span class="text-xs font-semibold text-muted-foreground pt-1">Q{{ i + 1 }}</span>
            <div class="flex-1 space-y-3">
              <!-- Label -->
              <input
                v-model="q.label"
                type="text"
                placeholder="Libellé de la question"
                class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />

              <div class="flex flex-wrap gap-3 items-center">
                <!-- Type -->
                <select
                  v-model="q.type"
                  class="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  @change="onTypeChange(q)"
                >
                  <option v-for="(label, val) in typeLabels" :key="val" :value="val">{{ label }}</option>
                </select>

                <!-- Requis -->
                <label class="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input v-model="q.required" type="checkbox" class="accent-primary" />
                  Obligatoire
                </label>
              </div>

              <!-- Options pour choix -->
              <div v-if="q.type === 'single_choice' || q.type === 'multiple_choice'" class="space-y-2">
                <p class="text-xs text-muted-foreground">Options de réponse :</p>
                <div v-for="(opt, oi) in q.options" :key="oi" class="flex items-center gap-2">
                  <input
                    v-model="q.options![oi]"
                    type="text"
                    :placeholder="`Option ${oi + 1}`"
                    class="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button class="text-muted-foreground hover:text-destructive text-sm" @click="removeOption(q, oi)">✕</button>
                </div>
                <Button variant="outline" size="sm" @click="addOption(q)">+ Option</Button>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col gap-1">
              <button class="text-xs text-muted-foreground hover:text-foreground px-1" :disabled="i === 0" @click="moveUp(i)">↑</button>
              <button class="text-xs text-muted-foreground hover:text-foreground px-1" :disabled="i === questions.length - 1" @click="moveDown(i)">↓</button>
              <button class="text-xs text-destructive hover:text-destructive/80 px-1" @click="removeQuestion(i)">✕</button>
            </div>
          </div>
        </div>
      </div>

      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

      <div class="flex justify-end gap-3 pt-2">
        <Button variant="outline" @click="router.push('/dashboard/formulaires')">Annuler</Button>
        <Button :disabled="isSaving" @click="save">
          {{ isSaving ? 'Sauvegarde...' : 'Sauvegarder' }}
        </Button>
      </div>
    </template>
  </div>
</template>
