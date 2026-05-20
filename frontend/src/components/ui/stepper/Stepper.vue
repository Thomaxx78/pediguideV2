<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { computed } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  currentStep: number
  totalSteps: number
  class?: HTMLAttributes["class"]
  ariaLabel?: string
}>()

const segments = computed(() =>
  Array.from({ length: props.totalSteps }, (_, i) => {
    const step = i + 1
    if (step < props.currentStep) return "done"
    if (step === props.currentStep) return "current"
    return "pending"
  }),
)
</script>

<template>
  <div
    role="progressbar"
    :aria-valuemin="1"
    :aria-valuemax="totalSteps"
    :aria-valuenow="currentStep"
    :aria-label="ariaLabel ?? 'Étapes du questionnaire'"
    :class="cn('flex w-full items-center gap-2', props.class)"
  >
    <span
      v-for="(state, i) in segments"
      :key="i"
      :class="[
        'flex-1 h-1.5 rounded-full transition-colors duration-[240ms]',
        state === 'done'
          ? 'bg-primary'
          : state === 'current'
            ? 'bg-primary/70'
            : 'bg-[var(--color-line)]',
      ]"
    ></span>
    <span class="ml-2 text-xs font-medium text-[var(--color-muted-strong)] tabular-nums">
      {{ currentStep }}<span class="text-[var(--color-line-2)]">/{{ totalSteps }}</span>
    </span>
  </div>
</template>
