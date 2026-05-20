<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"
import logoUrl from "@/assets/logo.svg"

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
      class="pg-brand-mark inline-flex size-7 items-center justify-center rounded-[var(--r-sm)] bg-primary"
    >
      <img
        :src="logoUrl"
        alt=""
        class="size-5 -mb-px"
      />
    </span>
    <span
      v-if="!iconOnly"
      class="font-display text-[17px] font-semibold tracking-tight text-[var(--color-ink)]"
    >Pediguide</span>
  </div>
</template>

<style scoped>
/* Logo SVG uses fill="currentColor", but it's loaded via <img> so currentColor
   resolves to the <img>'s color (black). Filter forces it to white. */
.pg-brand-mark img {
  filter: brightness(0) invert(1);
}
</style>
