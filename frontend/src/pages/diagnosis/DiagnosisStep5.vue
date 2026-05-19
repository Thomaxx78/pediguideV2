<script setup lang="ts">
import type { DiagnosisFormState } from '@/stores/diagnosisForm'
import { Field, FieldLabel } from '@/components/ui/field'

defineProps<{
  form: DiagnosisFormState
}>()
</script>

<template>
  <section class="space-y-6" aria-labelledby="step-5-title">
    <div class="space-y-2">
      <h2 id="step-5-title" tabindex="-1" class="text-h3 font-semibold text-foreground">
        Message libre
      </h2>
      <p class="text-sm text-muted-foreground">
        Vous pouvez ajouter toute précision utile pour le médecin.
      </p>
    </div>

    <Field>
      <FieldLabel for="additional-notes">
        Message complémentaire
        <span class="text-xs text-muted-foreground">(facultatif)</span>
      </FieldLabel>
      <textarea
        id="additional-notes"
        v-model="form.additionalNotes"
        name="additionalNotes"
        rows="5"
        class="min-h-[140px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        placeholder="Vous pouvez partager ici tout ce qui vous semble important."
      ></textarea>
    </Field>
  </section>
</template>
