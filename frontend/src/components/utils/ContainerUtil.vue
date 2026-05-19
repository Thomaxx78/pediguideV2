<script setup lang="ts">
interface Props {
  as?: 'section' | 'div' | 'main' | 'article'
  WidthClass?: string
  HeightClass?: string
}

const { as = 'div', WidthClass = 'max-w-7xl', HeightClass = 'h-fit' } = defineProps<Props>()
</script>

<template>
  <section
    v-if="as === 'section'"
    class="w-full mx-auto py-10 md:py-20"
    :class="[WidthClass, HeightClass]"
  >
    <slot />
  </section>
  <component v-else :is="as" class="w-full" :class="[WidthClass, HeightClass]">
    <slot />
  </component>
</template>
