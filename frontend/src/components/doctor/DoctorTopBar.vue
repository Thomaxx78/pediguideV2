<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Brand } from '@/components/ui/brand'
import { Button } from '@/components/ui/button'
import api, { isAuthenticated } from '@/services/api'

const route = useRoute()
const router = useRouter()

const isDoctorAuthenticated = ref(false)
const doctorEmail = ref('')
const doctorFirstName = ref('')
const doctorLastName = ref('')
const isSheetOpen = ref(false)

const resolveDoctorAuth = async () => {
  if (!isAuthenticated()) {
    isDoctorAuthenticated.value = false
    doctorEmail.value = ''
    return
  }
  try {
    const response = await api.doctors.getMe() as { success: boolean, doctor?: { email?: string; firstName?: string; lastName?: string } }
    if (response.success && response.doctor) {
      isDoctorAuthenticated.value = true
      doctorEmail.value = response.doctor.email ?? ''
      doctorFirstName.value = response.doctor.firstName ?? ''
      doctorLastName.value = response.doctor.lastName ?? ''
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : ''
    const isAuthError = message.includes('401') || message.includes('403')
    if (isAuthError) api.auth.logout()
    isDoctorAuthenticated.value = false
    doctorEmail.value = ''
    doctorFirstName.value = ''
    doctorLastName.value = ''
  }
}

const handleLogout = () => {
  api.auth.logout()
  isDoctorAuthenticated.value = false
  doctorEmail.value = ''
  isSheetOpen.value = false
  router.push('/login')
}

const doctorDisplayName = computed(() => {
  const parts = [doctorFirstName.value, doctorLastName.value].filter(Boolean)
  return parts.length ? `Dr ${parts.join(' ')}` : doctorEmail.value || 'Professionnel de santé'
})

const doctorInitial = computed(() => {
  if (doctorFirstName.value) return doctorFirstName.value.charAt(0).toUpperCase()
  if (doctorEmail.value) return doctorEmail.value.charAt(0).toUpperCase()
  return 'D'
})

// Nav items shown when authenticated
const doctorNavItems = [
  { to: '/dashboard', label: 'Boîte de réception' },
  { to: '/dashboard/patients', label: 'Dossiers patients' },
  { to: '/dashboard/formulaires', label: 'Mes formulaires' },
  { to: '/profile', label: 'Profil' },
] as const

const isLinkActive = (target: string): boolean => {
  const path = route.path
  if (target === '/dashboard') {
    // active only on /dashboard or /dashboard/:id (NOT on /dashboard/patients or /dashboard/formulaires)
    if (path.startsWith('/dashboard/patients') || path.startsWith('/dashboard/formulaires')) return false
    return path === '/dashboard' || /^\/dashboard\/[^/]+$/.test(path)
  }
  if (target === '/dashboard/patients') {
    return path.startsWith('/dashboard/patients')
  }
  if (target === '/dashboard/formulaires') {
    return path.startsWith('/dashboard/formulaires')
  }
  return path.startsWith(target)
}

onMounted(() => { void resolveDoctorAuth() })

watch(() => route.fullPath, () => { void resolveDoctorAuth() })
</script>

<template>
  <header
    class="sticky top-0 z-10 flex h-[60px] items-center justify-between gap-3 border-b border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_70%,var(--color-bg))] px-4 backdrop-blur-md md:px-6"
  >
    <!-- LEFT — brand + nav -->
    <div class="flex items-center gap-4 md:gap-5">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
      >
        <Brand />
        <span
          class="hidden rounded-[4px] bg-[var(--color-primary-soft)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary sm:inline"
        >
          Pro
        </span>
      </RouterLink>

      <!-- Desktop nav (only when authenticated) -->
      <nav
        v-if="isDoctorAuthenticated"
        aria-label="Navigation principale"
        class="ml-1 hidden items-center gap-1 md:flex"
      >
        <RouterLink
          v-for="item in doctorNavItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'rounded-[var(--r-sm)] px-2.5 py-1.5 text-[14px] font-medium whitespace-nowrap transition-colors',
            isLinkActive(item.to)
              ? 'bg-[var(--color-surface-2)] text-[var(--color-ink)]'
              : 'text-[var(--color-ink-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]',
          ]"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>

    <!-- RIGHT — auth status -->
    <div class="flex items-center gap-2">
      <!-- Authenticated: avatar chip with logout -->
      <template v-if="isDoctorAuthenticated">
        <!-- Avatar chip (desktop) -->
        <button
          type="button"
          aria-label="Déconnexion"
          class="hidden items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] py-[3px] pl-[3px] pr-3 text-[13px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 md:inline-flex"
          @click="handleLogout"
        >
          <span
            aria-hidden="true"
            class="inline-flex size-[26px] items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground"
          >{{ doctorInitial }}</span>
          <span class="max-w-[160px] truncate text-[var(--color-ink-2)]">{{ doctorDisplayName }}</span>
          <span aria-hidden="true" class="text-[var(--color-muted-strong)]">↪</span>
        </button>

        <!-- Mobile menu trigger -->
        <Sheet v-model:open="isSheetOpen">
          <SheetTrigger as-child>
            <button
              type="button"
              aria-label="Ouvrir le menu"
              class="inline-flex size-9 items-center justify-center rounded-[var(--r-sm)] text-[var(--color-ink-2)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 md:hidden"
            >
              <svg viewBox="0 0 16 16" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
              </svg>
            </button>
          </SheetTrigger>
          <SheetContent>
            <nav class="mt-6 flex flex-col gap-1">
              <RouterLink
                v-for="item in doctorNavItems"
                :key="item.to"
                :to="item.to"
                :class="[
                  'rounded-[var(--r-sm)] px-3 py-3 text-[15px] font-medium transition-colors',
                  isLinkActive(item.to)
                    ? 'bg-[var(--color-surface-2)] text-[var(--color-ink)]'
                    : 'text-[var(--color-ink-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]',
                ]"
                @click="isSheetOpen = false"
              >
                {{ item.label }}
              </RouterLink>
              <button
                type="button"
                class="mt-4 rounded-[var(--r-sm)] px-3 py-3 text-left text-[15px] font-medium text-[var(--color-ink-2)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-destructive"
                @click="handleLogout"
              >
                Se déconnecter
              </button>
              <p class="mt-2 px-3 text-[12px] text-[var(--color-muted-strong)]">
                Connecté·e en tant que {{ doctorDisplayName }}
              </p>
            </nav>
          </SheetContent>
        </Sheet>
      </template>

      <!-- Unauthenticated: login + register CTAs -->
      <template v-else>
        <Button variant="ghost" size="sm" as-child>
          <RouterLink to="/login">Se connecter</RouterLink>
        </Button>
        <Button size="sm" as-child class="hidden sm:inline-flex">
          <RouterLink to="/register">Demander un accès</RouterLink>
        </Button>
      </template>
    </div>
  </header>
</template>
