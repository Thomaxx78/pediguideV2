<script setup lang="ts">
import ContainerUtil from '@/components/utils/ContainerUtil.vue'

const updatedAt = '29/01/2026'
</script>

<template>
  <ContainerUtil as="section">
    <div class="mx-auto w-full max-w-3xl space-y-8">
      <header class="space-y-2">
        <p class="text-sm text-muted-foreground">Dernière mise à jour : {{ updatedAt }}</p>
        <h1 class="text-h1 font-semibold text-foreground">Mentions légales</h1>
        <p class="text-body-lg text-muted-foreground">
          Cette page présente les informations légales obligatoires concernant PediGuide.
        </p>
      </header>

      <section class="space-y-3">
        <h2 class="text-h3 font-semibold text-foreground">Éditeur du site</h2>
        <ul class="space-y-1 text-sm text-muted-foreground">
          <li>Projet étudiant : équipe PediGuide</li>
          <li>Établissement : IIM DIGITAL SCHOOL</li>
          <li>Responsable de publication : Pédiguide</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-h3 font-semibold text-foreground">Hébergement</h2>
        <ul class="space-y-1 text-sm text-muted-foreground">
          <li>Hébergeur : Vercel Inc</li>
          <li>Adresse : 340 S Lemon Ave #4133 Walnut, CA 91789</li>
          <li>Téléphone : (559) 288-7060</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-h3 font-semibold text-foreground">Contact</h2>
        <p class="text-sm text-muted-foreground">
          Email de projet :
          <a class="underline underline-offset-4" href="mailto:contact@pediguide.fr">contact@pediguide.fr</a>
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-h3 font-semibold text-foreground">Propriété intellectuelle</h2>
        <p class="text-sm text-muted-foreground">
          L'ensemble des contenus du prototype (textes, visuels, logos, composants) est la propriété
          de l'équipe PediGuide ou de ses partenaires. Toute reproduction non autorisée est
          interdite.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-h3 font-semibold text-foreground">Limitation de responsabilité</h2>
        <p class="text-sm text-muted-foreground">
          PediGuide est un prototype d'aide à la pré-consultation. Il ne constitue pas un
          dispositif médical et ne remplace pas un avis médical. En cas d'urgence, contactez les
          services compétents.
        </p>
      </section>
    </div>
  </ContainerUtil>
</template>
