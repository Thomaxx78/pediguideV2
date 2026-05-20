<script setup lang="ts">
import { computed } from 'vue'

type KycState = 'verified' | 'pending' | 'rejected'

const props = defineProps<{
  state: KycState
}>()

const config = computed(() => {
  switch (props.state) {
    case 'verified':
      return {
        label: 'Vérifié',
        text: 'var(--color-sev-1)',
        bg: 'color-mix(in oklab, var(--color-sev-1) 8%, var(--color-bg))',
        glyph: '✓',
      }
    case 'rejected':
      return {
        label: 'Rejeté',
        text: 'var(--color-sev-5)',
        bg: 'color-mix(in oklab, var(--color-sev-5) 8%, var(--color-bg))',
        glyph: '!',
      }
    case 'pending':
    default:
      return {
        label: 'En cours de vérification',
        text: 'var(--color-sev-3)',
        bg: 'color-mix(in oklab, var(--color-sev-3) 8%, var(--color-bg))',
        glyph: '…',
      }
  }
})
</script>

<template>
  <span
    :data-state="state"
    class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium"
    :style="{ color: config.text, backgroundColor: config.bg }"
  >
    <span
      aria-hidden="true"
      class="inline-flex size-[18px] items-center justify-center rounded-full text-[11px] font-semibold"
      :style="{ backgroundColor: 'var(--color-surface)', color: config.text }"
    >{{ config.glyph }}</span>
    {{ config.label }}
  </span>
</template>
