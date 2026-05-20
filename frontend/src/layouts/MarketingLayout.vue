<script setup lang="ts">
// Layout for public marketing + legal pages.
// Uses the marketing-specific nav and footer rather than the doctor HeaderMenu.
import MarketingNav from '@/components/marketing/MarketingNav.vue'
import MarketingFooter from '@/components/marketing/MarketingFooter.vue'
</script>

<template>
  <a href="#main-content" class="skip-link">Aller au contenu</a>
  <MarketingNav />
  <main
    id="main-content"
    class="outline-none focus-visible:outline-2 focus-visible:outline-ring"
    tabindex="-1"
  >
    <slot />
  </main>
  <MarketingFooter />
</template>
