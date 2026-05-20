<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import KycStatusBadge from '@/components/doctor/KycStatusBadge.vue'
import KycSteps from '@/components/doctor/KycSteps.vue'
import api from '@/services/api'

interface Props {
  kycStatus?: 'verified' | 'rejected' | 'pending'
}

const props = withDefaults(defineProps<Props>(), {
  kycStatus: 'pending',
})

const isLoading = ref(false)
const error = ref<string | null>(null)

const description = computed(() => {
  switch (props.kycStatus) {
    case 'verified':
      return "Votre identité a bien été vérifiée. Vous avez accès à l'ensemble des fonctionnalités."
    case 'rejected':
      return "Votre numéro RPPS n'a pas été retrouvé à l'Annuaire santé. Mettez-le à jour ou contactez le support."
    case 'pending':
    default:
      return "Nous vérifions votre inscription à l'Annuaire santé. Cela prend généralement moins de 48 h ouvrées."
  }
})

const ctaLabel = computed(() => {
  if (props.kycStatus === 'rejected') return 'Réessayer la vérification'
  return 'Vérifier mon identité'
})

const showCta = computed(() => props.kycStatus !== 'verified')

async function startVerification() {
  try {
    isLoading.value = true
    error.value = null

    const data = await api.kyc.start() as { redirect_url?: string; url?: string }

    if (data.redirect_url || data.url) {
      window.location.href = (data.redirect_url || data.url) as string
    } else {
      throw new Error("Aucune URL de redirection reçue")
    }
  } catch (err: unknown) {
    const errorObj = err as Error
    console.error('Error starting KYC verification:', errorObj)
    error.value = errorObj.message || 'Une erreur est survenue lors du démarrage de la vérification.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="font-display text-xl font-medium tracking-[-0.014em] text-[var(--color-ink)]">
          Vérification d'identité
        </h2>
        <p class="mt-1 max-w-[420px] text-sm text-[var(--color-ink-2)]">
          {{ description }}
        </p>
      </div>
      <KycStatusBadge :state="kycStatus" />
    </header>

    <div class="mt-5">
      <KycSteps :state="kycStatus" />
    </div>

    <div v-if="showCta" class="mt-5 flex flex-wrap items-center gap-3">
      <Button
        size="md"
        :disabled="isLoading"
        :variant="kycStatus === 'rejected' ? 'secondary' : 'default'"
        @click="startVerification"
      >
        {{ isLoading ? 'Chargement…' : ctaLabel }}
      </Button>
      <p class="text-xs text-[var(--color-muted-strong)]">
        Vous serez redirigé·e vers notre partenaire Didit.
      </p>
    </div>

    <p v-if="error" class="mt-3 text-sm text-destructive" role="alert">
      {{ error }}
    </p>
  </section>
</template>
