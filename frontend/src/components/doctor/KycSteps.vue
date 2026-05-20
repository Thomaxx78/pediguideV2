<script setup lang="ts">
import { computed } from 'vue'

type KycState = 'verified' | 'pending' | 'rejected'

const props = defineProps<{
  state: KycState
}>()

interface Step {
  index: number
  title: string
  status: string
  state: 'done' | 'current' | 'pending'
}

const steps = computed<Step[]>(() => {
  if (props.state === 'verified') {
    return [
      { index: 1, title: 'Compte créé', status: 'Confirmé', state: 'done' },
      { index: 2, title: 'Vérification RPPS', status: 'Validé', state: 'done' },
      { index: 3, title: 'Accès complet activé', status: 'En cours', state: 'done' },
    ]
  }
  if (props.state === 'rejected') {
    return [
      { index: 1, title: 'Compte créé', status: 'Confirmé', state: 'done' },
      { index: 2, title: 'Vérification RPPS', status: 'Refusée', state: 'current' },
      { index: 3, title: 'Accès complet activé', status: 'En attente', state: 'pending' },
    ]
  }
  // pending (default)
  return [
    { index: 1, title: 'Compte créé', status: 'Confirmé', state: 'done' },
    { index: 2, title: 'Vérification RPPS', status: 'En cours', state: 'current' },
    { index: 3, title: 'Accès complet activé', status: 'En attente', state: 'pending' },
  ]
})

const dotClass = (state: Step['state']) => {
  switch (state) {
    case 'done':
      return 'bg-primary text-primary-foreground border-primary'
    case 'current':
      return 'bg-[var(--color-ink)] text-white border-[var(--color-ink)]'
    case 'pending':
    default:
      return 'bg-[var(--color-surface-2)] text-[var(--color-ink-2)] border-[var(--color-line)]'
  }
}
</script>

<template>
  <ol class="grid divide-y divide-[var(--color-line)] overflow-hidden rounded-[var(--r-md)] border border-[var(--color-line)] md:grid-cols-3 md:divide-x md:divide-y-0">
    <li
      v-for="step in steps"
      :key="step.index"
      class="flex items-center gap-3 p-4 md:flex-col md:items-start md:gap-2"
    >
      <span
        :class="[
          'inline-flex size-[22px] items-center justify-center rounded-full border text-[11px] font-medium',
          dotClass(step.state),
        ]"
      >
        <template v-if="step.state === 'done'">
          <svg viewBox="0 0 16 16" class="size-3" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 8.5l3.5 3.5L13 5" />
          </svg>
        </template>
        <template v-else>{{ step.index }}</template>
      </span>
      <div class="flex-1">
        <p class="text-[13.5px] font-medium text-[var(--color-ink)]">{{ step.title }}</p>
        <p class="mt-0.5 text-[12.5px] text-[var(--color-muted-strong)]">{{ step.status }}</p>
      </div>
    </li>
  </ol>
</template>
