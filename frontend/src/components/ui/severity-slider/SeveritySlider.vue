<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { computed, ref } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  modelValue: number
  min?: number
  max?: number
  step?: number
  label?: string
  legendLeft?: string
  legendRight?: string
  class?: HTMLAttributes["class"]
}>()

const emits = defineEmits<{
  (e: "update:modelValue", value: number): void
}>()

const min = computed(() => props.min ?? 0)
const max = computed(() => props.max ?? 10)
const step = computed(() => props.step ?? 1)

const trackRef = ref<HTMLDivElement | null>(null)
const dragging = ref(false)

const percent = computed(() => {
  const range = max.value - min.value
  if (range === 0) return 0
  return ((props.modelValue - min.value) / range) * 100
})

const ticks = computed(() => {
  const count = Math.round((max.value - min.value) / step.value) + 1
  return Array.from({ length: count }, (_, i) => min.value + i * step.value)
})

const setValue = (raw: number) => {
  const clamped = Math.max(min.value, Math.min(max.value, raw))
  const snapped = Math.round((clamped - min.value) / step.value) * step.value + min.value
  if (snapped !== props.modelValue) emits("update:modelValue", snapped)
}

const valueFromPointer = (clientX: number) => {
  const el = trackRef.value
  if (!el) return props.modelValue
  const rect = el.getBoundingClientRect()
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  return min.value + ratio * (max.value - min.value)
}

const onPointerDown = (event: PointerEvent) => {
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  dragging.value = true
  setValue(valueFromPointer(event.clientX))
}
const onPointerMove = (event: PointerEvent) => {
  if (!dragging.value) return
  setValue(valueFromPointer(event.clientX))
}
const onPointerUp = (event: PointerEvent) => {
  dragging.value = false
  ;(event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId)
}

const onKeyDown = (event: KeyboardEvent) => {
  let next = props.modelValue
  switch (event.key) {
    case "ArrowRight":
    case "ArrowUp":
      next = props.modelValue + step.value
      break
    case "ArrowLeft":
    case "ArrowDown":
      next = props.modelValue - step.value
      break
    case "Home":
      next = min.value
      break
    case "End":
      next = max.value
      break
    case "PageUp":
      next = props.modelValue + step.value * 2
      break
    case "PageDown":
      next = props.modelValue - step.value * 2
      break
    default:
      return
  }
  event.preventDefault()
  setValue(next)
}
</script>

<template>
  <div :class="cn('flex w-full flex-col gap-3 select-none', props.class)">
    <div class="flex items-baseline justify-between">
      <span v-if="label" class="text-sm font-medium text-[var(--color-ink-2)]">{{ label }}</span>
      <span class="font-display text-2xl font-semibold text-primary tabular-nums">
        {{ modelValue }}<span class="text-[var(--color-muted-strong)] text-base font-normal">/{{ max }}</span>
      </span>
    </div>

    <div
      ref="trackRef"
      class="relative h-9 touch-none"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <!-- Rail -->
      <div class="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--color-line)]"></div>
      <!-- Fill -->
      <div
        class="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary transition-[width] duration-[80ms]"
        :style="{ width: `${percent}%` }"
      ></div>
      <!-- Ticks -->
      <div class="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between px-0">
        <span
          v-for="(tickValue, i) in ticks"
          :key="i"
          :class="[
            'size-1.5 rounded-full transition-colors duration-[140ms]',
            tickValue <= modelValue ? 'bg-primary' : 'bg-[var(--color-line-2)]',
          ]"
        ></span>
      </div>
      <!-- Thumb -->
      <button
        type="button"
        role="slider"
        :aria-label="label ?? 'Intensité'"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-valuenow="modelValue"
        :class="[
          'absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white',
          'shadow-[var(--shadow-sm)] cursor-grab transition-[transform,box-shadow] duration-[80ms]',
          'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
          dragging ? 'cursor-grabbing scale-110' : '',
        ]"
        :style="{ left: `${percent}%` }"
        @keydown="onKeyDown"
      >
        <span
          v-if="dragging"
          aria-hidden="true"
          class="absolute -top-9 left-1/2 -translate-x-1/2 rounded-[var(--r-sm)] bg-[var(--color-ink)] px-2 py-1 text-xs font-medium text-white tabular-nums shadow-[var(--shadow-md)]"
        >{{ modelValue }}</span>
      </button>
    </div>

    <div class="flex items-center justify-between text-xs text-[var(--color-muted-strong)]">
      <span>{{ legendLeft ?? 'Aucune gêne' }}</span>
      <span>{{ legendRight ?? 'Insupportable' }}</span>
    </div>
  </div>
</template>
