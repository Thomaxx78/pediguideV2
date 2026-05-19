<script setup lang="ts">
import ContainerUtil from '@/components/utils/ContainerUtil.vue'

const updatedAt = '09/01/2026'
</script>

<template>
  <ContainerUtil as="section">
    <div class="mx-auto w-full max-w-3xl space-y-8">
      <header class="space-y-2">
        <p class="text-sm text-muted-foreground">Dernière mise à jour : {{ updatedAt }}</p>
        <h1 class="text-h1 font-semibold text-foreground">Gestion des cookies</h1>
        <p class="text-body-lg text-muted-foreground">
          Cette page décrit l’usage des cookies sur PediGuide et la manière de les contrôler.
        </p>
      </header>

      <section class="space-y-3">
        <h2 class="text-h3 font-semibold text-foreground">Qu’est-ce qu’un cookie ?</h2>
        <p class="text-sm text-muted-foreground">
          Un cookie est un petit fichier stocké sur votre appareil pour améliorer votre expérience.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-h3 font-semibold text-foreground">Cookies utilisés</h2>
        <ul class="space-y-1 text-sm text-muted-foreground">
          <li>Cookies indispensables au fonctionnement de l’application.</li>
          <li>Cookies de mesure d’audience (à compléter si utilisés).</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-h3 font-semibold text-foreground">Gestion de vos préférences</h2>
        <p class="text-sm text-muted-foreground">
          Vous pouvez paramétrer votre navigateur pour bloquer ou supprimer les cookies. Certaines
          fonctionnalités peuvent être dégradées.
        </p>
      </section>
    </div>
  </ContainerUtil>
</template>
