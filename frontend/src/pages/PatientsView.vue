<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Input } from '@/components/ui/input'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import api from '@/services/api'

const router = useRouter()

interface ChildSummary {
  id: string
  firstName: string
  lastName: string
  birthDate: string
  nir: string
  createdAt: string
  consultationCount: number
  lastConsultationAt: string | null
}

const children = ref<ChildSummary[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const search = ref('')

const filtered = computed(() => {
  const q = search.value.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '')
  if (!q) return children.value
  return children.value.filter((c) => {
    const full = `${c.firstName} ${c.lastName}`.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '')
    return full.includes(q) || c.nir.includes(q)
  })
})

const formatDate = (date: string | null) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const getAge = (birthDate: string) => {
  const birth = new Date(birthDate)
  const now = new Date()
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
  if (months < 24) return `${months} mois`
  return `${Math.floor(months / 12)} ans`
}

const resultsLabel = computed(() => {
  if (isLoading.value) return 'Chargement des dossiers.'
  if (error.value) return 'Erreur de chargement.'
  const count = filtered.value.length
  if (count === 0) return search.value ? 'Aucun résultat.' : 'Aucun dossier patient pour l\'instant.'
  return `${count} dossier${count > 1 ? 's' : ''}`
})

const searchActive = computed(() => Boolean(search.value.trim()))

onMounted(async () => {
  try {
    children.value = await api.children.list<ChildSummary[]>()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Impossible de charger les dossiers.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:py-12">
    <!-- Page header -->
    <header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div class="space-y-2">
        <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
          Dossiers
        </p>
        <h1 class="font-display text-3xl font-medium tracking-[-0.02em] text-[var(--color-ink)]">
          Patients
        </h1>
        <p class="text-sm text-[var(--color-ink-2)]" aria-live="polite">
          {{ resultsLabel }}
        </p>
      </div>
    </header>

    <!-- Search -->
    <div class="w-full md:max-w-md">
      <label for="patients-search" class="sr-only">Rechercher un dossier</label>
      <Input
        id="patients-search"
        v-model="search"
        name="search"
        type="search"
        size="md"
        autocomplete="off"
        placeholder="Prénom, nom ou numéro de sécurité sociale…"
      />
    </div>

    <!-- Loading -->
    <div
      v-if="isLoading"
      class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-10 text-center text-sm text-[var(--color-ink-2)]"
      aria-live="polite"
    >
      Chargement…
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-10 text-center text-sm text-destructive"
      role="alert"
    >
      {{ error }}
    </div>

    <!-- Empty state -->
    <Empty v-else-if="filtered.length === 0" class="border" aria-live="polite" role="status">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
            <path d="M3 21v-1a7 7 0 0 1 14 0v1" />
            <circle cx="19" cy="9" r="3" />
            <path d="M22 21v-1a5 5 0 0 0-5-5" />
          </svg>
        </EmptyMedia>
        <EmptyTitle v-if="searchActive">Aucun résultat.</EmptyTitle>
        <EmptyTitle v-else>Aucun dossier patient pour l'instant.</EmptyTitle>
        <EmptyDescription v-if="searchActive">
          Aucun dossier ne correspond à votre recherche.
        </EmptyDescription>
        <EmptyDescription v-else>
          Les dossiers sont créés automatiquement quand un parent renseigne le numéro
          de sécurité sociale de son enfant.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>

    <!-- Card list -->
    <div v-else class="flex flex-col gap-2.5">
      <article
        v-for="child in filtered"
        :key="child.id"
        role="link"
        tabindex="0"
        :aria-label="`Ouvrir le dossier de ${child.firstName} ${child.lastName}`"
        class="cursor-pointer rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-line-2)] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
        @click="router.push(`/dashboard/patients/${child.id}`)"
        @keydown.enter.prevent="router.push(`/dashboard/patients/${child.id}`)"
        @keydown.space.prevent="router.push(`/dashboard/patients/${child.id}`)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 space-y-1">
            <p class="font-display text-[17px] font-medium tracking-[-0.012em] text-[var(--color-ink)]">
              {{ child.firstName }} {{ child.lastName }}
            </p>
            <p class="text-[13.5px] text-[var(--color-ink-2)]">
              {{ getAge(child.birthDate) }} · Né(e) le {{ formatDate(child.birthDate) }}
            </p>
            <p class="text-[12px] font-mono text-[var(--color-muted-strong)]">
              N° SS · {{ child.nir }}
            </p>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-1.5">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-[12px] font-medium text-primary">
              {{ child.consultationCount }} consultation{{ child.consultationCount > 1 ? 's' : '' }}
            </span>
            <span class="text-[11.5px] text-[var(--color-muted-strong)]">
              Dernière · {{ formatDate(child.lastConsultationAt) }}
            </span>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
