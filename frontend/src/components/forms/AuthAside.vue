<script setup lang="ts">
interface AsideItem {
  title: string
  body: string
}

defineProps<{
  eyebrow?: string
  heading: string
  items: AsideItem[]
}>()
</script>

<template>
  <aside class="relative hidden bg-[var(--color-ink)] text-white lg:flex lg:flex-col lg:justify-between lg:p-10">
    <!-- Subtle radial accent -->
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 opacity-[0.18]"
      style="background: radial-gradient(ellipse 70% 60% at 80% 0%, color-mix(in oklab, var(--color-primary-base) 50%, transparent), transparent 65%);"
    ></span>

    <div class="relative">
      <p v-if="eyebrow" class="text-[11px] font-medium uppercase tracking-[0.1em] text-white/60">
        {{ eyebrow }}
      </p>
      <h2 class="mt-3 font-display text-[26px] font-medium leading-tight tracking-[-0.02em]">
        {{ heading }}
      </h2>

      <ul class="mt-8 flex flex-col gap-5">
        <li v-for="item in items" :key="item.title" class="flex items-start gap-3">
          <span aria-hidden="true" class="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
            <svg viewBox="0 0 16 16" class="size-3" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 8.5l3.5 3.5L13 5" />
            </svg>
          </span>
          <div>
            <p class="text-[14.5px] font-medium text-white">{{ item.title }}</p>
            <p class="mt-0.5 text-[13px] text-white/65">{{ item.body }}</p>
          </div>
        </li>
      </ul>
    </div>

    <p class="relative mt-10 text-[12px] text-white/55">
      Données hébergées en France chez un hébergeur certifié HDS.
    </p>
  </aside>
</template>
