<script setup lang="ts">
import RegisterForm from '@/components/forms/RegisterForm.vue'
import AuthAside from '@/components/forms/AuthAside.vue'

const asideItems = [
  { title: 'Créez votre compte', body: 'Nom du cabinet, RPPS, email professionnel.' },
  { title: 'Vérification RPPS', body: 'Sous 48 h ouvrées via l\'Annuaire santé.' },
  { title: 'Premier patient', body: 'Envoyez votre premier questionnaire en moins de 30 s.' },
]
</script>

<template>
  <!-- Form column -->
  <section class="flex items-center justify-center px-5 py-10 md:px-10 md:py-16">
    <div class="w-full max-w-[460px]">
      <p class="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted-strong)]">
        Création de compte
      </p>
      <h1 class="mt-2 font-display text-[28px] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
        Demander un accès
      </h1>
      <p class="mt-2 text-[14.5px] text-[var(--color-ink-2)]">
        Réservé aux professionnels de santé. Votre numéro RPPS sera vérifié sous 48 h.
      </p>

      <div class="mt-7">
        <RegisterForm />
      </div>
    </div>
  </section>

  <!-- Aside -->
  <AuthAside
    eyebrow="Démarrage"
    heading="3 étapes pour activer Pediguide dans votre cabinet."
    :items="asideItems"
  />
</template>
