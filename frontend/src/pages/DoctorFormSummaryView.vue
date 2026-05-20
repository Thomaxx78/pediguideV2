<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  doctorFormsApi,
  type DoctorFormDetail,
  type AiSynthesis,
  type AiSynthesisVersion,
} from '@/services/doctorFormsApi'
import api from '@/services/api'
import { downloadDiagnosisPdf } from '@/services/pdfDownload'

const route = useRoute()

const formId = computed(() => String(route.params.id || ''))
const form = ref<DoctorFormDetail | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const synthesis = ref<AiSynthesis | null>(null)
const synthesisVersions = ref<AiSynthesisVersion[]>([])
const activeVersionId = ref<string | null>(null)
const previewedVersion = ref<AiSynthesisVersion | null>(null)
const showAllVersions = ref(false)
const isSynthesizing = ref(false)
const synthesisError = ref<string | null>(null)
const isActivatingVersion = ref(false)
const versionActionError = ref<string | null>(null)
const isDownloadingPdf = ref(false)
const pdfError = ref<string | null>(null)

const priorityConfig = {
  non_urgent: { label: 'Non urgent', classes: 'bg-green-100 text-green-800 border-green-200' },
  a_surveiller: { label: 'À surveiller', classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  urgent: { label: 'Urgent', classes: 'bg-red-100 text-red-800 border-red-200' },
}

const worryConfig: Record<string, { label: string; classes: string }> = {
  faible: { label: 'Faible', classes: 'text-green-700' },
  modéré: { label: 'Modéré', classes: 'text-yellow-700' },
  élevé: { label: 'Élevé', classes: 'text-red-700' },
}

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const findVersionIdForSynthesis = (target: AiSynthesis) => {
  const targetJson = JSON.stringify(target)
  return synthesisVersions.value.find((version) => JSON.stringify(version.synthesis) === targetJson)?.id ?? null
}

const activeVersion = computed(() =>
  synthesisVersions.value.find((version) => version.id === activeVersionId.value) ?? null
)

const displayedSynthesis = computed(() => previewedVersion.value?.synthesis ?? synthesis.value)

const displayedVersionLabel = computed(() => {
  if (previewedVersion.value) return `Aperçu version ${previewedVersion.value.version}`
  if (activeVersion.value) return `Version active ${activeVersion.value.version}`
  return 'Générée automatiquement'
})

const visibleSynthesisVersions = computed(() =>
  showAllVersions.value ? synthesisVersions.value : synthesisVersions.value.slice(0, 3)
)

const hiddenVersionCount = computed(() => Math.max(synthesisVersions.value.length - 3, 0))

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
    synthesisVersions.value = form.value.aiSynthesisVersions
    if (form.value.aiSynthesis) {
      synthesis.value = form.value.aiSynthesis
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
  if (!formId.value) return
  isSynthesizing.value = true
  synthesisError.value = null
  versionActionError.value = null

  try {
    const result = await api.diagnosis.synthesize(formId.value) as {
      synthesis: AiSynthesis
      version?: AiSynthesisVersion
    }
    synthesis.value = result.synthesis
    if (result.version) {
      synthesisVersions.value = [result.version, ...synthesisVersions.value]
      activeVersionId.value = result.version.id
      previewedVersion.value = null
      showAllVersions.value = false
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
  if (!formId.value || version.id === activeVersionId.value) return
  isActivatingVersion.value = true
  versionActionError.value = null

  try {
    const result = await api.diagnosis.activateSynthesisVersion(formId.value, version.id) as {
      synthesis: AiSynthesis
      version: AiSynthesisVersion
    }
    synthesis.value = result.synthesis
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
  synthesis.value = null
  synthesisVersions.value = []
  activeVersionId.value = null
  previewedVersion.value = null
  showAllVersions.value = false
  loadForm()
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 py-10">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div class="space-y-2">
        <h1 id="doctor-form-summary-title" class="text-3xl font-semibold tracking-tight text-foreground">
          Résumé du formulaire
        </h1>
        <p class="text-muted-foreground">
          Consultez les informations transmises par le patient.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          :disabled="isDownloadingPdf || !formId"
          @click="downloadPdf"
        >
          {{ isDownloadingPdf ? 'Téléchargement...' : synthesis ? 'PDF avec synthèse IA' : 'Télécharger PDF' }}
        </Button>
        <Button as-child variant="outline">
          <RouterLink to="/dashboard">Retour au tableau de bord</RouterLink>
        </Button>
      </div>
    </header>
    <p v-if="pdfError" class="text-sm text-destructive" role="alert">{{ pdfError }}</p>

    <div v-if="isLoading" class="rounded-2xl border border-border/70 bg-background p-8">
      <p class="text-sm text-muted-foreground" aria-live="polite">Chargement...</p>
    </div>

    <div v-else-if="error" class="rounded-2xl border border-border/70 bg-background p-8">
      <p class="text-sm text-destructive" aria-live="polite">{{ error }}</p>
    </div>

    <template v-else>
      <!-- Bloc synthèse IA -->
      <section aria-labelledby="ai-synthesis-title">
        <Card v-if="displayedSynthesis" class="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle id="ai-synthesis-title" as="h2" class="flex items-center gap-2 text-xl">
                  Synthèse IA
                </CardTitle>
                <CardDescription>{{ displayedVersionLabel }}</CardDescription>
              </div>
              <span
                class="rounded-full border px-3 py-1 text-sm font-semibold"
                :class="priorityConfig[displayedSynthesis.niveau_priorite]?.classes"
              >
                {{ priorityConfig[displayedSynthesis.niveau_priorite]?.label }}
              </span>
            </div>
          </CardHeader>
          <CardContent class="space-y-5">
            <div class="flex flex-wrap justify-end gap-2">
              <Button
                v-if="previewedVersion"
                variant="outline"
                size="sm"
                @click="clearVersionPreview"
              >
                Revenir à l'active
              </Button>
              <Button
                variant="outline"
                size="sm"
                :disabled="isSynthesizing"
                @click="generateSynthesis"
              >
                {{ isSynthesizing ? 'Régénération...' : 'Régénérer' }}
              </Button>
              <Button
                variant="outline"
                size="sm"
                :disabled="isDownloadingPdf"
                @click="downloadPdf"
              >
                {{ isDownloadingPdf ? 'Téléchargement...' : 'Exporter le PDF' }}
              </Button>
            </div>

            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Motif principal</p>
              <p class="mt-1 text-sm font-medium text-foreground">{{ displayedSynthesis.motif_principal }}</p>
            </div>

            <div v-if="displayedSynthesis.symptomes_cles.length" class="grid gap-4 sm:grid-cols-2">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Symptômes clés</p>
                <ul class="mt-1 list-disc pl-4 text-sm text-foreground">
                  <li v-for="s in displayedSynthesis.symptomes_cles" :key="s">{{ s }}</li>
                </ul>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Durée d'évolution</p>
                <p class="mt-1 text-sm text-foreground">{{ displayedSynthesis.duree_evolution }}</p>
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Inquiétude parent</p>
                <p
                  class="mt-1 text-sm font-semibold"
                  :class="worryConfig[displayedSynthesis.niveau_inquietude_parent]?.classes"
                >
                  {{ worryConfig[displayedSynthesis.niveau_inquietude_parent]?.label ?? displayedSynthesis.niveau_inquietude_parent }}
                </p>
              </div>
              <div v-if="displayedSynthesis.actions_deja_prises.length">
                <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions déjà prises</p>
                <ul class="mt-1 list-disc pl-4 text-sm text-foreground">
                  <li v-for="a in displayedSynthesis.actions_deja_prises" :key="a">{{ a }}</li>
                </ul>
              </div>
            </div>

            <div v-if="displayedSynthesis.points_attention.length" class="rounded-lg border border-red-200 bg-red-50 p-3">
              <p class="text-xs font-semibold uppercase tracking-wide text-red-700">Points d'attention clinique</p>
              <ul class="mt-1 list-disc pl-4 text-sm text-red-800">
                <li v-for="p in displayedSynthesis.points_attention" :key="p">{{ p }}</li>
              </ul>
            </div>

            <div v-if="displayedSynthesis.resume_message_libre">
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message complémentaire</p>
              <p class="mt-1 text-sm italic text-foreground">{{ displayedSynthesis.resume_message_libre }}</p>
            </div>

            <p class="border-t border-border/70 pt-3 text-xs text-muted-foreground">
              {{ displayedSynthesis.disclaimer }}
            </p>

            <div v-if="synthesisVersions.length" class="border-t border-border/70 pt-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Versions de synthèse
                  </p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    {{ synthesisVersions.length }} version{{ synthesisVersions.length > 1 ? 's' : '' }} disponible{{ synthesisVersions.length > 1 ? 's' : '' }}
                  </p>
                </div>
                <Button
                  v-if="hiddenVersionCount"
                  variant="outline"
                  size="sm"
                  @click="showAllVersions = !showAllVersions"
                >
                  {{ showAllVersions ? 'Réduire' : `Voir les ${hiddenVersionCount} anciennes` }}
                </Button>
              </div>
              <ol class="mt-2 space-y-2 text-sm">
                <li
                  v-for="version in visibleSynthesisVersions"
                  :key="version.id"
                  class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2"
                >
                  <div class="space-y-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-medium text-foreground">Version {{ version.version }}</span>
                      <span
                        v-if="version.id === activeVersionId"
                        class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                      >
                        Active
                      </span>
                      <span
                        v-else-if="previewedVersion?.id === version.id"
                        class="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      >
                        Aperçu
                      </span>
                    </div>
                    <span class="block text-xs text-muted-foreground">
                      {{ formatDate(version.createdAt) }} · {{ version.model }}
                    </span>
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      @click="previewVersion(version)"
                    >
                      Voir
                    </Button>
                    <Button
                      variant="outline"
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
            </div>
          </CardContent>
        </Card>

        <div v-else class="rounded-2xl border border-dashed border-border/70 bg-background p-6 text-center">
          <p class="mb-3 text-sm text-muted-foreground">
            Aucune synthèse générée pour ce formulaire.
          </p>
          <Button
            :disabled="isSynthesizing"
            @click="generateSynthesis"
          >
            {{ isSynthesizing ? 'Génération en cours...' : 'Générer la synthèse IA' }}
          </Button>
          <p v-if="synthesisError" class="mt-2 text-xs text-destructive" role="alert">
            {{ synthesisError }}
          </p>
        </div>
      </section>

      <!-- Données brutes -->
      <section aria-labelledby="doctor-form-summary-section-title">
        <Card>
          <CardHeader>
            <CardTitle id="doctor-form-summary-section-title" as="h2">
              Informations générales
            </CardTitle>
            <CardDescription>
              Soumis le {{ form ? formatDate(form.submittedAt) : '' }}
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <section class="space-y-3">
              <h3 class="text-base font-semibold text-foreground">Patient</h3>
              <dl class="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt class="text-sm font-medium text-muted-foreground">Prénom</dt>
                  <dd class="text-sm text-foreground">{{ form?.patientFirstName || 'Non renseigné' }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-muted-foreground">Nom</dt>
                  <dd class="text-sm text-foreground">{{ form?.patientLastName || 'Non renseigné' }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-muted-foreground">Identifiant</dt>
                  <dd class="text-sm text-foreground">{{ form?.id || 'Non renseigné' }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-muted-foreground">Date de naissance</dt>
                  <dd class="text-sm text-foreground">{{ form?.childBirthDate || 'Non renseigné' }}</dd>
                </div>
              </dl>
            </section>

            <section class="space-y-3">
              <h3 class="text-base font-semibold text-foreground">Motif de consultation</h3>
              <p class="text-sm text-foreground">{{ form?.consultationReason || 'Non renseigné' }}</p>
            </section>

            <section class="grid gap-6 md:grid-cols-2">
              <div class="space-y-3">
                <h3 class="text-base font-semibold text-foreground">Signes cliniques</h3>
                <ul v-if="form?.clinicalSigns?.length" class="list-disc pl-5 text-sm text-foreground">
                  <li v-for="item in form?.clinicalSigns" :key="item">{{ item }}</li>
                </ul>
                <p v-else class="text-sm text-muted-foreground">Aucun signe rapporté.</p>
              </div>
              <div class="space-y-3">
                <h3 class="text-base font-semibold text-foreground">Changements observés</h3>
                <ul v-if="form?.behaviorChanges?.length" class="list-disc pl-5 text-sm text-foreground">
                  <li v-for="item in form?.behaviorChanges" :key="item">{{ item }}</li>
                </ul>
                <p v-else class="text-sm text-muted-foreground">Aucun changement indiqué.</p>
              </div>
            </section>

            <section class="grid gap-6 md:grid-cols-2">
              <div class="space-y-3">
                <h3 class="text-base font-semibold text-foreground">Durée</h3>
                <p class="text-sm text-foreground">{{ form?.duration || 'Non renseigné' }}</p>
              </div>
              <div class="space-y-3">
                <h3 class="text-base font-semibold text-foreground">Niveau de préoccupation</h3>
                <p class="text-sm text-foreground">{{ form?.worryLevel || 'Non renseigné' }}</p>
              </div>
            </section>

            <section class="space-y-3">
              <h3 class="text-base font-semibold text-foreground">Actions déjà prises</h3>
              <ul v-if="form?.actionsTaken?.length" class="list-disc pl-5 text-sm text-foreground">
                <li v-for="item in form?.actionsTaken" :key="item">{{ item }}</li>
              </ul>
              <p v-else class="text-sm text-muted-foreground">Aucune action indiquée.</p>
            </section>

            <section class="space-y-3">
              <h3 class="text-base font-semibold text-foreground">Notes complémentaires</h3>
              <p class="text-sm text-foreground">{{ form?.additionalNotes || 'Aucune note' }}</p>
            </section>
          </CardContent>
        </Card>
      </section>
    </template>
  </div>
</template>
