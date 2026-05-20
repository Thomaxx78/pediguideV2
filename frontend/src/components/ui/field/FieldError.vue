<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { computed } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
  errors?: Array<string | { message: string | undefined } | undefined>
}>()

const content = computed(() => {
  if (!props.errors || props.errors.length === 0)
    return null

  const uniqueErrors = [
    ...new Map(
      props.errors
        .filter(Boolean)
        .map((error) => {
          const message = typeof error === "string" ? error : error?.message
          return [message, error]
        }),
    ).values(),
  ]

  if (uniqueErrors.length === 1 && uniqueErrors[0]) {
    return typeof uniqueErrors[0] === "string" ? uniqueErrors[0] : uniqueErrors[0].message
  }

  return uniqueErrors.map(error => typeof error === "string" ? error : error?.message)
})
</script>

<template>
  <div
    v-if="$slots.default || content"
    role="alert"
    data-slot="field-error"
    :class="cn('flex items-start gap-1.5 text-destructive text-sm font-normal', props.class)"
  >
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      class="mt-0.5 size-4 shrink-0"
      fill="currentColor"
    >
      <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 3.25a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4.75Zm0 7.25a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Z" />
    </svg>
    <div class="flex-1">
      <slot v-if="$slots.default" />

      <template v-else-if="typeof content === 'string'">
        {{ content }}
      </template>

      <ul v-else-if="Array.isArray(content)" class="ml-4 flex list-disc flex-col gap-1">
        <li v-for="(error, index) in content" :key="index">
          {{ error }}
        </li>
      </ul>
    </div>
  </div>
</template>
