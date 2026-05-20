<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import KycVerification from '@/components/KycVerification.vue'
import api, { isAuthenticated } from '@/services/api'

const router = useRouter()

interface DoctorProfile {
  id: string
  email: string
  rpps: string
  kycStatus: 'verified' | 'rejected' | 'pending'
  accountStatus: string
  createdAt: string
}

const profile = ref<DoctorProfile | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const accountStatusLabel = computed(() => {
  if (!profile.value) return ''
  return profile.value.accountStatus === 'validated' ? 'Validé' : 'En attente de validation'
})

const memberSinceLabel = computed(() => {
  if (!profile.value?.createdAt) return '—'
  const date = new Date(profile.value.createdAt)
  if (Number.isNaN(date.getTime())) return profile.value.createdAt
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date)
})

const logout = () => {
  api.auth.logout()
  router.push('/login')
}

onMounted(async () => {
  if (!isAuthenticated()) {
    router.push('/login')
    return
  }

  try {
    isLoading.value = true
    const response = await api.doctors.getMe() as {
      success: boolean
      doctor?: DoctorProfile
    }

    if (response.success && response.doctor) {
      profile.value = {
        id: response.doctor.id,
        email: response.doctor.email,
        rpps: response.doctor.rpps,
        kycStatus: response.doctor.kycStatus || 'pending',
        accountStatus: response.doctor.accountStatus || 'pending_validation',
        createdAt: response.doctor.createdAt,
      }
    }
  } catch (err: unknown) {
    const errorObj = err as Error
    console.error('Error fetching profile:', errorObj)
    error.value = 'Impossible de charger le profil.'
    if (errorObj.message?.includes('401') || errorObj.message?.includes('403')) {
      api.auth.logout()
      router.push('/login')
    }
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:py-12">
    <!-- Page header -->
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div class="space-y-2">
        <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
          Compte
        </p>
        <h1 class="font-display text-3xl font-medium tracking-[-0.02em] text-[var(--color-ink)]">
          Votre profil
        </h1>
        <p class="text-sm text-[var(--color-ink-2)]">
          Gérez vos informations et le statut de votre vérification.
        </p>
      </div>
      <Button variant="secondary" size="sm" @click="logout">Se déconnecter</Button>
    </header>

    <div
      v-if="isLoading"
      class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-sm text-[var(--color-ink-2)]"
      aria-live="polite"
    >
      Chargement…
    </div>

    <div
      v-else-if="error"
      class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-8 text-sm text-destructive"
      role="alert"
    >
      {{ error }}
    </div>

    <!-- 2-col grid: main + sidebar -->
    <div v-else-if="profile" class="grid gap-6 lg:grid-cols-[1fr_320px]">
      <!-- Main column -->
      <div class="space-y-6">
        <!-- KYC card -->
        <KycVerification :kyc-status="profile.kycStatus" />

        <!-- Account info -->
        <section class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
          <header>
            <h2 class="font-display text-xl font-medium tracking-[-0.014em] text-[var(--color-ink)]">
              Informations du compte
            </h2>
            <p class="mt-1 text-sm text-[var(--color-ink-2)]">
              Ces informations ont été renseignées à l'inscription.
            </p>
          </header>

          <dl class="mt-5 grid divide-y divide-[var(--color-line)]">
            <div class="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[200px_1fr] sm:gap-4 sm:py-3.5">
              <dt class="text-[12.5px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)] sm:text-[13px] sm:normal-case sm:tracking-normal">
                Email professionnel
              </dt>
              <dd class="text-[14.5px] text-[var(--color-ink)]">{{ profile.email }}</dd>
            </div>
            <div class="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[200px_1fr] sm:gap-4 sm:py-3.5">
              <dt class="text-[12.5px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)] sm:text-[13px] sm:normal-case sm:tracking-normal">
                Numéro RPPS
              </dt>
              <dd class="font-mono text-[14.5px] text-[var(--color-ink)]">{{ profile.rpps }}</dd>
            </div>
            <div class="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[200px_1fr] sm:gap-4 sm:py-3.5">
              <dt class="text-[12.5px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)] sm:text-[13px] sm:normal-case sm:tracking-normal">
                Statut du compte
              </dt>
              <dd>
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-[12.5px] font-medium"
                  :class="
                    profile.accountStatus === 'validated'
                      ? 'bg-[color-mix(in_oklab,var(--color-sev-1)_12%,var(--color-bg))] text-[var(--color-sev-1)]'
                      : 'bg-[color-mix(in_oklab,var(--color-sev-3)_12%,var(--color-bg))] text-[var(--color-sev-3)]'
                  "
                >
                  {{ accountStatusLabel }}
                </span>
              </dd>
            </div>
            <div class="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[200px_1fr] sm:gap-4 sm:py-3.5">
              <dt class="text-[12.5px] font-medium uppercase tracking-wide text-[var(--color-muted-strong)] sm:text-[13px] sm:normal-case sm:tracking-normal">
                Membre depuis
              </dt>
              <dd class="text-[14.5px] text-[var(--color-ink)]">{{ memberSinceLabel }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <!-- Sidebar -->
      <aside class="space-y-5">
        <section class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h3 class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
            Besoin d'aide ?
          </h3>
          <ul class="mt-3 flex flex-col gap-2 text-[14px]">
            <li>
              <a
                href="mailto:support@pediguide.fr"
                class="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                <svg viewBox="0 0 16 16" class="size-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
                  <path d="M2 4.5l6 4.5 6-4.5" />
                </svg>
                support@pediguide.fr
              </a>
            </li>
            <li>
              <RouterLink
                to="/mentions-legales"
                class="text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
              >Mentions légales</RouterLink>
            </li>
            <li>
              <RouterLink
                to="/confidentialite"
                class="text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
              >Confidentialité</RouterLink>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </div>
</template>
