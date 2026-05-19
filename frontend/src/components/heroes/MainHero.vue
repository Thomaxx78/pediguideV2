<script setup lang="ts">
import ImageUtil from '@/components/utils/ImageUtil.vue'
import { Button } from '@/components/ui/button'
import HeroUtil from "@/components/utils/HeroUtil.vue";
</script>

<template>
  <HeroUtil class="flex items-center justify-center">
    <div class="w-full h-full flex flex-col lg:flex-row gap-5 items-center lg:items-stretch">
      <div class="w-full flex items-center justify-center">
        <ImageUtil
          image="pediatric-landing-hero"
          alt="Accompagnement pédiatrique"
          widthClass="w-full"
          heightClass="h-auto"
          class="object-contain max-h-[50vh] lg:max-h-[70vh]"
        />
      </div>

      <div
        class="w-full flex flex-col justify-center items-center lg:items-start text-center lg:text-left gap-6"
      >
        <div>
          <h1
            class="text-display-xl lg:text-display-2xl font-bold tracking-tighter leading-tighter text-text"
          >
            PediGuide
          </h1>
          <h2
            class="text-h2 lg:text-h1 font-semibold tracking-tight leading-snug text-brand"
          >
            Votre application pédiatrique clé en main
          </h2>
        </div>

        <p class="text-body-lg lg:text-h5 leading-relaxed text-text-muted max-w-xl">
          Accompagnez la santé de votre enfant en toute sérénité. PediGuide vous aide à identifier
          les symptômes, faciliter le rendez-vous médical, et vous faire gagner du temps. 
        </p>

        <div class="flex flex-col sm:flex-row gap-4 mt-4">
          <Button
            asChild
            size="lg"
            class="focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <RouterLink to="/diagnosis">Commencer mon diagnostic</RouterLink>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            class="focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <RouterLink to="/login">Je suis médecin</RouterLink>
          </Button>
        </div>
      </div>
    </div>
  </HeroUtil>
</template>
