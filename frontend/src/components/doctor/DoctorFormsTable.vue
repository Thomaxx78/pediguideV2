<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { DoctorFormSummary } from '@/services/doctorFormsApi'

const props = withDefaults(
  defineProps<{
    forms: DoctorFormSummary[]
    isLoading?: boolean
    error?: string | null
  }>(),
  {
    isLoading: false,
    error: null,
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
  <div class="rounded-2xl border border-border/70 bg-background shadow-sm" :aria-busy="isLoading">
    <div v-if="isLoading" class="px-6 py-10 text-center" aria-live="polite" role="status">
      <p class="text-sm text-muted-foreground">Chargement des formulaires...</p>
    </div>

    <div v-else-if="error" class="px-6 py-10 text-center" aria-live="polite">
      <p class="text-sm text-destructive">{{ error }}</p>
    </div>

    <div v-else-if="isEmpty" class="px-6 py-10 text-center" aria-live="polite" role="status">
      <p class="text-sm text-muted-foreground">
        Aucun formulaire ne correspond à votre recherche.
      </p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <caption class="sr-only">Liste des formulaires patients</caption>
        <thead class="border-b border-border/70 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" class="px-6 py-3">Patient</th>
            <th scope="col" class="px-6 py-3">Date</th>
            <th scope="col" class="px-6 py-3">Motif</th>
            <th scope="col" class="px-6 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/70">
          <tr
            v-for="form in forms"
            :key="form.id"
            role="link"
            tabindex="0"
            :aria-label="`Ouvrir le formulaire de ${form.patientFirstName || 'patient'}`"
            class="group cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            @click="handleRowSelect(form.id)"
            @keydown="handleRowKeydown($event, form.id)"
          >
            <td class="px-6 py-4 font-medium text-foreground">
              {{ form.patientFirstName || 'Patient' }}
              {{ form.patientLastName || 'Patient' }}
            </td>
            <td class="px-6 py-4 text-muted-foreground">{{ formatDate(form.submittedAt) }}</td>
            <td class="px-6 py-4 text-muted-foreground">{{ form.consultationReason }}</td>
            <td class="px-6 py-4 text-right">
              <RouterLink
                :to="`/dashboard/${form.id}`"
                class="inline-flex items-center rounded-md px-3 py-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
