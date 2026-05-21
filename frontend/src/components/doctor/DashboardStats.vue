<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import api from '@/services/api'

type Stats = Awaited<ReturnType<typeof api.stats.get>>

const stats = ref<Stats | null>(null)
const isLoading = ref(true)

onMounted(async () => {
  try {
    stats.value = await api.stats.get()
  } finally {
    isLoading.value = false
  }
})

const priorityItems = computed(() => {
  if (!stats.value) return []
  const dist = stats.value.priorityDistribution
  const total = Object.values(dist).reduce((a, b) => a + b, 0)
  return [
    { key: 'urgent', label: 'Urgent', color: 'bg-red-500', textColor: 'text-red-600', count: dist.urgent ?? 0 },
    { key: 'a_surveiller', label: 'À surveiller', color: 'bg-amber-400', textColor: 'text-amber-600', count: dist.a_surveiller ?? 0 },
    { key: 'non_urgent', label: 'Non urgent', color: 'bg-emerald-400', textColor: 'text-emerald-600', count: dist.non_urgent ?? 0 },
  ].map(item => ({
    ...item,
    pct: total > 0 ? Math.round((item.count / total) * 100) : 0,
  }))
})

const maxSymptomCount = computed(() => {
  return stats.value?.topSymptoms[0]?.count ?? 1
})

const formatTime = (minutes: number | null) => {
  if (minutes === null) return '—'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}
</script>

<template>
  <div v-if="isLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div
      v-for="i in 3"
      :key="i"
      class="h-28 animate-pulse rounded-[var(--r-lg)] bg-[var(--color-surface-2)]"
    />
  </div>

  <div v-else-if="stats" class="grid grid-cols-1 gap-4 sm:grid-cols-3">

    <!-- Taux de complétion -->
    <div class="flex flex-col gap-3 rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
        Taux de complétion
      </p>
      <div class="flex items-end gap-2">
        <span class="font-display text-3xl font-semibold text-[var(--color-ink)]">
          {{ stats.completionRate }}%
        </span>
        <span class="mb-0.5 text-sm text-[var(--color-ink-2)]">
          {{ stats.completedSessions }} / {{ stats.totalSessions }} envoyés
        </span>
      </div>
      <!-- Barre de progression -->
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div
          class="h-full rounded-full bg-[var(--color-primary,#0066CC)] transition-all duration-500"
          :style="{ width: `${stats.completionRate}%` }"
        />
      </div>
    </div>

    <!-- Temps moyen de complétion -->
    <div class="flex flex-col gap-3 rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
        Temps moyen de complétion
      </p>
      <div class="flex items-end gap-2">
        <span class="font-display text-3xl font-semibold text-[var(--color-ink)]">
          {{ formatTime(stats.avgCompletionMinutes) }}
        </span>
      </div>
      <p class="text-xs text-[var(--color-ink-2)]">
        Entre l'envoi du lien et la soumission
      </p>
    </div>

    <!-- Répartition des priorités -->
    <div class="flex flex-col gap-3 rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
        Répartition des priorités
      </p>
      <div class="flex flex-col gap-2">
        <div
          v-for="item in priorityItems"
          :key="item.key"
          class="flex items-center gap-2"
        >
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="item.color"
              :style="{ width: `${item.pct}%` }"
            />
          </div>
          <span class="w-20 shrink-0 text-right text-xs font-medium" :class="item.textColor">
            {{ item.label }} <span class="text-[var(--color-ink-2)]">({{ item.count }})</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Top 5 symptômes (pleine largeur) -->
    <div
      v-if="stats.topSymptoms.length"
      class="flex flex-col gap-4 rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:col-span-3"
    >
      <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
        Symptômes les plus fréquents
      </p>
      <div class="flex flex-col gap-2.5">
        <div
          v-for="(sym, index) in stats.topSymptoms"
          :key="sym.id"
          class="flex items-center gap-3"
        >
          <span class="w-4 shrink-0 text-right text-xs text-[var(--color-muted-strong)]">{{ index + 1 }}</span>
          <div class="flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
            <div
              class="h-5 rounded-full bg-[var(--color-primary,#0066CC)] opacity-80 transition-all duration-500"
              :style="{ width: `${Math.round((sym.count / maxSymptomCount) * 100)}%` }"
            />
          </div>
          <span class="w-40 shrink-0 truncate text-sm font-medium text-[var(--color-ink)]">{{ sym.label }}</span>
          <span class="w-8 shrink-0 text-right text-sm text-[var(--color-ink-2)]">{{ sym.count }}</span>
        </div>
      </div>
    </div>

  </div>
</template>
