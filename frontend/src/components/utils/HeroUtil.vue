<script setup lang="ts">
interface Props {
  WidthClass?: string
  HeightClass?: string
}

const { WidthClass = 'max-w-7xl', HeightClass = 'h-fit' } = defineProps<Props>()
</script>

<template>
  <section
    class="w-full mx-auto pb-10 pt-10 md:pb-20"
    :class="[WidthClass, HeightClass]"
  >
    <slot />
  </section>
</template>
