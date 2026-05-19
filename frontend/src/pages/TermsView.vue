<script setup lang="ts">
import ContainerUtil from '@/components/utils/ContainerUtil.vue'

const updatedAt = '09/01/2026'
</script>

<template>
  <ContainerUtil as="section">
    <div class="mx-auto w-full max-w-3xl space-y-8">
      <header class="space-y-2">
        <p class="text-sm text-muted-foreground">Dernière mise à jour : {{ updatedAt }}</p>
        <h1 class="text-h1 font-semibold text-foreground">Conditions d’utilisation</h1>
        <p class="text-body-lg text-muted-foreground">
          Ces conditions définissent les règles d’utilisation de la plateforme PediGuide.
        </p>
      </header>

      <section class="space-y-3">
        <h2 class="text-h3 font-semibold text-foreground">Objet</h2>
        <p class="text-sm text-muted-foreground">
          PediGuide propose un outil de pré-consultation pédiatrique à des fins d’orientation.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-h3 font-semibold text-foreground">Création de compte</h2>
        <p class="text-sm text-muted-foreground">
          L’accès à certaines fonctionnalités nécessite la création d’un compte et la fourniture
          d’informations exactes.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-h3 font-semibold text-foreground">Bon usage</h2>
        <ul class="space-y-1 text-sm text-muted-foreground">
          <li>Ne pas détourner la plateforme de son usage prévu.</li>
          <li>Ne pas tenter d’accéder à des zones non autorisées.</li>
          <li>Respecter les autres utilisateurs et les professionnels.</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-h3 font-semibold text-foreground">Responsabilité</h2>
        <p class="text-sm text-muted-foreground">
          PediGuide ne fournit pas de diagnostic médical. Le service ne remplace pas une
          consultation avec un professionnel de santé.
        </p>
      </section>
    </div>
  </ContainerUtil>
</template>
