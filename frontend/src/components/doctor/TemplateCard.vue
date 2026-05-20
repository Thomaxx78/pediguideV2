<script setup lang="ts">
import { computed } from 'vue'

interface Template {
  id: string
  title: string
  description: string | null
  questions: unknown[]
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

const props = defineProps<{
  template: Template
}>()

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'delete', id: string): void
}>()

const questionCount = computed(() => props.template.questions?.length ?? 0)

const updatedLabel = computed(() => {
  const raw = props.template.updatedAt ?? props.template.createdAt
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date)
})

const onCardClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (target?.closest('button')) return // don't navigate if a footer button was clicked
  emit('edit', props.template.id)
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('edit', props.template.id)
  }
}
</script>

<template>
  <article
    role="link"
    tabindex="0"
    :aria-label="`Modifier le questionnaire ${template.title}`"
    class="group flex cursor-pointer flex-col gap-3.5 rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-line-2)] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
    @click="onCardClick"
    @keydown="onKeydown"
  >
    <header class="flex items-start justify-between gap-2">
      <h3 class="font-display text-[17px] font-medium tracking-[-0.012em] text-[var(--color-ink)]">
        {{ template.title }}
      </h3>
      <span
        v-if="template.isActive"
        class="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--color-sev-1)_12%,var(--color-bg))] px-2 py-0.5 text-[11px] font-medium text-[var(--color-sev-1)]"
      >
        <span class="inline-block size-1.5 rounded-full bg-[var(--color-sev-1)]"></span>
        Actif
      </span>
      <span
        v-else
        class="inline-flex items-center rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted-strong)]"
      >Inactif</span>
    </header>

    <p
      v-if="template.description"
      class="text-[13.5px] leading-snug text-[var(--color-ink-2)]"
    >
      {{ template.description }}
    </p>

    <footer class="mt-auto flex items-center justify-between gap-3 border-t border-[var(--color-line)] pt-3 text-[12px] text-[var(--color-muted-strong)]">
      <div class="flex items-center gap-2">
        <span>{{ questionCount }} question{{ questionCount > 1 ? 's' : '' }}</span>
        <span v-if="updatedLabel" aria-hidden="true">·</span>
        <span v-if="updatedLabel">Mis à jour {{ updatedLabel }}</span>
      </div>
      <button
        type="button"
        class="rounded-[var(--r-sm)] px-2 py-1 text-[12px] font-medium text-[var(--color-muted-strong)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-destructive focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
        @click="emit('delete', template.id)"
      >
        Supprimer
      </button>
    </footer>
  </article>
</template>
