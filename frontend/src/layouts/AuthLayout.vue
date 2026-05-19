<script setup lang="ts">
import IconsUtil from '@/components/utils/IconsUtil.vue'
</script>

<template>
  <main
    id="main-content"
    class="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10"
    tabindex="-1"
  >
    <RouterLink
      to="/"
      class="group absolute left-6 top-6 flex items-center gap-1 rounded-md text-muted-foreground hover:text-foreground hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <IconsUtil
        icon="arrow-left"
        width-class="w-5"
        height-class="h-5"
        color-class="text-muted-foreground group-hover:text-foreground group-focus-visible:text-foreground transition-colors"
      />
      <span class="text-sm font-medium">Retour</span>
    </RouterLink>
    <div class="w-full max-w-sm">
      <slot />
    </div>
  </main>
</template>
