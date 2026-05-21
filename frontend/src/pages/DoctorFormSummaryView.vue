<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import AiSynthesisPanel from '@/components/doctor/AiSynthesisPanel.vue'
import {
  doctorFormsApi,
  type AiSynthesis,
  type AiSynthesisVersion,
  type DoctorFormDetail,
} from '@/services/doctorFormsApi'
import api from '@/services/api'
import { downloadDiagnosisPdf } from '@/services/pdfDownload'
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
const activeVersionId = ref<string | null>(null)
const previewedVersion = ref<AiSynthesisVersion | null>(null)
const showAllVersions = ref(false)
const isActivatingVersion = ref(false)
const versionActionError = ref<string | null>(null)
const isDownloadingPdf = ref(false)
const pdfError = ref<string | null>(null)

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

const findVersionIdForSynthesis = (target: AiSynthesis) => {
  if (!form.value) return null
  const targetJson = JSON.stringify(target)
  return form.value.aiSynthesisVersions.find((version) => JSON.stringify(version.synthesis) === targetJson)?.id ?? null
}

const displayedSynthesis = computed(() => previewedVersion.value?.synthesis ?? form.value?.aiSynthesis ?? null)

const visibleSynthesisVersions = computed(() => {
  const versions = form.value?.aiSynthesisVersions ?? []
  return showAllVersions.value ? versions : versions.slice(0, 3)
})

const hiddenVersionCount = computed(() => Math.max((form.value?.aiSynthesisVersions.length ?? 0) - 3, 0))

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
    if (form.value.aiSynthesis) {
      activeVersionId.value = findVersionIdForSynthesis(form.value.aiSynthesis)
    }
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
  versionActionError.value = null

  try {
    const result = await api.diagnosis.synthesize(formId.value) as {
      synthesis: DoctorFormDetail['aiSynthesis']
      version?: AiSynthesisVersion
    }
    if (form.value) {
      form.value.aiSynthesis = result.synthesis ?? null
      if (result.version) {
        form.value.aiSynthesisVersions = [result.version, ...form.value.aiSynthesisVersions]
        activeVersionId.value = result.version.id
        previewedVersion.value = null
        showAllVersions.value = false
      }
    }
  } catch (err: unknown) {
    synthesisError.value = (err as Error).message || 'Erreur lors de la génération.'
  } finally {
    isSynthesizing.value = false
  }
}

const previewVersion = (version: AiSynthesisVersion) => {
  previewedVersion.value = version
  versionActionError.value = null
}

const clearVersionPreview = () => {
  previewedVersion.value = null
  versionActionError.value = null
}

const activateVersion = async (version: AiSynthesisVersion) => {
  if (!formId.value || !form.value || version.id === activeVersionId.value) return
  isActivatingVersion.value = true
  versionActionError.value = null

  try {
    const result = await api.diagnosis.activateSynthesisVersion(formId.value, version.id) as {
      synthesis: AiSynthesis
      version: AiSynthesisVersion
    }
    form.value.aiSynthesis = result.synthesis
    activeVersionId.value = result.version.id
    previewedVersion.value = null
  } catch (err: unknown) {
    versionActionError.value = (err as Error).message || 'Impossible d’activer cette version.'
  } finally {
    isActivatingVersion.value = false
  }
}

const downloadPdf = async () => {
  if (!formId.value) return
  isDownloadingPdf.value = true
  pdfError.value = null

  try {
    await downloadDiagnosisPdf(formId.value)
  } catch (err: unknown) {
    pdfError.value = err instanceof Error ? err.message : 'Impossible de télécharger le PDF.'
  } finally {
    isDownloadingPdf.value = false
  }
}

onMounted(() => {
  loadForm()
})

watch(formId, () => {
  activeVersionId.value = null
  previewedVersion.value = null
  showAllVersions.value = false
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

const isPending = computed(() => form.value?.status === 'pending_response')

const sessionFormUrl = computed(() => {
  if (!form.value?.sessionInfo?.patientToken) return null
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5173'
  return `${base}/pre-consultation/${form.value.sessionInfo.patientToken}`
})

const copyLink = async () => {
  if (!sessionFormUrl.value) return
  await navigator.clipboard.writeText(sessionFormUrl.value)
  linkCopied.value = true
  setTimeout(() => { linkCopied.value = false }, 2000)
}

const linkCopied = ref(false)

const formatAppointment = (value: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(date)
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 py-10">
    <!-- Header -->
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div class="space-y-2">
        <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
          {{ isPending ? 'En cours' : 'Soumission' }}
        </p>
        <h1
          id="doctor-form-summary-title"
          class="font-display text-3xl font-medium tracking-[-0.02em] text-[var(--color-ink)]"
        >
          {{ fullName || (form?.sessionInfo?.patientFirstName) || 'Formulaire en attente' }}
        </h1>
        <p v-if="form && !isPending" class="text-sm text-[var(--color-ink-2)]">
          Reçue le {{ formatDate(form.submittedAt) }}
          <span v-if="form.isLegacy" class="ml-2 inline-flex items-center gap-1 rounded-full border border-[var(--color-line-2)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
            Soumission héritée
          </span>
        </p>
        <p v-if="form && isPending" class="text-sm text-blue-600">
          Lien envoyé le {{ formatDate(form.submittedAt) }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Button
          v-if="!isPending"
          variant="secondary"
          size="sm"
          :disabled="isDownloadingPdf || !formId"
          @click="downloadPdf"
        >
          {{ isDownloadingPdf ? 'Téléchargement...' : form?.aiSynthesis ? 'PDF avec synthèse IA' : 'Télécharger PDF' }}
        </Button>
        <Button as-child variant="secondary" size="sm">
          <RouterLink to="/dashboard">Retour au tableau de bord</RouterLink>
        </Button>
      </div>
    </header>
    <p v-if="pdfError" class="text-sm text-destructive" role="alert">{{ pdfError }}</p>

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

    <!-- Pending / in-progress state -->
    <template v-else-if="form && isPending">
      <div class="flex flex-col gap-5">
        <!-- Status banner -->
        <div class="flex items-start gap-4 rounded-[var(--r-lg)] border border-blue-200 bg-blue-50 p-5">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <svg class="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <p class="font-medium text-blue-800">Formulaire en cours de remplissage</p>
            <p class="mt-0.5 text-sm text-blue-600">
              Le patient a ouvert le lien mais n'a pas encore soumis le formulaire.
            </p>
          </div>
        </div>

        <!-- Session info -->
        <div class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h2 class="mb-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
            Informations de la session
          </h2>
          <dl class="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <div>
              <dt class="text-xs text-[var(--color-ink-2)]">Patient</dt>
              <dd class="mt-0.5 font-medium text-[var(--color-ink)]">
                {{ form.sessionInfo?.patientFirstName || 'Non renseigné' }}
              </dd>
            </div>
            <div v-if="form.sessionInfo?.patientEmail">
              <dt class="text-xs text-[var(--color-ink-2)]">Email</dt>
              <dd class="mt-0.5 font-medium text-[var(--color-ink)]">{{ form.sessionInfo.patientEmail }}</dd>
            </div>
            <div>
              <dt class="text-xs text-[var(--color-ink-2)]">Lien envoyé le</dt>
              <dd class="mt-0.5 font-medium text-[var(--color-ink)]">{{ formatDate(form.submittedAt) }}</dd>
            </div>
            <div v-if="form.sessionInfo?.appointmentAt">
              <dt class="text-xs text-[var(--color-ink-2)]">Rendez-vous</dt>
              <dd class="mt-0.5 font-medium text-[var(--color-ink)]">
                {{ formatAppointment(form.sessionInfo.appointmentAt) }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Link action -->
        <div v-if="sessionFormUrl" class="flex items-center gap-3 rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
          <p class="flex-1 truncate text-sm text-[var(--color-ink-2)]">{{ sessionFormUrl }}</p>
          <Button variant="secondary" size="sm" @click="copyLink">
            {{ linkCopied ? '✓ Copié !' : 'Copier le lien' }}
          </Button>
        </div>
      </div>
    </template>

    <template v-else-if="form">
      <!-- AI synthesis (always shown — empty state has a CTA) -->
      <AiSynthesisPanel
        :synthesis="displayedSynthesis"
        :is-generating="isSynthesizing"
        :error="synthesisError"
        @generate="generateSynthesis"
      />

      <section
        v-if="form.aiSynthesisVersions.length"
        aria-labelledby="ai-synthesis-versions-title"
        class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="ai-synthesis-versions-title"
              class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]"
            >
              Versions de synthèse
            </h2>
            <p class="mt-1 text-xs text-[var(--color-ink-2)]">
              {{ form.aiSynthesisVersions.length }} version{{ form.aiSynthesisVersions.length > 1 ? 's' : '' }} disponible{{ form.aiSynthesisVersions.length > 1 ? 's' : '' }}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Button
              v-if="previewedVersion"
              variant="secondary"
              size="sm"
              @click="clearVersionPreview"
            >
              Revenir à l'active
            </Button>
            <Button
              v-if="hiddenVersionCount"
              variant="secondary"
              size="sm"
              @click="showAllVersions = !showAllVersions"
            >
              {{ showAllVersions ? 'Réduire' : `Voir les ${hiddenVersionCount} anciennes` }}
            </Button>
          </div>
        </div>

        <ol class="mt-3 space-y-2 text-sm">
          <li
            v-for="version in visibleSynthesisVersions"
            :key="version.id"
            class="flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-md)] border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2"
          >
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-medium text-[var(--color-ink)]">Version {{ version.version }}</span>
                <span
                  v-if="version.id === activeVersionId"
                  class="rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-xs font-medium text-primary"
                >
                  Active
                </span>
                <span
                  v-else-if="previewedVersion?.id === version.id"
                  class="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--color-ink-2)]"
                >
                  Aperçu
                </span>
              </div>
              <span class="block text-xs text-[var(--color-ink-2)]">
                {{ formatDate(version.createdAt) }} · {{ version.model }}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" @click="previewVersion(version)">
                Voir
              </Button>
              <Button
                variant="secondary"
                size="sm"
                :disabled="isActivatingVersion || version.id === activeVersionId"
                @click="activateVersion(version)"
              >
                {{ version.id === activeVersionId ? 'Active' : 'Définir active' }}
              </Button>
            </div>
          </li>
        </ol>
        <p v-if="versionActionError" class="mt-2 text-xs text-destructive" role="alert">
          {{ versionActionError }}
        </p>
      </section>

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
            <dt class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">Nom</dt>
            <dd class="mt-1 text-[15px] text-[var(--color-ink)]">{{ form.patientLastName || 'Non renseigné' }}</dd>
          </div>
          <div>
            <dt class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">Date de naissance</dt>
            <dd class="mt-1 text-[15px] text-[var(--color-ink)]">{{ formatBirthDate(form.childBirthDate) }}</dd>
          </div>
          <div v-if="form.nir">
            <dt class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">N° Sécurité sociale</dt>
            <dd class="mt-1 font-mono text-[15px] tracking-wide text-[var(--color-ink)]">{{ form.nir }}</dd>
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
        <div v-if="form.worry || form.additionalNotes" class="mt-7 space-y-5 border-t border-[var(--color-line)] pt-6">
          <div v-if="form.worry">
            <h3 class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Inquiétude principale
            </h3>
            <p class="mt-2 text-[14.5px] italic text-[var(--color-ink-2)]">« {{ form.worry }} »</p>
          </div>
          <div v-if="form.additionalNotes">
            <h3 class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Contexte supplémentaire
            </h3>
            <p class="mt-2 text-[14px] text-[var(--color-ink)]">{{ form.additionalNotes }}</p>
          </div>
        </div>
      </section>

      <!-- Custom template answers -->
      <section
        v-else-if="form.customAnswers && Object.keys(form.customAnswers).length"
        aria-labelledby="custom-data-title"
        class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6"
      >
        <h2
          id="custom-data-title"
          class="font-display text-xl font-medium tracking-[-0.014em] text-[var(--color-ink)]"
        >
          Réponses du parent
        </h2>
        <p class="mt-1 text-sm text-[var(--color-ink-2)]">
          Formulaire personnalisé — réponses transmises par le parent.
        </p>
        <dl class="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <div v-for="(answer, label) in form.customAnswers" :key="label" class="min-w-0">
            <dt class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)] truncate">{{ label }}</dt>
            <dd class="mt-1 text-[15px] text-[var(--color-ink)]">
              <template v-if="Array.isArray(answer)">
                <span v-if="answer.length === 0" class="text-[var(--color-muted-strong)]">Non renseigné</span>
                <ul v-else class="flex flex-wrap gap-1.5">
                  <li
                    v-for="item in answer"
                    :key="item"
                    class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-1 text-[13px]"
                  >{{ item }}</li>
                </ul>
              </template>
              <template v-else>
                <span v-if="!answer" class="text-[var(--color-muted-strong)]">Non renseigné</span>
                <span v-else>{{ answer }}</span>
              </template>
            </dd>
          </div>
        </dl>
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
