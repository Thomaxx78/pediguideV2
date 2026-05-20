<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
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

// Consistent with AiSynthesisPanel — same colors, same labels.
const priorityToneClasses: Record<AiSynthesis['niveau_priorite'], string> = {
  non_urgent:
    'border-[color-mix(in_oklab,var(--color-sev-1)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-sev-1)_10%,var(--color-bg))] text-[var(--color-sev-1)]',
  a_surveiller:
    'border-[color-mix(in_oklab,var(--color-sev-3)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-sev-3)_10%,var(--color-bg))] text-[var(--color-sev-3)]',
  urgent:
    'border-[color-mix(in_oklab,var(--color-sev-5)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-sev-5)_10%,var(--color-bg))] text-[var(--color-sev-5)]',
}

const priorityLabel: Record<AiSynthesis['niveau_priorite'], string> = {
  non_urgent: 'Non urgent',
  a_surveiller: 'À surveiller',
  urgent: 'Urgent',
}

const trendConfig: Record<'aggravation' | 'amelioration' | 'stable', { label: string; tone: string; icon: string }> = {
  aggravation: {
    label: 'Tendance à l\'aggravation',
    tone: 'text-[var(--color-sev-5)] bg-[color-mix(in_oklab,var(--color-sev-5)_10%,var(--color-bg))] border-[color-mix(in_oklab,var(--color-sev-5)_30%,transparent)]',
    icon: '↑',
  },
  amelioration: {
    label: 'Tendance à l\'amélioration',
    tone: 'text-[var(--color-sev-1)] bg-[color-mix(in_oklab,var(--color-sev-1)_10%,var(--color-bg))] border-[color-mix(in_oklab,var(--color-sev-1)_30%,transparent)]',
    icon: '↓',
  },
  stable: {
    label: 'État stable',
    tone: 'text-[var(--color-ink-2)] bg-[var(--color-surface-2)] border-[var(--color-line)]',
    icon: '→',
  },
}

onMounted(async () => {
  try {
    dossier.value = await api.children.get<ChildDossier>(id)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Impossible de charger ce dossier.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 md:py-12">
    <!-- Back link -->
    <Button as-child variant="ghost" size="sm" class="self-start">
      <button type="button" @click="router.push('/dashboard/patients')">
        <svg viewBox="0 0 16 16" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 8H3" />
          <path d="M7 4l-4 4 4 4" />
        </svg>
        Retour aux dossiers
      </button>
    </Button>

    <!-- Loading -->
    <div
      v-if="isLoading"
      class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-10 text-center text-sm text-[var(--color-ink-2)]"
      aria-live="polite"
    >
      Chargement du dossier…
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-10 text-center text-sm text-destructive"
      role="alert"
    >
      {{ error }}
    </div>

    <template v-else-if="dossier">
      <!-- Header card -->
      <header class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 space-y-1">
            <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
              Dossier patient
            </p>
            <h1 class="font-display text-[26px] font-medium tracking-[-0.018em] text-[var(--color-ink)]">
              {{ dossier.firstName }} {{ dossier.lastName }}
            </h1>
            <p class="text-[14.5px] text-[var(--color-ink-2)]">
              {{ getAge(dossier.birthDate) }} · Né(e) le {{ formatDate(dossier.birthDate) }}
            </p>
            <p class="text-[12px] font-mono text-[var(--color-muted-strong)]">
              N° SS · {{ dossier.nir }}
            </p>
          </div>
          <div class="shrink-0 text-right">
            <p class="font-display text-3xl font-medium text-primary tabular-nums">
              {{ dossier.consultationCount }}
            </p>
            <p class="text-[12px] text-[var(--color-muted-strong)]">
              consultation{{ dossier.consultationCount > 1 ? 's' : '' }}
            </p>
          </div>
        </div>

        <!-- Trend indicator -->
        <div
          v-if="dossier.trend"
          :class="['mt-5 flex items-center gap-2 rounded-[var(--r-md)] border px-4 py-2.5 text-[13.5px]', trendConfig[dossier.trend].tone]"
        >
          <span class="font-medium text-lg leading-none" aria-hidden="true">{{ trendConfig[dossier.trend].icon }}</span>
          <span class="font-medium">{{ trendConfig[dossier.trend].label }}</span>
          <span class="text-[12px] opacity-70">(basée sur les 2 dernières synthèses IA)</span>
        </div>
        <p v-else class="mt-5 text-[12.5px] italic text-[var(--color-muted-strong)]">
          La tendance s'affichera lorsque 2 synthèses IA auront été générées pour cet enfant.
        </p>
      </header>

      <!-- Timeline -->
      <section>
        <h2 class="mb-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
          Historique des consultations
        </h2>

        <ol class="relative space-y-3 pl-6">
          <!-- Vertical timeline line -->
          <div class="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--color-line)]" aria-hidden="true" />

          <li v-for="(consult, index) in dossier.consultations" :key="consult.id" class="relative">
            <!-- Timeline dot -->
            <div
              aria-hidden="true"
              class="absolute -left-[19px] top-6 size-[14px] rounded-full border-2 border-primary bg-[var(--color-bg)]"
            />

            <article class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
              <header class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[14px] font-medium text-[var(--color-ink)]">
                    {{ formatDate(consult.createdAt) }}
                  </p>
                  <p class="mt-0.5 text-[13.5px] text-[var(--color-ink-2)]">
                    {{ consult.consultationReason }}
                  </p>
                </div>
                <div class="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    v-if="consult.aiSynthesis"
                    :class="['inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium', priorityToneClasses[consult.aiSynthesis.niveau_priorite]]"
                  >
                    {{ priorityLabel[consult.aiSynthesis.niveau_priorite] }}
                  </span>
                  <span
                    v-if="index === 0"
                    class="inline-flex items-center rounded-full bg-[var(--color-primary-soft)] px-2.5 py-0.5 text-[11.5px] font-medium text-primary"
                  >
                    Dernière
                  </span>
                </div>
              </header>

              <!-- AI summary excerpt -->
              <div
                v-if="consult.aiSynthesis"
                class="mt-4 space-y-2 rounded-[var(--r-md)] border border-[var(--color-line)] bg-[var(--color-bg)] p-3.5"
              >
                <p
                  v-if="consult.aiSynthesis.resume_message_libre"
                  class="text-[13.5px] leading-relaxed text-[var(--color-ink)]"
                >
                  {{ consult.aiSynthesis.resume_message_libre }}
                </p>
                <div
                  v-if="consult.aiSynthesis.points_attention?.length"
                  class="flex flex-wrap gap-1.5"
                >
                  <span
                    v-for="point in consult.aiSynthesis.points_attention"
                    :key="point"
                    class="rounded-full border border-[color-mix(in_oklab,var(--color-sev-5)_25%,transparent)] bg-[color-mix(in_oklab,var(--color-sev-5)_10%,var(--color-bg))] px-2 py-0.5 text-[11.5px] font-medium text-[var(--color-sev-5)]"
                  >
                    {{ point }}
                  </span>
                </div>
              </div>
              <p v-else class="mt-3 text-[12px] italic text-[var(--color-muted-strong)]">
                Synthèse IA non encore générée
              </p>

              <footer class="mt-4 border-t border-[var(--color-line)] pt-3">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] text-[12.5px] font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
                  @click="router.push(`/dashboard/${consult.id}`)"
                >
                  Voir la fiche complète
                  <svg viewBox="0 0 16 16" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 8h10" /><path d="M9 4l4 4-4 4" />
                  </svg>
                </button>
              </footer>
            </article>
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>
