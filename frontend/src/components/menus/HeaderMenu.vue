<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Logo from '@/assets/logo.svg'
import DesktopNav from '@/components/navs/DesktopNav.vue'
import MobileNav from '@/components/navs/MobileNav.vue'
</script>

<template>
  <header
    class="max-w-7xl w-full mx-auto sticky top-4 z-40 flex justify-between items-center py-1 px-4 border border-border/70 rounded-lg bg-background/80 backdrop-blur-lg shadow-header"
  >
    <RouterLink
      to="/"
      class="flex items-center gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <img :src="Logo" class="w-8 h-8" alt="PediGuide, retour à l'accueil" />
      <span class="text-xl font-semibold">PediGuide</span>
    </RouterLink>

    <nav aria-label="Navigation principale" class="flex items-center gap-2">
      <DesktopNav class="hidden md:block" />
      <MobileNav class="block md:hidden" />
    </nav>
  </header>
</template>

<style scoped></style>
