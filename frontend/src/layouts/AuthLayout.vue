<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Brand } from '@/components/ui/brand'
</script>

<template>
  <a href="#main-content" class="skip-link">Aller au contenu</a>

  <!-- Top brand bar -->
  <header class="flex items-center justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-bg)] px-5 py-4 md:px-10">
    <RouterLink to="/" class="rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45">
      <Brand />
    </RouterLink>
    <span class="hidden text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)] sm:inline">
      Espace professionnel
    </span>
  </header>

  <!-- Page content (form card left, dark aside right) -->
  <main
    id="main-content"
    class="grid min-h-[calc(100vh-65px)] w-full lg:grid-cols-[1fr_minmax(320px,420px)]"
    tabindex="-1"
  >
    <slot />
  </main>
</template>
