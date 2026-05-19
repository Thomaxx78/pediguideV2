<script setup lang="ts">
import type { DiagnosisFormState } from '@/stores/diagnosisForm'
import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui/field'
import { behaviorOptions, clinicalSignsOptions } from '@/pages/diagnosis/diagnosisOptions'

defineProps<{
  form: DiagnosisFormState
}>()
</script>

<template>
  <section class="space-y-6" aria-labelledby="step-2-title">
    <div class="space-y-2">
      <h2 id="step-2-title" tabindex="-1" class="text-h3 font-semibold text-foreground">
        Ce que vous observez
      </h2>
      <p class="text-sm text-muted-foreground">
        Sélectionnez tout ce qui s'applique. Cette étape est facultative.
      </p>
    </div>

    <FieldSet>
      <FieldLegend>
        Changements de comportement
        <span class="text-xs text-muted-foreground">(facultatif)</span>
      </FieldLegend>
      <FieldDescription>Plusieurs choix possibles.</FieldDescription>
      <div class="space-y-3">
        <label
          v-for="option in behaviorOptions"
          :key="option.id"
          :for="option.id"
          class="flex items-start gap-3 rounded-lg border border-border/70 bg-background p-3 transition-colors hover:bg-accent/60 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
        >
          <input
            :id="option.id"
            v-model="form.behaviorChanges"
            type="checkbox"
            name="behaviorChanges"
            :value="option.label"
            class="mt-0.5 h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <span class="text-sm text-foreground">{{ option.label }}</span>
        </label>
      </div>
    </FieldSet>

    <FieldSet>
      <FieldLegend>
        Signes cliniques observés
        <span class="text-xs text-muted-foreground">(facultatif)</span>
      </FieldLegend>
      <FieldDescription>Plusieurs choix possibles.</FieldDescription>
      <div class="space-y-3">
        <label
          v-for="option in clinicalSignsOptions"
          :key="option.id"
          :for="option.id"
          class="flex items-start gap-3 rounded-lg border border-border/70 bg-background p-3 transition-colors hover:bg-accent/60 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
        >
          <input
            :id="option.id"
            v-model="form.clinicalSigns"
            type="checkbox"
            name="clinicalSigns"
            :value="option.label"
            class="mt-0.5 h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <span class="text-sm text-foreground">{{ option.label }}</span>
        </label>
      </div>
    </FieldSet>
  </section>
</template>
