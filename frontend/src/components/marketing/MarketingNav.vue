<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Brand } from '@/components/ui/brand'

const router = useRouter()

const goToLogin = () => router.push('/login')
const goToRegister = () => router.push('/register')

const scrollTo = (id: string) => {
  if (typeof window === 'undefined') return
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <header
    class="sticky top-0 z-10 border-b border-[color-mix(in_oklab,var(--color-line)_60%,transparent)] bg-[color-mix(in_oklab,var(--color-bg)_80%,transparent)] backdrop-blur-md backdrop-saturate-150"
  >
    <div class="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3 px-5 py-4 md:px-10 md:py-5">
      <RouterLink to="/" class="rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45">
        <Brand />
      </RouterLink>

      <nav class="hidden items-center gap-7 text-sm md:flex">
        <a
          href="#features"
          class="text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
          @click.prevent="scrollTo('features')"
        >Fonctionnalités</a>
        <a
          href="#how"
          class="text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
          @click.prevent="scrollTo('how')"
        >Comment ça marche</a>
        <a
          href="#trust"
          class="text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
          @click.prevent="scrollTo('trust')"
        >Sécurité</a>
      </nav>

      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" class="hidden sm:inline-flex" @click="goToLogin">
          Se connecter
        </Button>
        <Button size="sm" @click="goToRegister">
          <span class="hidden sm:inline">Demander un accès</span>
          <span class="sm:hidden">Accès</span>
          <svg viewBox="0 0 16 16" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 8h10" />
            <path d="M9 4l4 4-4 4" />
          </svg>
        </Button>
      </div>
    </div>
  </header>
</template>
