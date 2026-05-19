<script setup lang="ts">
import ContainerUtil from '@/components/utils/ContainerUtil.vue'

const updatedAt = '09/01/2026'
</script>

<template>
  <ContainerUtil as="section">
    <div class="mx-auto w-full max-w-3xl space-y-8">
      <header class="space-y-2">
        <p class="text-sm text-muted-foreground">Dernière mise à jour : {{ updatedAt }}</p>
        <h1 class="text-h1 font-semibold text-foreground">Politique de confidentialité</h1>
        <p class="text-body-lg text-muted-foreground">
          Cette politique explique quelles données sont collectées, pourquoi, et comment elles sont
          protégées.
        </p>
      </header>

      <section class="space-y-3">
        <h2 class="text-h3 font-semibold text-foreground">Données collectées</h2>
        <ul class="space-y-1 text-sm text-muted-foreground">
          <li>Informations de compte (nom, email, identifiants).</li>
          <li>Données de pré-consultation saisies par l’utilisateur.</li>
          <li>Données techniques (logs, navigateur, appareil).</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-h3 font-semibold text-foreground">Finalités</h2>
        <ul class="space-y-1 text-sm text-muted-foreground">
          <li>Fournir le service et améliorer l’expérience utilisateur.</li>
          <li>Assurer la sécurité et la prévention des abus.</li>
          <li>Respecter les obligations légales.</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-h3 font-semibold text-foreground">Conservation</h2>
        <p class="text-sm text-muted-foreground">
          Les données sont conservées pendant la durée strictement nécessaire aux finalités
          décrites, ou selon les obligations légales applicables.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-h3 font-semibold text-foreground">Vos droits</h2>
        <p class="text-sm text-muted-foreground">
          Vous pouvez demander l’accès, la rectification ou la suppression de vos données, ainsi
          que la limitation ou l’opposition au traitement.
        </p>
        <p class="text-sm text-muted-foreground">
          Contact : <a class="underline underline-offset-4" href="mailto:contact@pediguide.fr">contact@pediguide.fr</a>
        </p>
      </section>
    </div>
  </ContainerUtil>
</template>
