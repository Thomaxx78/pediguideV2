<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import IconsUtil from '@/components/utils/IconsUtil.vue'
import api, { isAuthenticated } from '@/services/api'

const route = useRoute()
const router = useRouter()
const isDoctorAuthenticated = ref(false)

const resolveDoctorAuth = async () => {
  if (!isAuthenticated()) {
    isDoctorAuthenticated.value = false
    return
  }

  try {
    await api.doctors.getMe()
    isDoctorAuthenticated.value = true
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : ''
    const isAuthError = message.includes('401') || message.includes('403')
    if (isAuthError) {
      api.auth.logout()
    }
    isDoctorAuthenticated.value = false
  }
}

const handleLogout = () => {
  api.auth.logout()
  isDoctorAuthenticated.value = false
  router.push('/login')
}

onMounted(() => {
  void resolveDoctorAuth()
})

watch(
  () => route.fullPath,
  () => {
    void resolveDoctorAuth()
  },
)
</script>

<template>
  <Sheet>
    <SheetTrigger as-child v-bind="$attrs">
      <button
        type="button"
        aria-label="Ouvrir le menu de navigation"
        class="group flex items-center justify-center rounded-md p-1 leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <IconsUtil
          icon="burger"
          widthClass="w-7"
          heightClass="h-7"
          colorClass="text-foreground group-hover:text-primary group-focus-visible:text-primary transition-colors"
        />
      </button>
    </SheetTrigger>
    <SheetContent>
      <nav class="flex flex-col gap-4 mt-6 p-2">
        <RouterLink
          to="/"
          class="rounded-md px-4 py-3 text-lg font-medium transition-colors hover:underline focus-visible:bg-muted focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Accueil
        </RouterLink>

        <RouterLink
          to="/diagnosis"
          class="rounded-md px-4 py-3 text-lg font-medium transition-colors hover:underline focus-visible:bg-muted focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Diagnostic
        </RouterLink>

        <template v-if="isDoctorAuthenticated">
          <RouterLink
            to="/dashboard"
            class="rounded-md px-4 py-3 text-lg font-medium transition-colors hover:underline focus-visible:bg-muted focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Dashboard
          </RouterLink>

          <RouterLink
            to="/profile"
            class="rounded-md px-4 py-3 text-lg font-medium transition-colors hover:underline focus-visible:bg-muted focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Profil
          </RouterLink>
          <button
            type="button"
            class="rounded-md px-4 py-3 text-lg font-medium transition-colors hover:underline focus-visible:bg-muted focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background text-left"
            @click="handleLogout"
          >
            Deconnexion
          </button>
        </template>

        <RouterLink
          v-else
          to="/login"
          class="group/login flex items-center gap-1 rounded-md px-4 py-3 text-lg font-medium transition-colors hover:underline focus-visible:bg-muted focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <IconsUtil
            icon="user-circle"
            widthClass="w-6"
            heightClass="h-6"
            colorClass="text-foreground group-focus-visible/login:text-primary transition-colors"
          />
          Vous etes medecin ?
        </RouterLink>
      </nav>
    </SheetContent>
  </Sheet>
</template>
