<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <!--
    Pediguide parent-flow viewport.
    Mobile-first; on desktop the same content is just centered in a narrow
    column. No phone-frame chrome (no shadow, no rounded corners, no gradient
    body background) — those were prototype-only and look fake in the real app.
  -->
  <main
    :class="cn(
      'mx-auto flex w-full max-w-[440px] flex-col min-h-screen bg-[var(--color-bg)]',
      props.class,
    )"
  >
    <slot />
  </main>
</template>
