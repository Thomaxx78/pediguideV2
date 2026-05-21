<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import api from '@/services/api'

type Stats = Awaited<ReturnType<typeof api.stats.get>>

const stats = ref<Stats | null>(null)
const isLoading = ref(true)

onMounted(async () => {
  try { stats.value = await api.stats.get() }
  finally { isLoading.value = false }
})

// ── Priority items ───────────────────────────────────────────────────────────

const PRIORITY_CFG = [
  { key: 'urgent',       label: 'Urgent',       stroke: '#ef4444', text: '#dc2626' },
  { key: 'a_surveiller', label: 'À surveiller', stroke: '#f97316', text: '#ea580c' },
  { key: 'non_urgent',   label: 'Non urgent',   stroke: '#22c55e', text: '#16a34a' },
] as const

const priorityItems = computed(() => {
  if (!stats.value) return []
  const dist = stats.value.priorityDistribution as Record<string, number>
  const total = Object.values(dist).reduce((a, b) => a + b, 0)
  return PRIORITY_CFG.map(cfg => ({
    ...cfg,
    count: dist[cfg.key] ?? 0,
    pct: total > 0 ? Math.round((dist[cfg.key] ?? 0) / total * 100) : 0,
  }))
})

const priorityTotal = computed(() => priorityItems.value.reduce((s, i) => s + i.count, 0))

// ── SVG Donut chart (priorities) ─────────────────────────────────────────────

const DONUT_R = 36
const DONUT_C = 2 * Math.PI * DONUT_R

const donutSegments = computed(() => {
  if (!stats.value || priorityTotal.value === 0) return []
  let acc = 0
  return priorityItems.value.map(item => {
    const frac = item.count / priorityTotal.value
    const len = frac * DONUT_C
    const seg = {
      stroke: item.stroke,
      dasharray: `${len.toFixed(2)} ${DONUT_C.toFixed(2)}`,
      dashoffset: -(acc * DONUT_C),
    }
    acc += frac
    return seg
  })
})

// ── SVG Pie chart (symptoms) ─────────────────────────────────────────────────

const PIE_COLORS = ['#0066CC', '#8b5cf6', '#f97316', '#22c55e', '#ec4899']

interface PieSlice {
  id: string
  label: string
  count: number
  pct: number
  color: string
  isFullCircle: boolean
  path: string
}

const pieSlices = computed((): PieSlice[] => {
  if (!stats.value?.topSymptoms.length) return []
  const syms = stats.value.topSymptoms
  const total = syms.reduce((s, sym) => s + sym.count, 0)
  if (total === 0) return []

  if (syms.length === 1) {
    return [{ id: syms[0].id, label: syms[0].label, count: syms[0].count, pct: 100, color: PIE_COLORS[0], isFullCircle: true, path: '' }]
  }

  const r = 42, cx = 50, cy = 50
  let startAngle = -Math.PI / 2

  return syms.map((sym, i) => {
    const frac = sym.count / total
    const endAngle = startAngle + frac * 2 * Math.PI
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const largeArc = frac > 0.5 ? 1 : 0
    const path = `M${cx} ${cy} L${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}Z`
    startAngle = endAngle
    return { id: sym.id, label: sym.label, count: sym.count, pct: Math.round(frac * 100), color: PIE_COLORS[i % PIE_COLORS.length], isFullCircle: false, path }
  })
})

const symptomTotal = computed(() => stats.value?.topSymptoms.reduce((s, sym) => s + sym.count, 0) ?? 0)

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatTime = (minutes: number | null) => {
  if (minutes === null) return '—'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}
</script>

<template>
  <!-- Loading skeleton -->
  <div v-if="isLoading" class="space-y-4">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-[var(--r-lg)] bg-[var(--color-surface-2)]" />
    </div>
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div v-for="i in 2" :key="i" class="h-52 animate-pulse rounded-[var(--r-lg)] bg-[var(--color-surface-2)]" />
    </div>
  </div>

  <div v-else-if="stats" class="space-y-4">

    <!-- ── KPI row ─────────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">

      <!-- Taux de complétion -->
      <div class="flex flex-col gap-3 rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">Taux de complétion</p>
        <div class="flex items-end gap-2">
          <span class="font-display text-3xl font-semibold text-[var(--color-ink)]">{{ stats.completionRate }}%</span>
          <span class="mb-0.5 text-sm text-[var(--color-ink-2)]">{{ stats.completedSessions }} / {{ stats.totalSessions }}</span>
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <div class="h-full rounded-full bg-primary transition-all duration-700" :style="{ width: `${stats.completionRate}%` }" />
        </div>
      </div>

      <!-- Temps moyen -->
      <div class="flex flex-col gap-3 rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">Temps moyen de complétion</p>
        <span class="font-display text-3xl font-semibold text-[var(--color-ink)]">{{ formatTime(stats.avgCompletionMinutes) }}</span>
        <p class="text-xs text-[var(--color-ink-2)]">Entre l'envoi du lien et la soumission</p>
      </div>

      <!-- Formulaires reçus -->
      <div class="flex flex-col gap-3 rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">Formulaires reçus</p>
        <span class="font-display text-3xl font-semibold text-[var(--color-ink)]">{{ stats.completedSessions }}</span>
        <p class="text-xs text-[var(--color-ink-2)]">
          {{ priorityTotal > 0 ? `${priorityTotal} avec synthèse IA` : 'Aucune synthèse IA générée' }}
        </p>
      </div>
    </div>

    <!-- ── Charts row ──────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">

      <!-- Donut : répartition des priorités -->
      <div class="flex flex-col gap-5 rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">Répartition des priorités IA</p>

        <div v-if="priorityTotal === 0" class="flex h-36 items-center justify-center text-sm text-[var(--color-muted-strong)]">
          Générez des synthèses IA pour voir la répartition.
        </div>

        <div v-else class="flex items-center gap-6">
          <!-- SVG donut -->
          <svg viewBox="0 0 100 100" class="w-32 shrink-0" aria-hidden="true">
            <!-- Background track -->
            <circle cx="50" cy="50" :r="DONUT_R" fill="none" stroke="#E5E7EB" :stroke-width="14" />
            <!-- Segments -->
            <circle
              v-for="seg in donutSegments"
              :key="seg.stroke"
              cx="50" cy="50"
              :r="DONUT_R"
              fill="none"
              :stroke="seg.stroke"
              :stroke-width="14"
              :stroke-dasharray="seg.dasharray"
              :stroke-dashoffset="seg.dashoffset"
              transform="rotate(-90 50 50)"
              stroke-linecap="butt"
            />
            <!-- Center label -->
            <text x="50" y="47" text-anchor="middle" font-size="15" font-weight="700" fill="#0F1B2D">{{ priorityTotal }}</text>
            <text x="50" y="58" text-anchor="middle" font-size="7.5" fill="#6B7280">analyses</text>
          </svg>

          <!-- Legend -->
          <ul class="flex flex-1 flex-col gap-3">
            <li v-for="item in priorityItems" :key="item.key" class="flex items-center gap-2.5 min-w-0">
              <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ background: item.stroke }" />
              <span class="min-w-0 flex-1 truncate text-sm text-[var(--color-ink)]">{{ item.label }}</span>
              <span class="text-sm font-semibold tabular-nums text-[var(--color-ink)]">{{ item.count }}</span>
              <span class="w-10 text-right text-xs text-[var(--color-muted-strong)]">{{ item.pct }}%</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Pie : symptômes les plus fréquents -->
      <div class="flex flex-col gap-5 rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">Symptômes les plus fréquents</p>

        <div v-if="!pieSlices.length" class="flex h-36 items-center justify-center text-sm text-[var(--color-muted-strong)]">
          Pas encore de données de symptômes.
        </div>

        <div v-else class="flex items-center gap-6">
          <!-- SVG pie -->
          <svg viewBox="0 0 100 100" class="w-32 shrink-0" aria-hidden="true">
            <!-- Single symptom → full circle -->
            <circle
              v-if="pieSlices.length === 1"
              cx="50" cy="50" r="42"
              :fill="pieSlices[0].color"
            />
            <!-- Multiple slices -->
            <path
              v-for="slice in pieSlices.filter(s => !s.isFullCircle)"
              :key="slice.id"
              :d="slice.path"
              :fill="slice.color"
              stroke="white"
              stroke-width="1.5"
            />
          </svg>

          <!-- Legend -->
          <ul class="flex flex-1 flex-col gap-2.5">
            <li
              v-for="(slice, i) in pieSlices"
              :key="slice.id"
              class="flex items-center gap-2.5 min-w-0"
            >
              <span class="h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ background: PIE_COLORS[i % PIE_COLORS.length] }" />
              <span class="min-w-0 flex-1 truncate text-sm text-[var(--color-ink)]">{{ slice.label }}</span>
              <span class="text-sm font-semibold tabular-nums text-[var(--color-ink)]">{{ slice.count }}</span>
              <span class="w-10 text-right text-xs text-[var(--color-muted-strong)]">
                {{ symptomTotal > 0 ? Math.round(slice.count / symptomTotal * 100) : 0 }}%
              </span>
            </li>
          </ul>
        </div>
      </div>

    </div>
  </div>
</template>
