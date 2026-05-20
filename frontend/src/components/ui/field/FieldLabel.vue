<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"
import { Label } from '@/components/ui/label'

const props = defineProps<{
  class?: HTMLAttributes["class"]
  /** Pediguide design convention: appends a muted " obligatoire" suffix. */
  required?: boolean
}>()
</script>

<template>
  <Label
    data-slot="field-label"
    :class="cn(
      'group/field-label peer/field-label flex w-fit items-baseline gap-1.5 leading-snug font-medium text-[var(--color-ink)] group-data-[disabled=true]/field:opacity-50',
      'has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-[var(--r-md)] has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4',
      'has-data-[state=checked]:bg-primary/5 has-data-[state=checked]:border-primary dark:has-data-[state=checked]:bg-primary/10',
      props.class,
    )"
  >
    <slot />
    <span
      v-if="required"
      class="text-[13px] font-normal text-[var(--color-muted-strong)]"
    >obligatoire</span>
  </Label>
</template>
