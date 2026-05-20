<script setup lang="ts">
// Minimal layout for the Pediguide parent flow.
// The phone-shaped ViewportShell handles its own background + framing.
</script>

<template>
  <a href="#main-content" class="skip-link">Aller au contenu</a>
  <main
    id="main-content"
    class="outline-none focus-visible:outline-2 focus-visible:outline-ring"
    tabindex="-1"
  >
    <slot />
  </main>
</template>
