<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ViewportShell } from '@/components/ui/viewport-shell'
import { Brand } from '@/components/ui/brand'
import { Button } from '@/components/ui/button'
import { API_BASE_URL } from '@/services/api'

const route = useRoute()
const router = useRouter()

const token = computed(() => route.params.token as string | undefined)
const hasCustomTemplate = ref(false)
const childFirstName = ref('')
const doctorFirstName = ref('')
const doctorLastName = ref('')
const appointmentAt = ref<string | null>(null)

const doctorDisplayName = computed(() => {
  const parts = [doctorFirstName.value, doctorLastName.value].filter(Boolean)
  return parts.length ? `Dr ${parts.join(' ')}` : null
})

const appointmentLabel = computed(() => {
  if (!appointmentAt.value) return null
  const d = new Date(appointmentAt.value)
  return d.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
})

onMounted(async () => {
  if (!token.value) return
  try {
    const res = await fetch(`${API_BASE_URL}/sessions/${token.value}`)
    if (res.ok) {
      const data = await res.json()
      hasCustomTemplate.value = Boolean(data.formTemplateId)
      childFirstName.value = data.patientFirstName ?? ''
      doctorFirstName.value = data.doctorFirstName ?? ''
      doctorLastName.value = data.doctorLastName ?? ''
      appointmentAt.value = data.appointmentAt ?? null
    }
  } catch {}
})

const startQuestionnaire = () => {
  if (!token.value) return
  if (hasCustomTemplate.value) {
    router.push(`/form/${token.value}`)
  } else {
    router.push({ name: 'diagnosis', query: { token: token.value } })
  }
}
</script>

<template>
  <ViewportShell>
    <!-- App bar -->
    <header class="flex items-center justify-between px-5 pt-6 pb-2">
      <Brand />
      <span class="text-xs font-medium text-[var(--color-muted-strong)] uppercase tracking-[0.08em]">
        Pré-consultation
      </span>
    </header>

    <!-- Greeting -->
    <section class="px-5 pt-6">
      <h1 class="font-display text-[30px] leading-[1.1] font-medium tracking-[-0.025em] text-[var(--color-ink)]">
        Bonjour, vous êtes les parents
        <span v-if="childFirstName" class="text-primary">de {{ childFirstName }}</span>
        <span v-else>de votre enfant</span>&nbsp;!
      </h1>
      <p class="mt-4 text-[15px] leading-relaxed text-[var(--color-ink-2)]">
        Nous allons vous poser quelques questions pour préparer la consultation.
        Cela prend environ <strong class="font-medium text-[var(--color-ink)]">3 minutes</strong> et
        vos réponses arrivent directement au professionnel de santé.
      </p>
    </section>

    <!-- Illustration placeholder (decorative, abstract) -->
    <section aria-hidden="true" class="px-5 mt-6">
      <div
        class="relative h-32 w-full overflow-hidden rounded-[var(--r-lg)] bg-[var(--color-primary-soft)]"
      >
        <svg
          class="absolute inset-0 h-full w-full"
          viewBox="0 0 400 128"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="pg-wave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="var(--color-primary-base)" stop-opacity="0.15" />
              <stop offset="100%" stop-color="var(--color-primary-base)" stop-opacity="0.05" />
            </linearGradient>
          </defs>
          <path d="M0,70 C80,40 160,90 240,60 C320,30 400,80 400,80 L400,128 L0,128 Z" fill="url(#pg-wave)" />
          <circle cx="320" cy="50" r="22" fill="var(--color-primary-base)" fill-opacity="0.18" />
          <circle cx="280" cy="60" r="10" fill="var(--color-primary-base)" fill-opacity="0.10" />
        </svg>
      </div>
    </section>

    <!-- Meta rows -->
    <section class="px-5 mt-7 space-y-4">
      <div class="flex items-start gap-3">
        <span class="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-2)]">
          <svg viewBox="0 0 20 20" class="size-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
            <circle cx="10" cy="10" r="7.5" />
            <path d="M10 6v4l2.5 1.5" />
          </svg>
        </span>
        <div>
          <p class="text-[15px] font-medium text-[var(--color-ink)]">Environ 3 minutes</p>
          <p class="text-sm text-[var(--color-ink-2)]">Vous pouvez vous interrompre et reprendre plus tard.</p>
        </div>
      </div>

      <div v-if="appointmentLabel" class="flex items-start gap-3">
        <span class="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-2)]">
          <svg viewBox="0 0 20 20" class="size-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 3v4M14 3v4M5 7h10v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7Z" />
            <path d="M10 11v2M9 12h2" />
          </svg>
        </span>
        <div>
          <p class="text-[15px] font-medium text-[var(--color-ink)]">
            <template v-if="doctorDisplayName">Pour {{ doctorDisplayName }}</template>
            <template v-else>Votre rendez-vous</template>
          </p>
          <p class="text-sm text-[var(--color-ink-2)]">{{ appointmentLabel }}</p>
        </div>
      </div>

      <div class="flex items-start gap-3">
        <span class="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-2)]">
          <svg viewBox="0 0 20 20" class="size-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="9" width="12" height="8" rx="2" />
            <path d="M7 9V6a3 3 0 0 1 6 0v3" />
          </svg>
        </span>
        <div>
          <p class="text-[15px] font-medium text-[var(--color-ink)]">Données confidentielles</p>
          <p class="text-sm text-[var(--color-ink-2)]">Hébergement HDS, transmises uniquement au professionnel de santé.</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="mt-auto px-5 pb-8 pt-8">
      <Button block type="button" @click="startQuestionnaire">
        Commencer le questionnaire
      </Button>
      <p class="mt-4 text-center text-xs text-[var(--color-muted-strong)]">
        En continuant, vous acceptez que vos réponses soient transmises au professionnel de santé.
      </p>
    </section>
  </ViewportShell>
</template>
