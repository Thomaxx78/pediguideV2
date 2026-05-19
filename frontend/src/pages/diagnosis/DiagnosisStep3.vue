<script setup lang="ts">
import type { DiagnosisFormState } from '@/stores/diagnosisForm'
import type { FormFieldKey } from '@/pages/diagnosis/diagnosisValidation'
import { FieldError, FieldLegend, FieldSet } from '@/components/ui/field'
import { durationOptions, worryLevelOptions } from '@/pages/diagnosis/diagnosisOptions'

defineProps<{
  form: DiagnosisFormState
  errors: Partial<Record<FormFieldKey, string>>
  shouldShowError: (field: FormFieldKey) => boolean
  errorId: (field: FormFieldKey) => string
}>()

const emit = defineEmits<{
  (e: 'field-change', field: FormFieldKey): void
}>()
</script>

<template>
  <section class="space-y-6" aria-labelledby="step-3-title">
    <div class="space-y-2">
      <h2 id="step-3-title" tabindex="-1" class="text-h3 font-semibold text-foreground">
        Depuis quand et ressenti
      </h2>
      <p class="text-sm text-muted-foreground">
        Ces informations sont nécessaires pour préparer la consultation.
      </p>
    </div>

    <FieldSet
      :aria-invalid="shouldShowError('duration')"
      :aria-describedby="shouldShowError('duration') ? errorId('duration') : undefined"
    >
      <FieldLegend>
        Depuis quand ?
        <span class="text-destructive" aria-hidden="true">*</span>
        <span class="text-xs text-muted-foreground">(obligatoire)</span>
      </FieldLegend>
      <div class="space-y-3">
        <label
          v-for="option in durationOptions"
          :key="option.id"
          :for="option.id"
          class="flex items-start gap-3 rounded-lg border border-border/70 bg-background p-3 transition-colors hover:bg-accent/60 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
        >
          <input
            :id="option.id"
            v-model="form.duration"
            type="radio"
            name="duration"
            :value="option.label"
            required
            class="mt-0.5 h-4 w-4 border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            @change="emit('field-change', 'duration')"
          />
          <span class="text-sm text-foreground">{{ option.label }}</span>
        </label>
      </div>
      <FieldError
        v-if="shouldShowError('duration')"
        :id="errorId('duration')"
        :errors="[errors.duration]"
      />
    </FieldSet>

    <FieldSet
      :aria-invalid="shouldShowError('worryLevel')"
      :aria-describedby="shouldShowError('worryLevel') ? errorId('worryLevel') : undefined"
    >
      <FieldLegend>
        Niveau d'inquiétude
        <span class="text-destructive" aria-hidden="true">*</span>
        <span class="text-xs text-muted-foreground">(obligatoire)</span>
      </FieldLegend>
      <div class="space-y-3">
        <label
          v-for="option in worryLevelOptions"
          :key="option.id"
          :for="option.id"
          class="flex items-start gap-3 rounded-lg border border-border/70 bg-background p-3 transition-colors hover:bg-accent/60 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
        >
          <input
            :id="option.id"
            v-model="form.worryLevel"
            type="radio"
            name="worryLevel"
            :value="option.label"
            required
            class="mt-0.5 h-4 w-4 border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            @change="emit('field-change', 'worryLevel')"
          />
          <span class="text-sm text-foreground">{{ option.label }}</span>
        </label>
      </div>
      <FieldError
        v-if="shouldShowError('worryLevel')"
        :id="errorId('worryLevel')"
        :errors="[errors.worryLevel]"
      />
    </FieldSet>
  </section>
</template>
