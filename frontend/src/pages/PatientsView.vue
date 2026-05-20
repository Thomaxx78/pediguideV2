<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
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
  return children.value.filter(c => {
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
  <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
    <header class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Dossiers patients</h1>
        <p class="mt-1 text-sm text-muted-foreground">Historique des consultations par enfant</p>
      </div>
    </header>

    <div class="mb-4">
      <input
        v-model="search"
        type="text"
        placeholder="Rechercher par nom ou numéro de sécurité sociale..."
        class="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>

    <section v-if="isLoading" class="rounded-2xl border border-border/70 p-8 text-center text-sm text-muted-foreground">
      Chargement des dossiers...
    </section>

    <section v-else-if="error" class="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
      {{ error }}
    </section>

    <section v-else-if="filtered.length === 0" class="rounded-2xl border border-border/70 p-8 text-center text-sm text-muted-foreground">
      {{ search ? 'Aucun dossier ne correspond à votre recherche.' : 'Aucun dossier patient pour l\'instant. Les dossiers sont créés automatiquement quand un parent fournit le numéro de sécurité sociale de son enfant.' }}
    </section>

    <div v-else class="space-y-3">
      <button
        v-for="child in filtered"
        :key="child.id"
        class="w-full rounded-2xl border border-border/70 bg-background p-5 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
        @click="router.push(`/dashboard/patients/${child.id}`)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <p class="font-medium text-foreground">{{ child.firstName }} {{ child.lastName }}</p>
            <p class="text-sm text-muted-foreground">{{ getAge(child.birthDate) }} · Né(e) le {{ formatDate(child.birthDate) }}</p>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-1">
            <span class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {{ child.consultationCount }} consultation{{ child.consultationCount > 1 ? 's' : '' }}
            </span>
            <span class="text-xs text-muted-foreground">
              Dernière : {{ formatDate(child.lastConsultationAt) }}
            </span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
