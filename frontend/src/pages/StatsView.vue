<script setup lang="ts">
import { useRouter } from 'vue-router'
import DashboardStats from '@/components/doctor/DashboardStats.vue'

const router = useRouter()
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:py-12">
    <header class="flex items-center gap-4">
      <button
        class="inline-flex items-center gap-1.5 rounded-[var(--r-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink-2)] transition-colors hover:bg-[var(--color-surface-2)]"
        @click="router.push('/dashboard')"
      >
        ← Retour
      </button>
      <div>
        <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">Tableau de bord</p>
        <h1 class="font-display text-3xl font-medium tracking-[-0.02em] text-[var(--color-ink)]">Statistiques</h1>
      </div>
    </header>
    <DashboardStats />
  </div>
</template>
