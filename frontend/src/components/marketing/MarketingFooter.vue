<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="border-t border-[var(--color-line)] bg-[var(--color-bg)]">
    <div class="mx-auto flex w-full max-w-[1180px] flex-col items-start justify-between gap-3 px-5 py-6 text-[13px] text-[var(--color-muted-strong)] sm:flex-row sm:items-center md:px-10">
      <span>© {{ new Date().getFullYear() }} Pediguide · Tous droits réservés</span>
      <nav class="flex flex-wrap gap-x-5 gap-y-2">
        <RouterLink to="/mentions-legales" class="hover:text-[var(--color-ink)]">Mentions légales</RouterLink>
        <RouterLink to="/confidentialite" class="hover:text-[var(--color-ink)]">Confidentialité</RouterLink>
        <RouterLink to="/conditions-utilisation" class="hover:text-[var(--color-ink)]">CGU</RouterLink>
        <RouterLink to="/cookies" class="hover:text-[var(--color-ink)]">Cookies</RouterLink>
      </nav>
    </div>
  </footer>
</template>
