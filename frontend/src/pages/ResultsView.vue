<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { API_BASE_URL } from '@/services/api'

const route = useRoute()
const isDownloading = ref(false)
const errorMessage = ref('')
const statusMessage = ref('')

const submissionId = computed(() => {
  const raw = route.params.id
  if (typeof raw === 'string') return raw.trim()
  if (Array.isArray(raw)) return String(raw[0] || '').trim()
  return ''
})

const hasValidId = computed(() => submissionId.value.length > 0)

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getFileNameFromDisposition = (headerValue: string | null) => {
  if (!headerValue) return ''
  const match = headerValue.match(/filename\*?=(?:UTF-8'')?\"?([^\";]+)\"?/i)
  if (!match) return ''
  const filename = match[1] ?? ''
  try {
    return decodeURIComponent(filename)
  } catch {
    return filename
  }
}

const downloadPdf = async () => {
  errorMessage.value = ''
  statusMessage.value = ''

  if (!hasValidId.value) {
    errorMessage.value = 'Identifiant de soumission manquant.'
    return
  }

  isDownloading.value = true
  statusMessage.value = 'Téléchargement du PDF en cours...'

  try {
    const response = await fetch(
      `${API_BASE_URL}/diagnosis/${encodeURIComponent(submissionId.value)}/pdf`
    )

    if (!response.ok) {
      throw new Error('Erreur lors de la génération du PDF.')
    }

    const blob = await response.blob()
    const objectUrl = window.URL.createObjectURL(blob)
    const fallbackName = `pediguide-compte-rendu-${formatDate(new Date())}.pdf`
    const fileName = getFileNameFromDisposition(response.headers.get('content-disposition')) || fallbackName

    const link = document.createElement('a')
    link.href = objectUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(objectUrl)

    statusMessage.value = 'Téléchargement terminé.'
  } catch (error) {
    console.error(error)
    statusMessage.value = ''
    errorMessage.value = 'Impossible de télécharger le PDF. Veuillez réessayer.'
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <div class="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <section class="space-y-6 rounded-2xl border border-border/70 bg-background p-6 shadow-sm">
        <header class="space-y-2">
          <h1 class="text-h3 font-semibold text-foreground">Compte rendu</h1>
          <p class="text-sm text-muted-foreground">
            Votre compte rendu est prêt. Vous pouvez le télécharger en PDF.
          </p>
        </header>

        <div class="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            :disabled="isDownloading || !hasValidId"
            :aria-busy="isDownloading"
            @click="downloadPdf"
          >
            {{ isDownloading ? 'Téléchargement...' : 'Télécharger en PDF' }}
          </Button>
          <p
            v-if="statusMessage"
            class="text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {{ statusMessage }}
          </p>
        </div>

        <p v-if="errorMessage" class="text-sm text-destructive" role="alert" aria-atomic="true">
          {{ errorMessage }}
        </p>
      </section>
    </div>
  </div>
</template>
