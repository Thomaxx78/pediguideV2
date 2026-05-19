<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
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
  <NavigationMenu>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuLink as-child>
          <RouterLink to="/">Accueil</RouterLink>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink as-child>
          <RouterLink to="/diagnosis">Diagnostic</RouterLink>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <template v-if="isDoctorAuthenticated">
        <NavigationMenuItem>
          <NavigationMenuLink as-child>
            <RouterLink to="/dashboard">Tableau de bord</RouterLink>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink as-child>
            <RouterLink to="/profile">Profil</RouterLink>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink as-child>
            <button
              type="button"
              class="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              @click="handleLogout"
            >
              Déconnexion
            </button>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </template>
      <NavigationMenuItem v-else>
        <NavigationMenuLink as-child>
          <RouterLink to="/login" class="flex-row gap-2 items-center">
            <IconsUtil
              icon="user-circle"
              widthClass="w-6"
              heightClass="h-6"
              colorClass="text-foreground transition-colors"
            />
            Vous êtes médecin ?
          </RouterLink>
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>
