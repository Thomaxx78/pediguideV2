<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import type { AiSynthesis } from '@/services/doctorFormsApi'

const props = defineProps<{
  synthesis: AiSynthesis | null
  isGenerating: boolean
  error: string | null
}>()

const emit = defineEmits<{
  (e: 'generate'): void
}>()

type State = 'empty' | 'loading' | 'generated' | 'error'

const state = computed<State>(() => {
  if (props.isGenerating) return 'loading'
  if (props.error) return 'error'
  if (props.synthesis) return 'generated'
  return 'empty'
})

const priorityLabel: Record<AiSynthesis['niveau_priorite'], string> = {
  non_urgent: 'Non urgent',
  a_surveiller: 'À surveiller',
  urgent: 'Urgent',
}

const priorityToneClasses: Record<AiSynthesis['niveau_priorite'], string> = {
  non_urgent: 'border-[color-mix(in_oklab,var(--color-sev-1)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-sev-1)_8%,var(--color-bg))] text-[var(--color-sev-1)]',
  a_surveiller: 'border-[color-mix(in_oklab,var(--color-sev-3)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-sev-3)_8%,var(--color-bg))] text-[var(--color-sev-3)]',
  urgent: 'border-[color-mix(in_oklab,var(--color-sev-5)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-sev-5)_8%,var(--color-bg))] text-[var(--color-sev-5)]',
}

const onGenerate = () => emit('generate')
</script>

<template>
  <section
    aria-labelledby="ai-synthesis-title"
    class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6"
  >
    <!-- Header — sparkle + label + (optional timestamp later) -->
    <header class="mb-4 flex items-start justify-between gap-3">
      <span class="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-ink-2)]">
        <span
          aria-hidden="true"
          class="inline-flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <svg viewBox="0 0 16 16" class="size-2.5" fill="currentColor">
            <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13 6.5 8.5 2 7l4.5-1.5z" />
          </svg>
        </span>
        <span id="ai-synthesis-title">Synthèse assistée</span>
      </span>
    </header>

    <!-- Empty state -->
    <div v-if="state === 'empty'" class="flex flex-col items-center gap-4 py-6 text-center">
      <p class="max-w-[420px] text-[14px] text-[var(--color-ink-2)]">
        Pediguide peut générer une synthèse clinique structurée — motif principal, signaux d'alerte,
        priorité — à partir des réponses du parent.
      </p>
      <Button type="button" @click="onGenerate">Générer la synthèse</Button>
    </div>

    <!-- Loading state -->
    <div v-else-if="state === 'loading'" class="flex flex-col gap-3 py-2" aria-live="polite">
      <span class="block h-3 w-3/4 animate-pulse rounded-[var(--r-sm)] bg-[var(--color-surface-2)]"></span>
      <span class="block h-3 w-11/12 animate-pulse rounded-[var(--r-sm)] bg-[var(--color-surface-2)]"></span>
      <span class="block h-3 w-1/2 animate-pulse rounded-[var(--r-sm)] bg-[var(--color-surface-2)]"></span>
      <span class="block h-3 w-11/12 animate-pulse rounded-[var(--r-sm)] bg-[var(--color-surface-2)]"></span>
      <p class="mt-3 text-xs text-[var(--color-muted-strong)]">Analyse en cours… ~10 secondes</p>
    </div>

    <!-- Error state -->
    <div v-else-if="state === 'error'" class="flex flex-col items-center gap-4 py-6 text-center" role="alert">
      <p class="max-w-[420px] text-[14px] text-[var(--color-sev-5)]">
        {{ error || 'La synthèse n\'a pas pu être générée. Le service est momentanément indisponible.' }}
      </p>
      <Button type="button" variant="secondary" @click="onGenerate">Réessayer</Button>
    </div>

    <!-- Generated state -->
    <div v-else-if="state === 'generated' && synthesis" class="flex flex-col gap-4">
      <!-- Priority block -->
      <div
        :class="[
          'flex flex-col gap-1.5 rounded-[var(--r-md)] border px-4 py-3.5 sm:flex-row sm:items-center sm:gap-3',
          priorityToneClasses[synthesis.niveau_priorite],
        ]"
      >
        <span class="text-[13px] font-medium uppercase tracking-wide">
          {{ priorityLabel[synthesis.niveau_priorite] }}
        </span>
        <span class="text-[13.5px] text-[var(--color-ink-2)]">— {{ synthesis.motif_principal }}</span>
      </div>

      <!-- Symptoms + duration + worry -->
      <dl class="grid gap-4 sm:grid-cols-2">
        <div v-if="synthesis.symptomes_cles.length">
          <dt class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
            Symptômes clés
          </dt>
          <ul class="mt-1.5 flex flex-col gap-1 text-[14px] text-[var(--color-ink)]">
            <li v-for="s in synthesis.symptomes_cles" :key="s" class="flex items-start gap-2">
              <span aria-hidden="true" class="mt-2 inline-block size-1 shrink-0 rounded-full bg-primary"></span>
              <span>{{ s }}</span>
            </li>
          </ul>
        </div>
        <div>
          <dt class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
            Durée d'évolution
          </dt>
          <dd class="mt-1.5 text-[14px] text-[var(--color-ink)]">
            {{ synthesis.duree_evolution || 'Non renseigné' }}
          </dd>
          <dt class="mt-4 text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
            Inquiétude du parent
          </dt>
          <dd class="mt-1.5 text-[14px] text-[var(--color-ink)]">
            {{ synthesis.niveau_inquietude_parent }}
          </dd>
        </div>
      </dl>

      <!-- Points d'attention (red flags equivalent — comes from AI) -->
      <div
        v-if="synthesis.points_attention.length"
        class="rounded-[var(--r-md)] border border-[color-mix(in_oklab,var(--color-sev-5)_25%,transparent)] bg-[color-mix(in_oklab,var(--color-sev-5)_6%,var(--color-bg))] p-4"
      >
        <p class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-sev-5)]">
          Points d'attention clinique
        </p>
        <ul class="mt-2 flex flex-col gap-1 text-[14px] text-[var(--color-ink)]">
          <li v-for="p in synthesis.points_attention" :key="p" class="flex items-start gap-2">
            <span aria-hidden="true" class="mt-2 inline-block size-1 shrink-0 rounded-full bg-[var(--color-sev-5)]"></span>
            <span>{{ p }}</span>
          </li>
        </ul>
      </div>

      <!-- Actions déjà prises -->
      <div v-if="synthesis.actions_deja_prises.length">
        <p class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
          Actions déjà prises
        </p>
        <ul class="mt-1.5 flex flex-col gap-1 text-[14px] text-[var(--color-ink)]">
          <li v-for="a in synthesis.actions_deja_prises" :key="a" class="flex items-start gap-2">
            <span aria-hidden="true" class="mt-2 inline-block size-1 shrink-0 rounded-full bg-[var(--color-line-2)]"></span>
            <span>{{ a }}</span>
          </li>
        </ul>
      </div>

      <!-- Message libre -->
      <div v-if="synthesis.resume_message_libre">
        <p class="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
          Message complémentaire
        </p>
        <p class="mt-1.5 text-[14px] italic text-[var(--color-ink-2)]">
          {{ synthesis.resume_message_libre }}
        </p>
      </div>

      <!-- Footer — disclaimer + regenerate -->
      <footer class="mt-2 flex flex-col items-start gap-3 border-t border-[var(--color-line)] pt-4 text-[12px] text-[var(--color-muted-strong)] sm:flex-row sm:items-center sm:justify-between">
        <span class="max-w-[480px]">{{ synthesis.disclaimer }}</span>
        <button
          type="button"
          class="rounded-[var(--r-sm)] px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--color-ink-2)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
          @click="onGenerate"
        >
          Régénérer
        </button>
      </footer>
    </div>
  </section>
</template>
