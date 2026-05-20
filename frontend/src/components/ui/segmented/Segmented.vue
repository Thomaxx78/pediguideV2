<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

type Option = { value: string, label: string }

const props = defineProps<{
  modelValue: string
  options: Option[]
  class?: HTMLAttributes["class"]
  ariaLabel?: string
}>()

const emits = defineEmits<{
  (e: "update:modelValue", value: string): void
}>()

const select = (value: string) => {
  if (value !== props.modelValue) emits("update:modelValue", value)
}

const onKey = (event: KeyboardEvent, index: number) => {
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return
  event.preventDefault()
  const dir = event.key === "ArrowRight" ? 1 : -1
  const next = (index + dir + props.options.length) % props.options.length
  const nextOption = props.options[next]
  if (!nextOption) return
  select(nextOption.value)
  const buttons = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>("[role=radio]")
  buttons?.[next]?.focus()
}
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="ariaLabel"
    :class="cn(
      'inline-flex w-full rounded-[var(--r-md)] border border-[var(--color-line-2)] bg-[var(--color-surface-2)] p-1 gap-1',
      props.class,
    )"
  >
    <button
      v-for="(option, index) in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="modelValue === option.value"
      :data-state="modelValue === option.value ? 'checked' : 'unchecked'"
      :tabindex="modelValue === option.value ? 0 : -1"
      :class="cn(
        'flex-1 inline-flex items-center justify-center h-11 px-3 text-sm font-medium rounded-[var(--r-sm)]',
        'transition-[background-color,color,box-shadow] duration-[140ms] cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
        modelValue === option.value
          ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--shadow-xs)]'
          : 'bg-transparent text-[var(--color-ink-2)] hover:text-[var(--color-ink)]',
      )"
      @click="select(option.value)"
      @keydown="onKey($event, index)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
