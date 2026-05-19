<script setup lang="ts">
import HeaderMenu from '@/components/menus/HeaderMenu.vue'
import MainFooter from '@/components/footers/MainFooter.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col px-5 md:px-20">
    <a href="#main-content" class="skip-link">Aller au contenu</a>
    <HeaderMenu />
    <main id="main-content" class="flex-1 outline-none focus-visible:outline-2 focus-visible:outline-ring" tabindex="-1">
      <slot />
    </main>
    <MainFooter />
  </div>
</template>
