<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { API_BASE_URL } from '@/services/api'

const emit = defineEmits<{ created: [] }>()

const isOpen = ref(false)
const isLoading = ref(false)
const isSendingEmail = ref(false)
const error = ref('')
const emailError = ref('')

const patientFirstName = ref('')
const patientEmail = ref('')
const selectedTemplateId = ref<string | null>(null)

interface Template { id: string; title: string }
const templates = ref<Template[]>([])

const loadTemplates = async () => {
  try {
    const token = localStorage.getItem('authToken')
    const res = await fetch(`${API_BASE_URL}/templates`, { headers: { Authorization: `Bearer ${token}` } })
    templates.value = await res.json()
  } catch {}
}

const generatedUrl = ref('')
const sessionId = ref('')
const copied = ref(false)
const emailSent = ref(false)

const open = () => {
  isOpen.value = true
  generatedUrl.value = ''
  sessionId.value = ''
  patientFirstName.value = ''
  patientEmail.value = ''
  selectedTemplateId.value = null
  error.value = ''
  emailError.value = ''
  copied.value = false
  emailSent.value = false
  loadTemplates()
}

const close = () => { isOpen.value = false }

const createSession = async () => {
  error.value = ''
  isLoading.value = true
  try {
    const token = localStorage.getItem('authToken')
    const res = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        patientFirstName: patientFirstName.value || undefined,
        patientEmail: patientEmail.value || undefined,
        formTemplateId: selectedTemplateId.value || undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erreur inconnue')
    generatedUrl.value = data.formUrl
    sessionId.value = data.session.id
    emit('created')
  } catch (err: unknown) {
    error.value = (err as Error).message || 'Erreur lors de la création du lien'
  } finally {
    isLoading.value = false
  }
}

const copyLink = async () => {
  await navigator.clipboard.writeText(generatedUrl.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

const sendEmail = async () => {
  if (!patientEmail.value) { emailError.value = 'Ajoutez un email patient pour envoyer le lien.'; return }
  emailError.value = ''
  isSendingEmail.value = true
  try {
    const token = localStorage.getItem('authToken')
    const res = await fetch(`${API_BASE_URL}/sessions/${sessionId.value}/send-email`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Erreur envoi')
    emailSent.value = true
  } catch {
    emailError.value = "Erreur lors de l'envoi. Vérifiez la clé Resend."
  } finally {
    isSendingEmail.value = false
  }
}
</script>

<template>
  <div>
    <Button @click="open">Créer un lien patient</Button>

    <!-- Modal -->
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="close">
      <div class="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl space-y-5">

        <!-- Étape 1 : formulaire -->
        <template v-if="!generatedUrl">
          <div class="space-y-1">
            <h2 class="text-lg font-semibold text-foreground">Nouveau lien patient</h2>
            <p class="text-sm text-muted-foreground">Générez un lien unique à envoyer au parent avant la consultation.</p>
          </div>

          <div class="space-y-4">
            <Field>
              <FieldLabel for="patient-name">Prénom du patient <span class="text-muted-foreground">(optionnel)</span></FieldLabel>
              <Input id="patient-name" v-model="patientFirstName" placeholder="Ex: Lucas" autocomplete="off" />
            </Field>
            <Field>
              <FieldLabel for="patient-email">Email du parent <span class="text-muted-foreground">(optionnel)</span></FieldLabel>
              <Input id="patient-email" v-model="patientEmail" type="email" placeholder="parent@exemple.fr" autocomplete="off" />
            </Field>
            <Field>
              <FieldLabel for="template-select">Formulaire à utiliser</FieldLabel>
              <select
                id="template-select"
                v-model="selectedTemplateId"
                class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option :value="null">Formulaire standard (par défaut)</option>
                <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.title }}</option>
              </select>
            </Field>
          </div>

          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

          <div class="flex justify-end gap-3 pt-2">
            <Button variant="outline" @click="close">Annuler</Button>
            <Button :disabled="isLoading" @click="createSession">
              {{ isLoading ? 'Création...' : 'Générer le lien' }}
            </Button>
          </div>
        </template>

        <!-- Étape 2 : lien généré -->
        <template v-else>
          <div class="space-y-1">
            <h2 class="text-lg font-semibold text-foreground">Lien créé</h2>
            <p class="text-sm text-muted-foreground">Copiez ce lien et envoyez-le au parent avant la consultation.</p>
          </div>

          <div class="rounded-lg border border-border/70 bg-muted/40 p-3 text-xs font-mono break-all text-foreground">
            {{ generatedUrl }}
          </div>

          <div class="flex flex-wrap gap-2">
            <Button variant="outline" class="flex-1" @click="copyLink">
              {{ copied ? 'Copié !' : 'Copier le lien' }}
            </Button>
            <Button
              v-if="patientEmail"
              class="flex-1"
              :disabled="isSendingEmail || emailSent"
              @click="sendEmail"
            >
              {{ emailSent ? 'Email envoyé ✓' : isSendingEmail ? 'Envoi...' : 'Envoyer par email' }}
            </Button>
          </div>

          <p v-if="emailError" class="text-sm text-destructive">{{ emailError }}</p>
          <p v-if="!patientEmail" class="text-xs text-muted-foreground">Aucun email renseigné — copiez le lien manuellement.</p>

          <div class="flex justify-end pt-2">
            <Button variant="outline" @click="close">Fermer</Button>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>
