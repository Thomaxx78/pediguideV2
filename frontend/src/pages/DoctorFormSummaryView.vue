<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import AiSynthesisPanel from '@/components/doctor/AiSynthesisPanel.vue'
import { doctorFormsApi, type DoctorFormDetail } from '@/services/doctorFormsApi'
import api from '@/services/api'
import {
  allergyLabelById,
  antecedentLabelById,
  genderLabelByValue,
  labelFor,
  labelsFor,
  symptomLabelById,
  timelineLabelById,
  vaccinationsLabelByValue,
} from '@/lib/diagnosisLabels'

const route = useRoute()

const formId = computed(() => String(route.params.id || ''))
const form = ref<DoctorFormDetail | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const isSynthesizing = ref(false)
const synthesisError = ref<string | null>(null)

const formatDate = (value: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const formatBirthDate = (value: string) => {
  if (!value) return 'Non renseigné'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date)
}

const loadForm = async () => {
  if (!formId.value) {
    error.value = 'Identifiant de formulaire manquant.'
    isLoading.value = false
    return
  }

  isLoading.value = true
  error.value = null

  try {
    form.value = await doctorFormsApi.get(formId.value)
  } catch (err: unknown) {
    error.value = (err as Error).message || 'Impossible de charger le formulaire.'
    form.value = null
  } finally {
    isLoading.value = false
  }
}

const generateSynthesis = async () => {
  if (!formId.value || !form.value) return
  isSynthesizing.value = true
  synthesisError.value = null

  try {
    const result = await api.diagnosis.synthesize(formId.value) as { synthesis: DoctorFormDetail['aiSynthesis'] }
    if (form.value) form.value.aiSynthesis = result.synthesis ?? null
  } catch (err: unknown) {
    synthesisError.value = (err as Error).message || 'Erreur lors de la génération.'
  } finally {
    isSynthesizing.value = false
  }
}

onMounted(() => {
  loadForm()
})

watch(formId, () => {
  loadForm()
})

// --- Derived display data for the v2 (new parent flow) shape ---

const fullName = computed(() => {
  if (!form.value) return ''
  const parts = [form.value.patientFirstName, form.value.patientLastName].filter(Boolean)
  return parts.join(' ') || 'Patient·e'
})

const symptomCards = computed(() => {
  if (!form.value) return []
  return form.value.symptoms.map((id) => {
    const symptomLabel = labelFor(symptomLabelById, id)
    const timelineId = form.value!.symptomTimeline[id]
    const severity = form.value!.symptomSeverity[id]
    return {
      id,
      label: symptomLabel || id,
      timeline: timelineId ? labelFor(timelineLabelById, timelineId) : null,
      severity: typeof severity === 'number' ? severity : null,
    }
  })
})

const allergiesDisplay = computed(() => {
  if (!form.value) return null
  if (form.value.noAllergies) return ['Aucune allergie connue']
  const labels = labelsFor(allergyLabelById, form.value.allergies)
  return labels.length > 0 ? labels : null
})

const antecedentsDisplay = computed(() => {
  if (!form.value) return null
  if (form.value.noAntecedents) return ['Aucun antécédent particulier']
  const labels = labelsFor(antecedentLabelById, form.value.antecedents)
  return labels.length > 0 ? labels : null
})

const genderDisplay = computed(() => {
  if (!form.value?.gender) return null
  return labelFor(genderLabelByValue, form.value.gender)
})

const vaccinationsDisplay = computed(() => {
  if (!form.value?.vaccinations) return null
  return labelFor(vaccinationsLabelByValue, form.value.vaccinations)
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 py-10">
    <!-- Header -->
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div class="space-y-2">
        <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
          Soumission
        </p>
        <h1
          id="doctor-form-summary-title"
          class="font-display text-3xl font-medium tracking-[-0.02em] text-[var(--color-ink)]"
        >
          {{ fullName || 'Résumé du formulaire' }}
        </h1>
        <p v-if="form" class="text-sm text-[var(--color-ink-2)]">
          Reçue le {{ formatDate(form.submittedAt) }}
          <span v-if="form.isLegacy" class="ml-2 inline-flex items-center gap-1 rounded-full border border-[var(--color-line-2)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
            Soumission héritée
          </span>
        </p>
      </div>
      <Button as-child variant="secondary" size="sm">
        <RouterLink to="/dashboard">Retour au tableau de bord</RouterLink>
      </Button>
    </header>

    <!-- Loading / error -->
    <div
      v-if="isLoading"
      class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-sm text-[var(--color-ink-2)]"
      aria-live="polite"
    >
      Chargement…
    </div>

    <div
      v-else-if="error"
      class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-sm text-destructive"
      role="alert"
    >
      {{ error }}
    </div>

    <template v-else-if="form">
      <!-- AI synthesis (always shown — empty state has a CTA) -->
      <AiSynthesisPanel
        :synthesis="form.aiSynthesis"
        :is-generating="isSynthesizing"
        :error="synthesisError"
        @generate="generateSynthesis"
      />

      <!-- Patient data -->
      <section
        v-if="!form.isLegacy"
        aria-labelledby="parent-data-title"
        class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6"
      >
        <h2
          id="parent-data-title"
          class="font-display text-xl font-medium tracking-[-0.014em] text-[var(--color-ink)]"
        >
          Réponses du parent
        </h2>
        <p class="mt-1 text-sm text-[var(--color-ink-2)]">
          Saisies via le questionnaire Pediguide pré-consultation.
        </p>

        <!-- Identity grid -->
        <dl class="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <div>
            <dt class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">Prénom</dt>
            <dd class="mt-1 text-[15px] text-[var(--color-ink)]">{{ form.patientFirstName || 'Non renseigné' }}</dd>
          </div>
          <div>
            <dt class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">Date de naissance</dt>
            <dd class="mt-1 text-[15px] text-[var(--color-ink)]">{{ formatBirthDate(form.childBirthDate) }}</dd>
          </div>
          <div v-if="form.weight">
            <dt class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">Poids</dt>
            <dd class="mt-1 text-[15px] text-[var(--color-ink)]">{{ form.weight }} kg</dd>
          </div>
          <div v-if="form.height">
            <dt class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">Taille</dt>
            <dd class="mt-1 text-[15px] text-[var(--color-ink)]">{{ form.height }} cm</dd>
          </div>
          <div v-if="genderDisplay">
            <dt class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">Genre</dt>
            <dd class="mt-1 text-[15px] text-[var(--color-ink)]">{{ genderDisplay }}</dd>
          </div>
        </dl>

        <!-- Symptom cards -->
        <div v-if="symptomCards.length || form.symptomOther" class="mt-7">
          <h3 class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
            Symptômes &amp; chronologie
          </h3>
          <div class="mt-3 flex flex-col gap-3">
            <article
              v-for="symptom in symptomCards"
              :key="symptom.id"
              class="rounded-[var(--r-md)] border border-[var(--color-line)] bg-[var(--color-bg)] p-4"
            >
              <header class="flex items-center justify-between gap-3">
                <h4 class="text-[15px] font-medium text-[var(--color-ink)]">{{ symptom.label }}</h4>
                <span
                  v-if="symptom.severity !== null"
                  class="inline-flex items-baseline gap-0.5 rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-[12.5px] font-medium text-primary tabular-nums"
                >
                  {{ symptom.severity }}<span class="text-[var(--color-muted-strong)]">/10</span>
                </span>
              </header>
              <p v-if="symptom.timeline" class="mt-1.5 text-[13.5px] text-[var(--color-ink-2)]">
                Depuis : <strong class="font-medium text-[var(--color-ink)]">{{ symptom.timeline }}</strong>
              </p>
            </article>

            <div
              v-if="form.symptomOther"
              class="rounded-[var(--r-md)] border border-dashed border-[var(--color-line-2)] bg-[var(--color-surface-2)] p-4 text-[13.5px] text-[var(--color-ink-2)]"
            >
              <p class="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
                Autre symptôme
              </p>
              <p class="text-[var(--color-ink)]">{{ form.symptomOther }}</p>
            </div>
          </div>
        </div>

        <!-- Allergies & antécédents -->
        <div class="mt-7 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Allergies
            </h3>
            <ul v-if="allergiesDisplay" class="mt-2 flex flex-wrap gap-1.5">
              <li
                v-for="a in allergiesDisplay"
                :key="a"
                class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1 text-[13px] text-[var(--color-ink)]"
              >{{ a }}</li>
            </ul>
            <p v-else class="mt-2 text-[13.5px] text-[var(--color-muted-strong)]">Non renseigné</p>
          </div>
          <div>
            <h3 class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Antécédents
            </h3>
            <ul v-if="antecedentsDisplay" class="mt-2 flex flex-wrap gap-1.5">
              <li
                v-for="a in antecedentsDisplay"
                :key="a"
                class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1 text-[13px] text-[var(--color-ink)]"
              >{{ a }}</li>
            </ul>
            <p v-else class="mt-2 text-[13.5px] text-[var(--color-muted-strong)]">Non renseigné</p>
          </div>
        </div>

        <!-- Treatments + vaccinations -->
        <div class="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Traitements en cours
            </h3>
            <p class="mt-2 text-[14px] text-[var(--color-ink)]">
              {{ form.treatments || 'Non renseigné' }}
            </p>
          </div>
          <div>
            <h3 class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Vaccinations
            </h3>
            <p class="mt-2 text-[14px] text-[var(--color-ink)]">
              {{ vaccinationsDisplay || 'Non renseigné' }}
            </p>
          </div>
        </div>

        <!-- Worry + photo + notes -->
        <div v-if="form.worry || form.photoName || form.additionalNotes" class="mt-7 space-y-5 border-t border-[var(--color-line)] pt-6">
          <div v-if="form.worry">
            <h3 class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Inquiétude principale
            </h3>
            <p class="mt-2 text-[14.5px] italic text-[var(--color-ink-2)]">« {{ form.worry }} »</p>
          </div>
          <div v-if="form.photoName">
            <h3 class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Photo jointe
            </h3>
            <p class="mt-2 inline-flex items-center gap-2 rounded-[var(--r-sm)] border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-1.5 text-[13px] text-[var(--color-ink-2)]">
              <svg viewBox="0 0 16 16" class="size-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="12" height="10" rx="1.5" />
                <circle cx="6" cy="7" r="1.5" />
                <path d="M2 11l3.5-3 5 4" />
              </svg>
              {{ form.photoName }}
            </p>
            <p class="mt-1 text-[11.5px] text-[var(--color-muted-strong)]">
              La pièce jointe n'est pas encore stockée sur le serveur (v1 — nom du fichier uniquement).
            </p>
          </div>
          <div v-if="form.additionalNotes">
            <h3 class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Contexte supplémentaire
            </h3>
            <p class="mt-2 text-[14px] text-[var(--color-ink)]">{{ form.additionalNotes }}</p>
          </div>
        </div>
      </section>

      <!-- Legacy fallback — for old submissions before the v2 redesign -->
      <section
        v-else
        aria-labelledby="legacy-data-title"
        class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6"
      >
        <h2
          id="legacy-data-title"
          class="font-display text-xl font-medium tracking-[-0.014em] text-[var(--color-ink)]"
        >
          Réponses du parent (format hérité)
        </h2>
        <p class="mt-1 text-sm text-[var(--color-ink-2)]">
          Soumission au format pré-redesign. Certains champs n'existent plus dans la nouvelle version.
        </p>

        <dl class="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <div>
            <dt class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">Prénom</dt>
            <dd class="mt-1 text-[15px] text-[var(--color-ink)]">{{ form.patientFirstName || 'Non renseigné' }}</dd>
          </div>
          <div>
            <dt class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">Nom</dt>
            <dd class="mt-1 text-[15px] text-[var(--color-ink)]">{{ form.patientLastName || 'Non renseigné' }}</dd>
          </div>
          <div>
            <dt class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">Date de naissance</dt>
            <dd class="mt-1 text-[15px] text-[var(--color-ink)]">{{ formatBirthDate(form.childBirthDate) }}</dd>
          </div>
          <div>
            <dt class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">Motif de consultation</dt>
            <dd class="mt-1 text-[15px] text-[var(--color-ink)]">{{ form.consultationReason || 'Non renseigné' }}</dd>
          </div>
        </dl>

        <div class="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Signes cliniques
            </h3>
            <ul v-if="form.clinicalSigns.length" class="mt-2 flex flex-wrap gap-1.5">
              <li
                v-for="item in form.clinicalSigns"
                :key="item"
                class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1 text-[13px] text-[var(--color-ink)]"
              >{{ item }}</li>
            </ul>
            <p v-else class="mt-2 text-[13.5px] text-[var(--color-muted-strong)]">Aucun signe rapporté.</p>
          </div>
          <div>
            <h3 class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Changements observés
            </h3>
            <ul v-if="form.behaviorChanges.length" class="mt-2 flex flex-wrap gap-1.5">
              <li
                v-for="item in form.behaviorChanges"
                :key="item"
                class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1 text-[13px] text-[var(--color-ink)]"
              >{{ item }}</li>
            </ul>
            <p v-else class="mt-2 text-[13.5px] text-[var(--color-muted-strong)]">Aucun changement indiqué.</p>
          </div>
        </div>

        <div class="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">Durée</h3>
            <p class="mt-2 text-[14px] text-[var(--color-ink)]">{{ form.duration || 'Non renseigné' }}</p>
          </div>
          <div>
            <h3 class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">Niveau d'inquiétude</h3>
            <p class="mt-2 text-[14px] text-[var(--color-ink)]">{{ form.worryLevel || 'Non renseigné' }}</p>
          </div>
        </div>

        <div v-if="form.actionsTaken.length || form.additionalNotes" class="mt-6 space-y-5 border-t border-[var(--color-line)] pt-6">
          <div v-if="form.actionsTaken.length">
            <h3 class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Actions déjà prises
            </h3>
            <ul class="mt-2 flex flex-wrap gap-1.5">
              <li
                v-for="item in form.actionsTaken"
                :key="item"
                class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1 text-[13px] text-[var(--color-ink)]"
              >{{ item }}</li>
            </ul>
          </div>
          <div v-if="form.additionalNotes">
            <h3 class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Notes complémentaires
            </h3>
            <p class="mt-2 text-[14px] text-[var(--color-ink)]">{{ form.additionalNotes }}</p>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
