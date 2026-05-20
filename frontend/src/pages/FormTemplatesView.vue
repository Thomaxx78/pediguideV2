<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import TemplateCard from '@/components/doctor/TemplateCard.vue'
import { API_BASE_URL } from '@/services/api'

const router = useRouter()

interface Template {
  id: string
  title: string
  description: string | null
  questions: unknown[]
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

const templates = ref<Template[]>([])
const isLoading = ref(true)
const error = ref('')
const deletingId = ref<string | null>(null)

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}` })

const load = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE_URL}/templates`, { headers: authHeader() })
    if (!res.ok) {
      throw new Error(res.status === 401 || res.status === 403
        ? 'Session expirée — reconnectez-vous.'
        : `Erreur serveur (${res.status})`)
    }
    const data = await res.json()
    templates.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = (err as Error).message || 'Impossible de charger les formulaires.'
    templates.value = []
  } finally {
    isLoading.value = false
  }
}

const goToEdit = (id: string) => router.push(`/dashboard/formulaires/${id}`)

const deleteTemplate = async (id: string) => {
  if (!confirm('Supprimer ce formulaire ? Les questionnaires déjà envoyés ne seront pas affectés.')) return
  deletingId.value = id
  try {
    await fetch(`${API_BASE_URL}/templates/${id}`, { method: 'DELETE', headers: authHeader() })
    templates.value = templates.value.filter((t) => t.id !== id)
  } finally {
    deletingId.value = null
  }
}

const isEmpty = computed(() => !isLoading.value && !error.value && templates.value.length === 0)

onMounted(load)
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:py-12">
    <!-- Header -->
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div class="space-y-2">
        <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
          Vos questionnaires
        </p>
        <h1 class="font-display text-3xl font-medium tracking-[-0.02em] text-[var(--color-ink)]">
          Modèles
        </h1>
        <p class="text-sm text-[var(--color-ink-2)]">
          Créez et personnalisez vos questionnaires pré-consultation.
        </p>
      </div>
      <div v-if="!isEmpty" class="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="md"
          @click="router.push('/dashboard/formulaires/nouveau?from=default')"
        >
          Partir du modèle par défaut
        </Button>
        <Button size="md" @click="router.push('/dashboard/formulaires/nouveau')">
          Nouveau formulaire
        </Button>
      </div>
    </header>

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
    <Empty v-else-if="isEmpty" class="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="5" y="3" width="14" height="18" rx="2" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="13" y2="16" />
          </svg>
        </EmptyMedia>
        <EmptyTitle>Aucun formulaire pour l'instant.</EmptyTitle>
        <EmptyDescription>
          Créez un questionnaire personnalisé, ou démarrez depuis le modèle Pediguide par défaut.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div class="flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button
            variant="secondary"
            size="md"
            @click="router.push('/dashboard/formulaires/nouveau?from=default')"
          >
            Partir du modèle par défaut
          </Button>
          <Button size="md" @click="router.push('/dashboard/formulaires/nouveau')">
            Créer un formulaire
          </Button>
        </div>
      </EmptyContent>
    </Empty>

    <!-- Card grid -->
    <div
      v-else
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <TemplateCard
        v-for="t in templates"
        :key="t.id"
        :template="t"
        @edit="goToEdit"
        @delete="deleteTemplate"
      />
    </div>
  </div>
</template>
