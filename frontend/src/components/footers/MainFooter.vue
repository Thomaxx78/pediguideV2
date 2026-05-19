<script setup lang="ts">
import { RouterLink } from 'vue-router'

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="flex justify-center mt-12 p-6 border-t border-border/70 bg-background/80">
    <p class="text-xs text-muted-foreground">
      PediGuide© @ {{ currentYear }}. Tous droits réservés.
      <span aria-hidden="true"> • </span>
      <RouterLink
        class="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
        to="/mentions-legales"
      >
        Mentions légales
      </RouterLink>
      <span aria-hidden="true"> • </span>
      <RouterLink
        class="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
        to="/confidentialite"
      >
        Politique de confidentialité
      </RouterLink>
    </p>
  </footer>
</template>
