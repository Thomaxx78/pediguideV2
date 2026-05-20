<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { computed } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  modelValue?: boolean
  /** "checkbox" for multi-select, "radio" for single-select. */
  role?: "checkbox" | "radio"
  disabled?: boolean
  class?: HTMLAttributes["class"]
}>()

const emits = defineEmits<{
  (e: "update:modelValue", value: boolean): void
}>()

const isActive = computed(() => Boolean(props.modelValue))
const ariaRole = computed(() => props.role ?? "checkbox")
const ariaProp = computed(() => (ariaRole.value === "radio" ? "aria-checked" : "aria-checked"))

const toggle = () => {
  if (props.disabled) return
  if (ariaRole.value === "radio" && isActive.value) return
  emits("update:modelValue", !isActive.value)
}

const handleKey = (event: KeyboardEvent) => {
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault()
    toggle()
  }
}
</script>

<template>
  <button
    type="button"
    :role="ariaRole"
    :aria-checked="isActive"
    :data-state="isActive ? 'checked' : 'unchecked'"
    :disabled="disabled"
    :tabindex="disabled ? -1 : 0"
    :class="cn(
      'inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-full text-[15px] leading-tight',
      'border transition-[background-color,border-color,color,box-shadow] duration-[140ms] cursor-pointer select-none',
      'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
      'disabled:cursor-not-allowed disabled:opacity-50',
      isActive
        ? 'bg-[var(--color-primary-soft)] text-primary border-primary'
        : 'bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-line-2)] hover:bg-[var(--color-surface-2)]',
      props.class,
    )"
    @click="toggle"
    @keydown="handleKey"
  >
    <span
      v-if="isActive"
      aria-hidden="true"
      class="inline-flex size-4 items-center justify-center rounded-full bg-primary text-white"
    >
      <svg viewBox="0 0 16 16" class="size-3" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 8.5l3.5 3.5L13 5" />
      </svg>
    </span>
    <span><slot /></span>
  </button>
</template>
