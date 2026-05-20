<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  /** Hide the wordmark, show only the mark. */
  iconOnly?: boolean
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div :class="cn('inline-flex items-center gap-2', props.class)">
    <span
      aria-hidden="true"
      class="inline-flex size-6 items-center justify-center rounded-[var(--r-sm)] bg-primary text-primary-foreground"
    >
      <svg viewBox="0 0 16 16" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
        <path d="M8 3v10M3 8h10" />
      </svg>
    </span>
    <span
      v-if="!iconOnly"
      class="font-display text-[17px] font-semibold tracking-tight text-[var(--color-ink)]"
    >Pediguide</span>
  </div>
</template>
