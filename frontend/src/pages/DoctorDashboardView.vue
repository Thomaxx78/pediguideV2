<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Input } from '@/components/ui/input'
import DoctorFormsTable from '@/components/doctor/DoctorFormsTable.vue'
import CreateSessionModal from '@/components/doctor/CreateSessionModal.vue'
import { doctorFormsApi, type DoctorFormSummary } from '@/services/doctorFormsApi'

const router = useRouter()

const search = ref('')
const debouncedSearch = ref('')
const forms = ref<DoctorFormSummary[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

let debounceTimer: number | undefined

const loadForms = async () => {
  isLoading.value = true
  error.value = null

  try {
    forms.value = await doctorFormsApi.list({ search: debouncedSearch.value })
  } catch (err: unknown) {
    const errorObj = err as Error
    error.value = errorObj.message || 'Impossible de charger les formulaires.'
  } finally {
    isLoading.value = false
  }
}

const handleSelect = (id: string) => {
  router.push(`/dashboard/${id}`)
}

const resultsLabel = computed(() => {
  if (isLoading.value) return 'Chargement des formulaires.'
  if (error.value) return 'Erreur de chargement.'
  const count = forms.value.length
  if (count === 0) return 'Aucun formulaire trouvé.'
  return `${count} formulaire${count > 1 ? 's' : ''} reçu${count > 1 ? 's' : ''}`
})

watch(search, (value) => {
  window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    debouncedSearch.value = value.trim()
  }, 300)
})

watch(debouncedSearch, () => {
  loadForms()
})

onMounted(() => {
  loadForms()
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:py-12">
    <!-- Page header -->
    <header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div class="space-y-2">
        <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
          Tableau de bord
        </p>
        <h1
          id="doctor-dashboard-title"
          class="font-display text-3xl font-medium tracking-[-0.02em] text-[var(--color-ink)]"
        >
          Boîte de réception
        </h1>
        <p class="text-sm text-[var(--color-ink-2)]" aria-live="polite">
          {{ resultsLabel }}
        </p>
      </div>
      <CreateSessionModal @created="loadForms" />
    </header>

    <!-- Nav -->
    <div class="flex gap-3">
      <button
        class="inline-flex items-center gap-2 rounded-[var(--r-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-2)]"
        @click="router.push('/dashboard/stats')"
      >
        Statistiques
      </button>
    </div>

    <!-- Search -->
    <div class="w-full md:max-w-md">
      <label for="doctor-search" class="sr-only">Rechercher un formulaire</label>
      <Input
        id="doctor-search"
        v-model="search"
        name="search"
        type="search"
        autocomplete="off"
        placeholder="Prénom, nom, identifiant ou motif…"
        size="md"
      />
    </div>

    <!-- Table -->
    <DoctorFormsTable
      :forms="forms"
      :is-loading="isLoading"
      :error="error"
      :search-active="Boolean(debouncedSearch)"
      @select="handleSelect"
    />
  </div>
</template>
