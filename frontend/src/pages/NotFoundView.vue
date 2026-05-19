<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import ContainerUtil from '@/components/utils/ContainerUtil.vue'

const titleRef = ref<HTMLHeadingElement | null>(null)

const handleBack = () => {
  window.history.back()
}

onMounted(() => {
  titleRef.value?.focus()
})
</script>

<template>
  <ContainerUtil as="section">
    <div class="mx-auto w-full max-w-3xl">
      <Card>
        <CardHeader class="space-y-3">
          <p class="text-sm text-muted-foreground">Référence : 404</p>
          <header class="space-y-2">
            <h1
              ref="titleRef"
              class="text-h1 font-semibold text-foreground focus:outline-2 focus:outline-ring focus:outline-offset-4"
              tabindex="-1"
            >
              Page introuvable (404)
            </h1>
            <p class="text-body-lg text-muted-foreground">
              Cette page n’existe pas ou l’adresse est incorrecte.
            </p>
          </header>
        </CardHeader>
        <CardContent class="flex flex-col gap-4">
          <div class="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              class="focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <RouterLink to="/">Retour à l’accueil</RouterLink>
            </Button>
            <Button type="button" variant="outline" @click="handleBack">
              Revenir en arrière
            </Button>
          </div>
          <p class="text-sm text-muted-foreground">
            Vous pouvez vérifier l’adresse ou revenir à l’accueil.
          </p>
        </CardContent>
      </Card>
    </div>
  </ContainerUtil>
</template>
