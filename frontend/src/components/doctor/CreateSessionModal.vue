<script setup lang="ts">
import { computed, ref } from 'vue'
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
const appointmentAt = ref('')
const selectedTemplateId = ref<string | null>(null)

// min datetime-local value = now (forbid past appointments at the input level)
const minAppointmentAt = (() => {
  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
  return now.toISOString().slice(0, 16)
})()

interface Template { id: string; title: string }
const templates = ref<Template[]>([])

const loadTemplates = async () => {
  try {
    const token = localStorage.getItem('authToken')
    const res = await fetch(`${API_BASE_URL}/templates`, { headers: { Authorization: `Bearer ${token}` } })
    templates.value = await res.json()
  } catch {
    /* ignore — templates list is optional */
  }
}

const generatedUrl = ref('')
const sessionId = ref('')
const copied = ref(false)
const emailSent = ref(false)

const linkTokenPart = computed(() => {
  if (!generatedUrl.value) return ''
  // Show just the token portion (e.g. /form/t1-LEAB7K2Z9F)
  const match = generatedUrl.value.match(/\/form\/([^/?#]+)/)
  return match ? match[1] : generatedUrl.value
})

const open = () => {
  isOpen.value = true
  generatedUrl.value = ''
  sessionId.value = ''
  patientFirstName.value = ''
  patientEmail.value = ''
  appointmentAt.value = ''
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

  if (!patientFirstName.value.trim()) {
    error.value = 'Le prénom de l\'enfant est requis.'
    return
  }
  if (patientEmail.value && !appointmentAt.value) {
    error.value = 'La date de rendez-vous est obligatoire dès qu\'un email patient est renseigné (sinon impossible d\'envoyer les relances).'
    return
  }

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
        appointmentAt: appointmentAt.value ? new Date(appointmentAt.value).toISOString() : undefined,
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

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') close()
}
</script>

<template>
  <div>
    <Button size="md" @click="open">
      <svg viewBox="0 0 16 16" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M8 3v10M3 8h10" />
      </svg>
      Envoyer un questionnaire
    </Button>

    <!-- Scrim + modal -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_oklab,var(--color-ink)_38%,transparent)] backdrop-blur-sm sm:items-center sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-session-title"
        tabindex="-1"
        @click.self="close"
        @keydown="onKeydown"
      >
        <div
          class="w-full max-w-[520px] bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-line)] shadow-[var(--shadow-lg)] rounded-t-[var(--r-xl)] sm:rounded-[var(--r-lg)] p-5 pb-6 sm:p-7 max-h-[92vh] overflow-y-auto"
        >
          <!-- Étape 1 : formulaire -->
          <template v-if="!generatedUrl">
            <header class="space-y-1.5">
              <h2
                id="create-session-title"
                class="font-display text-[22px] font-medium tracking-[-0.014em] text-[var(--color-ink)]"
              >
                Envoyer un questionnaire
              </h2>
              <p class="text-sm text-[var(--color-ink-2)]">
                Le parent recevra un lien unique par email. Pas d'inscription requise côté parent.
              </p>
            </header>

            <div class="mt-5 space-y-4">
              <div class="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel for="patient-name" required>Prénom de l'enfant</FieldLabel>
                  <Input id="patient-name" v-model="patientFirstName" size="md" placeholder="Ex : Lucas" autocomplete="off" required />
                </Field>
                <Field>
                  <FieldLabel for="patient-email">Email du parent</FieldLabel>
                  <Input id="patient-email" v-model="patientEmail" size="md" type="email" placeholder="parent@exemple.fr" autocomplete="off" />
                </Field>
              </div>

              <Field>
                <FieldLabel for="appointment-at" :required="!!patientEmail">
                  Date du rendez-vous
                </FieldLabel>
                <Input
                  id="appointment-at"
                  v-model="appointmentAt"
                  size="md"
                  type="datetime-local"
                  :min="minAppointmentAt"
                  :required="!!patientEmail"
                />
                <p v-if="patientEmail" class="text-xs text-[var(--color-muted-strong)]">
                  Active les relances automatiques (J-3, J-1, H-2).
                </p>
              </Field>

              <Field>
                <FieldLabel for="template-select">Questionnaire</FieldLabel>
                <select
                  id="template-select"
                  v-model="selectedTemplateId"
                  class="h-10 w-full rounded-[var(--r-sm)] border border-[var(--color-line-2)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:shadow-[var(--shadow-input-focus)]"
                >
                  <option :value="null">Questionnaire standard (par défaut)</option>
                  <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.title }}</option>
                </select>
              </Field>
            </div>

            <p v-if="error" class="mt-3 text-sm text-destructive" role="alert">{{ error }}</p>

            <footer class="mt-6 flex flex-col-reverse gap-2.5 border-t border-[var(--color-line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-xs text-[var(--color-muted-strong)]">
                Le lien expire 7 jours après l'envoi.
              </p>
              <div class="flex w-full flex-col-reverse gap-2.5 sm:w-auto sm:flex-row sm:items-center">
                <Button variant="secondary" size="md" :block="true" class="sm:w-auto" @click="close">Annuler</Button>
                <Button size="md" :block="true" class="sm:w-auto" :disabled="isLoading" @click="createSession">
                  {{ isLoading ? 'Création…' : 'Générer le lien' }}
                </Button>
              </div>
            </footer>
          </template>

          <!-- Étape 2 : lien généré -->
          <template v-else>
            <header class="space-y-1.5">
              <h2
                id="create-session-title"
                class="font-display text-[22px] font-medium tracking-[-0.014em] text-[var(--color-ink)]"
              >
                Lien créé
              </h2>
              <p class="text-sm text-[var(--color-ink-2)]">
                Copiez ce lien et envoyez-le au parent avant la consultation.
              </p>
            </header>

            <!-- Link preview pill (matches the design's .modal-link-preview) -->
            <div
              class="mt-5 flex items-center gap-2 rounded-[var(--r-md)] border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3.5 py-2.5 font-mono text-[12.5px] text-[var(--color-ink-2)]"
            >
              <span class="text-[var(--color-muted-strong)]">pediguide.fr/form/</span>
              <span class="truncate text-primary">{{ linkTokenPart }}</span>
            </div>

            <div class="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <Button variant="secondary" size="md" :block="true" class="sm:flex-1" @click="copyLink">
                {{ copied ? 'Copié ✓' : 'Copier le lien' }}
              </Button>
              <Button
                v-if="patientEmail"
                size="md"
                :block="true"
                class="sm:flex-1"
                :disabled="isSendingEmail || emailSent"
                @click="sendEmail"
              >
                {{ emailSent ? 'Email envoyé ✓' : isSendingEmail ? 'Envoi…' : 'Envoyer par email' }}
              </Button>
            </div>

            <p v-if="emailError" class="mt-3 text-sm text-destructive" role="alert">{{ emailError }}</p>
            <p v-if="!patientEmail" class="mt-3 text-xs text-[var(--color-muted-strong)]">
              Aucun email renseigné — copiez le lien manuellement.
            </p>

            <footer class="mt-6 flex justify-end border-t border-[var(--color-line)] pt-5">
              <Button variant="ghost" size="md" @click="close">Fermer</Button>
            </footer>
          </template>
        </div>
      </div>
    </Teleport>
  </div>
</template>
