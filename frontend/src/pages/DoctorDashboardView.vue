<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
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
  return `${count} formulaire${count > 1 ? 's' : ''} affiché${count > 1 ? 's' : ''}.`
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
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 py-10">
    <header class="space-y-2">
      <h1 id="doctor-dashboard-title" class="text-3xl font-semibold tracking-tight text-foreground">
        Tableau de bord médecin
      </h1>
      <p class="text-muted-foreground">
        Retrouvez les formulaires transmis par vos patients.
      </p>
    </header>

    <section aria-labelledby="doctor-dashboard-section-title">
      <Card>
        <CardHeader class="space-y-3">
          <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle id="doctor-dashboard-section-title" as="h2" class="text-xl">
                Formulaires reçus
              </CardTitle>
              <CardDescription>
                Cliquez sur une ligne pour consulter le résumé.
              </CardDescription>
            </div>
            <CreateSessionModal @created="loadForms" />
          </div>

          <Field class="max-w-md">
            <FieldLabel for="doctor-search">Recherche</FieldLabel>
            <Input
              id="doctor-search"
              v-model="search"
              name="search"
              type="search"
              autocomplete="off"
              placeholder="Prénom, nom, identifiant ou motif"
            />
            <p class="text-xs text-muted-foreground" aria-live="polite">
              {{ resultsLabel }}
            </p>
          </Field>
        </CardHeader>
        <CardContent>
          <DoctorFormsTable
            :forms="forms"
            :is-loading="isLoading"
            :error="error"
            @select="handleSelect"
          />
        </CardContent>
      </Card>
    </section>
  </div>
</template>
