<script setup lang="ts">
import LoginForm from '@/components/forms/LoginForm.vue'
import AuthAside from '@/components/forms/AuthAside.vue'

const asideItems = [
  { title: 'Compte vérifié manuellement', body: 'Sous 48 h ouvrées via votre numéro RPPS.' },
  { title: 'Réservé aux professionnels', body: 'Pédiatres et médecins généralistes.' },
  { title: 'Sécurité renforcée', body: 'Authentification chiffrée, données HDS.' },
]
</script>

<template>
  <!-- Form column -->
  <section class="flex items-center justify-center px-5 py-10 md:px-10 md:py-16">
    <div class="w-full max-w-[420px]">
      <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
        Connexion
      </p>
      <h1 class="mt-2 font-display text-[28px] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
        Espace pédiatre
      </h1>
      <p class="mt-2 text-[14.5px] text-[var(--color-ink-2)]">
        Entrez vos identifiants pour accéder à votre tableau de bord.
      </p>

      <div class="mt-7">
        <LoginForm />
      </div>
    </div>
  </section>

  <!-- Aside -->
  <AuthAside
    eyebrow="Pediguide"
    heading="Vos parents arrivent déjà préparés à la consultation."
    :items="asideItems"
  />
</template>
