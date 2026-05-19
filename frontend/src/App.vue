<script setup lang="ts">
import MainLayout from '@/layouts/MainLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useRoute } from 'vue-router'
import { computed, nextTick, watch } from 'vue'
import type { Component } from 'vue'

const route = useRoute()

const layouts: Record<string, Component> = {
  main: MainLayout,
  auth: AuthLayout,
}
const layout = computed(() => layouts[route.meta.layout as string] ?? layouts.main)

const focusMainContent = async () => {
  await nextTick()
  const main = document.getElementById('main-content')
  if (main instanceof HTMLElement) {
    main.focus()
  }
}

watch(
  () => route.fullPath,
  () => {
    focusMainContent()
  },
)
</script>

<template>
  <component :is="layout">
    <router-view />
  </component>
</template>
