<script setup lang="ts">
// Layout used for authenticated doctor pages (Dashboard, Detail, Templates,
// Builder, Profile) and the token-based patient form (/form/:token).
// Marketing/legal/404 use the `marketing` layout instead.
// Parent flow (Landing, Diagnosis, Results) uses the `parent` layout.
import DoctorTopBar from '@/components/doctor/DoctorTopBar.vue'
</script>

<template>
  <a href="#main-content" class="skip-link">Aller au contenu</a>
  <div class="flex min-h-screen flex-col bg-[var(--color-bg)]">
    <DoctorTopBar />
    <main
      id="main-content"
      class="flex-1 outline-none focus-visible:outline-2 focus-visible:outline-ring"
      tabindex="-1"
    >
      <slot />
    </main>
  </div>
</template>
