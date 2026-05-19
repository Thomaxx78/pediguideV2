<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

interface AiSynthesis {
  motif_principal: string
  symptomes_cles: string[]
  niveau_inquietude_parent: 'faible' | 'modéré' | 'élevé'
  niveau_priorite: 'non_urgent' | 'a_surveiller' | 'urgent'
  points_attention: string[]
  resume_message_libre: string | null
}

interface Consultation {
  id: string
  createdAt: string
  consultationReason: string
  worryLevel: string
  duration: string
  clinicalSigns: string[] | null
  behaviorChanges: string[] | null
  aiSynthesis: AiSynthesis | null
  status: string
}

interface ChildDossier {
  id: string
  firstName: string
  lastName: string
  birthDate: string
  nir: string
  createdAt: string
  consultationCount: number
  trend: 'aggravation' | 'amelioration' | 'stable' | null
  consultations: Consultation[]
}

const dossier = ref<ChildDossier | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const getAge = (birthDate: string) => {
  const birth = new Date(birthDate)
  const now = new Date()
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
  if (months < 24) return `${months} mois`
  return `${Math.floor(months / 12)} ans`
}

const priorityLabel: Record<string, { label: string; class: string }> = {
  urgent: { label: 'Urgent', class: 'bg-destructive/15 text-destructive' },
  a_surveiller: { label: 'À surveiller', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  non_urgent: { label: 'Non urgent', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

const trendConfig = {
  aggravation: { label: 'Tendance à l\'aggravation', class: 'text-destructive', icon: '↑' },
  amelioration: { label: 'Tendance à l\'amélioration', class: 'text-emerald-600 dark:text-emerald-400', icon: '↓' },
  stable: { label: 'État stable', class: 'text-muted-foreground', icon: '→' },
}

onMounted(async () => {
  try {
    dossier.value = await api.children.get(id)
  } catch (err: any) {
    error.value = err.message || 'Impossible de charger ce dossier.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6">

    <button class="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" @click="router.back()">
      ← Retour aux dossiers
    </button>

    <section v-if="isLoading" class="rounded-2xl border border-border/70 p-8 text-center text-sm text-muted-foreground">
      Chargement du dossier...
    </section>

    <section v-else-if="error" class="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
      {{ error }}
    </section>

    <template v-else-if="dossier">
      <!-- En-tête dossier -->
      <div class="mb-6 rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <h1 class="text-xl font-semibold text-foreground">{{ dossier.firstName }} {{ dossier.lastName }}</h1>
            <p class="text-sm text-muted-foreground">{{ getAge(dossier.birthDate) }} · Né(e) le {{ formatDate(dossier.birthDate) }}</p>
            <p class="text-xs text-muted-foreground">N° SS : {{ dossier.nir }}</p>
          </div>
          <div class="shrink-0 text-right">
            <p class="text-2xl font-bold text-primary">{{ dossier.consultationCount }}</p>
            <p class="text-xs text-muted-foreground">consultation{{ dossier.consultationCount > 1 ? 's' : '' }}</p>
          </div>
        </div>

        <!-- Tendance -->
        <div v-if="dossier.trend" class="mt-4 flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-4 py-2.5">
          <span class="text-lg font-bold" :class="trendConfig[dossier.trend].class">
            {{ trendConfig[dossier.trend].icon }}
          </span>
          <span class="text-sm font-medium" :class="trendConfig[dossier.trend].class">
            {{ trendConfig[dossier.trend].label }}
          </span>
          <span class="text-xs text-muted-foreground">(basée sur les 2 dernières synthèses IA)</span>
        </div>
        <p v-else class="mt-3 text-xs text-muted-foreground italic">
          La tendance s'affichera lorsque 2 synthèses IA auront été générées pour cet enfant.
        </p>
      </div>

      <!-- Timeline des consultations -->
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Historique des consultations</h2>

      <div class="relative space-y-4 pl-6">
        <!-- Ligne verticale de la timeline -->
        <div class="absolute left-2 top-2 bottom-2 w-px bg-border" aria-hidden="true" />

        <div
          v-for="(consult, index) in dossier.consultations"
          :key="consult.id"
          class="relative"
        >
          <!-- Point sur la timeline -->
          <div class="absolute -left-4 top-5 h-3 w-3 rounded-full border-2 border-primary bg-background" aria-hidden="true" />

          <div class="rounded-2xl border border-border/70 bg-background p-5 shadow-sm">
            <div class="mb-3 flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-medium text-foreground">{{ formatDate(consult.createdAt) }}</p>
                <p class="mt-0.5 text-sm text-muted-foreground">{{ consult.consultationReason }}</p>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-1.5">
                <span
                  v-if="consult.aiSynthesis"
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="priorityLabel[consult.aiSynthesis.niveau_priorite]?.class"
                >
                  {{ priorityLabel[consult.aiSynthesis.niveau_priorite]?.label }}
                </span>
                <span v-if="index === 0" class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  Dernière
                </span>
              </div>
            </div>

            <!-- Synthèse IA résumée -->
            <div v-if="consult.aiSynthesis" class="mt-3 space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
              <p v-if="consult.aiSynthesis.resume_message_libre" class="text-foreground">
                {{ consult.aiSynthesis.resume_message_libre }}
              </p>
              <div v-if="consult.aiSynthesis.points_attention?.length" class="flex flex-wrap gap-1.5">
                <span
                  v-for="point in consult.aiSynthesis.points_attention"
                  :key="point"
                  class="rounded-md bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                >
                  {{ point }}
                </span>
              </div>
            </div>
            <p v-else class="mt-2 text-xs text-muted-foreground italic">Synthèse IA non encore générée</p>

            <div class="mt-3 border-t border-border/50 pt-3">
              <button
                class="text-xs font-medium text-primary hover:underline"
                @click="router.push(`/dashboard/${consult.id}`)"
              >
                Voir la fiche complète →
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>
