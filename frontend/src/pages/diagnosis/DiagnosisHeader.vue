<script setup lang="ts">
import { Stepper } from '@/components/ui/stepper'
import { Brand } from '@/components/ui/brand'

defineProps<{
  step: number
  totalSteps: number
}>()
</script>

<template>
  <header class="space-y-4">
    <div class="flex items-center justify-between">
      <Brand />
      <span class="text-xs font-medium text-[var(--color-muted-strong)] uppercase tracking-[0.08em]">
        Questionnaire
      </span>
    </div>
    <Stepper :current-step="step" :total-steps="totalSteps" />
  </header>
</template>
