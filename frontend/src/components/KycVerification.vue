<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import api from '@/services/api'

interface Props {
  kycStatus?: 'verified' | 'rejected' | 'pending'
}

const props = withDefaults(defineProps<Props>(), {
  kycStatus: 'pending',
})

const emit = defineEmits<{
  statusChanged: [status: string]
}>()

const isLoading = ref(false)
const error = ref<string | null>(null)

const statusConfig = {
  verified: {
    text: 'Vérifié',
    class: 'bg-green-100 text-green-800 border-green-200',
    icon: '✓',
  },
  rejected: {
    text: 'Rejeté',
    class: 'bg-red-100 text-red-800 border-red-200',
    icon: '✗',
  },
  pending: {
    text: 'En attente',
    class: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '⏳',
  },
}

async function startVerification() {
  try {
    isLoading.value = true
    error.value = null

    // Call KYC start endpoint (uses authenticated user from JWT token)
    const data = await api.kyc.start() as { redirect_url?: string; url?: string }

    if (data.redirect_url || data.url) {
      // Redirect to Didit verification page
      window.location.href = (data.redirect_url || data.url) as string
    } else {
      throw new Error('No redirect URL received')
    }
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error('Error starting KYC verification:', errorObj)
    error.value = errorObj.message || 'Une erreur est survenue lors du démarrage de la vérification'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="kyc-verification space-y-4">
    <div class="flex items-center gap-3">
      <h3 class="text-lg font-semibold">Vérification d'identité</h3>
      <span
        :class="[
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium',
          statusConfig[kycStatus].class,
        ]"
      >
        <span>{{ statusConfig[kycStatus].icon }}</span>
        <span>{{ statusConfig[kycStatus].text }}</span>
      </span>
    </div>

    <div v-if="kycStatus === 'pending'" class="space-y-3">
      <p class="text-sm text-gray-600">
        Pour exercer sur la plateforme, vous devez vérifier votre identité via notre partenaire
        sécurisé Didit.
      </p>

      <Button
        @click="startVerification"
        :disabled="isLoading"
        class="w-full sm:w-auto"
      >
        {{ isLoading ? 'Chargement...' : 'Vérifier mon identité' }}
      </Button>

      <p v-if="error" class="text-sm text-red-600">
        {{ error }}
      </p>
    </div>

    <div v-else-if="kycStatus === 'verified'" class="space-y-2">
      <p class="text-sm text-green-700">
        Votre identité a été vérifiée avec succès. Vous pouvez maintenant accéder à toutes les
        fonctionnalités de la plateforme.
      </p>
    </div>

    <div v-else-if="kycStatus === 'rejected'" class="space-y-2">
      <p class="text-sm text-red-700">
        La vérification de votre identité a été rejetée. Veuillez contacter le support pour plus
        d'informations.
      </p>
      <Button
        @click="startVerification"
        :disabled="isLoading"
        variant="outline"
        class="w-full sm:w-auto"
      >
        {{ isLoading ? 'Chargement...' : 'Réessayer la vérification' }}
      </Button>
    </div>
  </div>
</template>
