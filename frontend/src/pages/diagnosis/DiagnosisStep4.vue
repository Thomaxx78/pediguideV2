<script setup lang="ts">
import type { DiagnosisFormState } from '@/stores/diagnosisForm'
import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui/field'
import { actionsOptions } from '@/pages/diagnosis/diagnosisOptions'

defineProps<{
  form: DiagnosisFormState
}>()
</script>

<template>
  <section class="space-y-6" aria-labelledby="step-4-title">
    <div class="space-y-2">
      <h2 id="step-4-title" tabindex="-1" class="text-h3 font-semibold text-foreground">
        Ce que vous avez déjà fait
      </h2>
      <p class="text-sm text-muted-foreground">
        Sélectionnez les actions réalisées, si applicable.
      </p>
    </div>

    <FieldSet>
      <FieldLegend>
        Actions déjà réalisées
        <span class="text-xs text-muted-foreground">(facultatif)</span>
      </FieldLegend>
      <FieldDescription>Plusieurs choix possibles.</FieldDescription>
      <div class="space-y-3">
        <label
          v-for="option in actionsOptions"
          :key="option.id"
          :for="option.id"
          class="flex items-start gap-3 rounded-lg border border-border/70 bg-background p-3 transition-colors hover:bg-accent/60 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
        >
          <input
            :id="option.id"
            v-model="form.actionsTaken"
            type="checkbox"
            name="actionsTaken"
            :value="option.label"
            class="mt-0.5 h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <span class="text-sm text-foreground">{{ option.label }}</span>
        </label>
      </div>
    </FieldSet>
  </section>
</template>
