<script setup lang="ts">
defineProps<{
  step: number
  totalSteps: number
  progress: number
}>()
</script>

<template>
  <header class="space-y-3">
    <h1 class="text-h2 font-semibold text-foreground">Pré-consultation pédiatrique</h1>
    <p class="text-sm text-muted-foreground">
      Répondez aux questions suivantes pour aider le médecin à préparer la consultation.
    </p>
    <div class="space-y-2">
      <p class="text-sm font-medium text-primary" aria-live="polite">
        Étape {{ step }} sur {{ totalSteps }}
      </p>
      <div
        class="h-2 w-full rounded-full bg-muted"
        role="progressbar"
        aria-valuemin="1"
        :aria-valuemax="totalSteps"
        :aria-valuenow="step"
        :aria-valuetext="`Étape ${step} sur ${totalSteps}`"
      >
        <div
          class="h-full rounded-full bg-primary transition-all duration-300"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
      <p class="text-xs text-muted-foreground">
        Tous les champs marqués <span aria-hidden="true">*</span> sont obligatoires.
      </p>
    </div>
  </header>
</template>
