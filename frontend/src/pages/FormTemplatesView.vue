<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { API_BASE_URL } from '@/services/api'

const router = useRouter()

interface Template {
  id: string
  title: string
  description: string | null
  questions: unknown[]
  isActive: boolean
  createdAt: string
}

const templates = ref<Template[]>([])
const isLoading = ref(true)
const error = ref('')
const deletingId = ref<string | null>(null)

const authHeader = () => ({ 'Authorization': `Bearer ${localStorage.getItem('authToken')}` })

const load = async () => {
  isLoading.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/templates`, { headers: authHeader() })
    templates.value = await res.json()
  } catch {
    error.value = 'Impossible de charger les formulaires.'
  } finally {
    isLoading.value = false
  }
}

const deleteTemplate = async (id: string) => {
  if (!confirm('Supprimer ce formulaire ?')) return
  deletingId.value = id
  try {
    await fetch(`${API_BASE_URL}/templates/${id}`, { method: 'DELETE', headers: authHeader() })
    templates.value = templates.value.filter(t => t.id !== id)
  } finally {
    deletingId.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-6 py-10">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-3xl font-semibold tracking-tight text-foreground">Mes formulaires</h1>
        <p class="text-muted-foreground">Créez et personnalisez vos questionnaires pré-consultation.</p>
      </div>
      <Button @click="router.push('/dashboard/formulaires/nouveau')">Nouveau formulaire</Button>
    </header>

    <div v-if="isLoading" class="rounded-2xl border border-border/70 p-8 text-center">
      <p class="text-sm text-muted-foreground">Chargement...</p>
    </div>

    <div v-else-if="!templates.length" class="rounded-2xl border border-dashed border-border/70 p-10 text-center space-y-3">
      <p class="text-sm text-muted-foreground">Aucun formulaire créé pour l'instant.</p>
      <div class="flex justify-center gap-3">
        <Button variant="outline" @click="router.push('/dashboard/formulaires/nouveau?from=default')">
          Partir du modèle par défaut
        </Button>
        <Button @click="router.push('/dashboard/formulaires/nouveau')">
          Créer de zéro
        </Button>
      </div>
    </div>

    <div v-else class="grid gap-4">
      <Card v-for="t in templates" :key="t.id" class="transition-shadow hover:shadow-md">
        <CardHeader>
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="space-y-1">
              <CardTitle as="h2" class="text-lg">{{ t.title }}</CardTitle>
              <CardDescription v-if="t.description">{{ t.description }}</CardDescription>
              <p class="text-xs text-muted-foreground">{{ t.questions.length }} question{{ t.questions.length > 1 ? 's' : '' }}</p>
            </div>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" @click="router.push(`/dashboard/formulaires/${t.id}`)">Modifier</Button>
              <Button variant="outline" size="sm" class="text-destructive hover:text-destructive" :disabled="deletingId === t.id" @click="deleteTemplate(t.id)">Supprimer</Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  </div>
</template>
