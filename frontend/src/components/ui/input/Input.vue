<script setup lang="ts">
import type { HTMLAttributes, InputHTMLAttributes } from "vue"
import { useVModel } from "@vueuse/core"
import { cn } from "@/lib/utils"

type InputSize = "xl" | "md" | "sm"

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes["class"]
  /** Sets the input height/padding scale. xl = 52px (design default), sm = 36px (compact). */
  size?: InputSize
  /** Optional right-aligned affix label (e.g. "kg", "cm"). Rendered inside the input. */
  affix?: string
  /** Forwarded HTML type so we don't shadow it via the `size` collision. */
  type?: InputHTMLAttributes["type"]
}>()

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void
}>()

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

const sizeClasses: Record<InputSize, string> = {
  xl: "h-[52px] px-[14px] text-base rounded-[var(--r-md)]",
  md: "h-10 px-3 text-sm rounded-[var(--r-sm)]",
  sm: "h-9 px-3 text-sm rounded-[var(--r-sm)]",
}
</script>

<template>
  <div
    v-if="affix"
    :class="cn('relative w-full', props.class)"
  >
    <input
      v-model="modelValue"
      :type="type ?? 'text'"
      data-slot="input"
      :class="cn(
        sizeClasses[size ?? 'xl'],
        'pr-12 w-full min-w-0',
        'bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted-strong)]',
        'border border-[var(--color-line-2)] outline-none',
        'transition-[border-color,box-shadow] duration-[140ms]',
        'focus-visible:border-primary focus-visible:shadow-[var(--shadow-input-focus)]',
        'aria-invalid:border-destructive aria-invalid:focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-error)_22%,transparent)]',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
        'file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
      )"
    >
    <span
      aria-hidden="true"
      class="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted-strong)] select-none"
    >{{ affix }}</span>
  </div>

  <input
    v-else
    v-model="modelValue"
    :type="type ?? 'text'"
    data-slot="input"
    :class="cn(
      sizeClasses[size ?? 'xl'],
      'w-full min-w-0',
      'bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted-strong)]',
      'border border-[var(--color-line-2)] outline-none',
      'transition-[border-color,box-shadow] duration-[140ms]',
      'focus-visible:border-primary focus-visible:shadow-[var(--shadow-input-focus)]',
      'aria-invalid:border-destructive aria-invalid:focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-error)_22%,transparent)]',
      'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
      'file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
      props.class,
    )"
  >
</template>
