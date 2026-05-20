<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import type { DoctorFormSummary } from '@/services/doctorFormsApi'

const props = withDefaults(
  defineProps<{
    forms: DoctorFormSummary[]
    isLoading?: boolean
    error?: string | null
    /** True when the empty state is the result of an active search filter rather than no data at all. */
    searchActive?: boolean
  }>(),
  {
    isLoading: false,
    error: null,
    searchActive: false,
  },
)

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

const isEmpty = computed(
  () => !props.isLoading && !props.error && props.forms.length === 0,
)

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const priorityConfig = {
  non_urgent: { label: 'Non urgent', dot: 'bg-[var(--color-sev-1)]' },
  a_surveiller: { label: 'À surveiller', dot: 'bg-[var(--color-sev-3)]' },
  urgent: { label: 'Urgent', dot: 'bg-[var(--color-sev-5)]' },
} as const

const handleRowSelect = (id: string) => {
  emit('select', id)
}

const handleRowKeydown = (event: KeyboardEvent, id: string) => {
  const target = event.target
  if (target instanceof HTMLElement) {
    const isInteractive = target.closest('a, button, input, select, textarea')
    if (isInteractive) return
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('select', id)
  }
}
</script>

<template>
  <div :aria-busy="isLoading">
    <div
      v-if="isLoading"
      class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-10 text-center"
      aria-live="polite"
      role="status"
    >
      <p class="text-sm text-[var(--color-ink-2)]">Chargement des formulaires…</p>
    </div>

    <div
      v-else-if="error"
      class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-10 text-center"
      aria-live="polite"
    >
      <p class="text-sm text-destructive">{{ error }}</p>
    </div>

    <Empty
      v-else-if="isEmpty"
      class="border"
      aria-live="polite"
      role="status"
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 10h18" />
            <path d="M9 14h6" />
          </svg>
        </EmptyMedia>
        <EmptyTitle v-if="searchActive">Aucun résultat.</EmptyTitle>
        <EmptyTitle v-else>Aucun formulaire pour l'instant.</EmptyTitle>
        <EmptyDescription v-if="searchActive">
          Aucune soumission ne correspond à votre recherche. Essayez un autre prénom, identifiant ou motif.
        </EmptyDescription>
        <EmptyDescription v-else>
          Lorsque vos patients auront répondu à un questionnaire, leurs réponses apparaîtront ici.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>

    <!-- Mobile: card-stack -->
    <div v-else class="flex flex-col gap-2.5 md:hidden">
      <article
        v-for="form in forms"
        :key="form.id"
        role="link"
        tabindex="0"
        :aria-label="`Ouvrir le formulaire de ${form.patientFirstName || 'patient'}`"
        class="cursor-pointer rounded-[var(--r-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-line-2)] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
        @click="handleRowSelect(form.id)"
        @keydown="handleRowKeydown($event, form.id)"
      >
        <header class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2">
            <span
              v-if="form.aiPriority"
              aria-hidden="true"
              :class="['inline-block size-2 rounded-full', priorityConfig[form.aiPriority].dot]"
              :title="priorityConfig[form.aiPriority].label"
            ></span>
            <p class="text-[15px] font-medium text-[var(--color-ink)]">
              {{ form.patientFirstName || 'Patient' }}
              <span v-if="form.patientLastName" class="text-[var(--color-ink-2)]">{{ form.patientLastName }}</span>
            </p>
          </div>
          <RouterLink
            :to="`/dashboard/${form.id}`"
            class="text-[13px] font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 rounded"
            @click.stop
          >
            Voir
          </RouterLink>
        </header>
        <p
          v-if="form.consultationReason"
          class="mt-2 text-[13.5px] text-[var(--color-ink-2)]"
        >
          {{ form.consultationReason }}
        </p>
        <p class="mt-2 text-[12px] text-[var(--color-muted-strong)]">
          Soumis {{ formatDate(form.submittedAt) }}
        </p>
      </article>
    </div>

    <!-- Desktop: table -->
    <div
      v-if="!isLoading && !error && !isEmpty"
      class="hidden overflow-hidden rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] md:block"
    >
      <table class="min-w-full text-left text-sm">
        <caption class="sr-only">Liste des formulaires patients</caption>
        <thead class="border-b border-[var(--color-line)] bg-[var(--color-surface-2)]">
          <tr>
            <th scope="col" class="px-6 py-3 text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Patient
            </th>
            <th scope="col" class="px-6 py-3 text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Triage
            </th>
            <th scope="col" class="px-6 py-3 text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Date
            </th>
            <th scope="col" class="px-6 py-3 text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Motif
            </th>
            <th scope="col" class="px-6 py-3 text-right text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)]">
              Action
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--color-line)]">
          <tr
            v-for="form in forms"
            :key="form.id"
            role="link"
            tabindex="0"
            :aria-label="`Ouvrir le formulaire de ${form.patientFirstName || 'patient'}`"
            class="group cursor-pointer transition-colors hover:bg-[var(--color-surface-2)] focus-visible:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 focus-visible:ring-inset"
            @click="handleRowSelect(form.id)"
            @keydown="handleRowKeydown($event, form.id)"
          >
            <td class="px-6 py-4 text-[var(--color-ink)]">
              <span class="flex items-center gap-2">
                <span
                  v-if="form.aiPriority"
                  aria-hidden="true"
                  :class="['inline-block size-2 rounded-full', priorityConfig[form.aiPriority].dot]"
                  :title="priorityConfig[form.aiPriority].label"
                ></span>
                <span class="font-medium">{{ form.patientFirstName || 'Patient' }}</span>
                <span v-if="form.patientLastName" class="text-[var(--color-ink-2)]">
                  {{ form.patientLastName }}
                </span>
              </span>
            </td>
            <td class="px-6 py-4">
              <span
                v-if="form.triageLevel"
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
                :class="{
                  'bg-red-100 text-red-700': form.triageLevel === 'rouge',
                  'bg-orange-100 text-orange-700': form.triageLevel === 'orange',
                  'bg-yellow-100 text-yellow-700': form.triageLevel === 'jaune',
                  'bg-emerald-100 text-emerald-700': form.triageLevel === 'vert',
                }"
              >
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="{
                    'bg-red-500': form.triageLevel === 'rouge',
                    'bg-orange-500': form.triageLevel === 'orange',
                    'bg-yellow-500': form.triageLevel === 'jaune',
                    'bg-emerald-500': form.triageLevel === 'vert',
                  }"
                  aria-hidden="true"
                />
                {{ form.triageLevel.charAt(0).toUpperCase() + form.triageLevel.slice(1) }}
              </span>
              <span v-else class="text-[11.5px] text-[var(--color-muted-strong)]">—</span>
            </td>
            <td class="px-6 py-4 text-[var(--color-ink-2)]">{{ formatDate(form.submittedAt) }}</td>
            <td class="px-6 py-4 text-[var(--color-ink-2)]">{{ form.consultationReason || '—' }}</td>
            <td class="px-6 py-4 text-right">
              <RouterLink
                :to="`/dashboard/${form.id}`"
                class="inline-flex items-center rounded-[var(--r-sm)] px-2 py-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
                @click.stop
              >
                Voir
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
