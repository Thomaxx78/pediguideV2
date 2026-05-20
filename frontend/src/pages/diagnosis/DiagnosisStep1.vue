<script setup lang="ts">
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import type { DiagnosisFormState } from '@/stores/diagnosisForm'
import type { FormFieldKey } from './diagnosisValidation'
import { genderOptions } from './diagnosisOptions'

const props = defineProps<{
  form: DiagnosisFormState
  errors: Partial<Record<FormFieldKey, string>>
  maxBirthDate: string
  shouldShowError: (field: FormFieldKey) => boolean
  errorId: (field: FormFieldKey) => string
}>()

const emit = defineEmits<{
  (e: 'field-blur', field: FormFieldKey): void
  (e: 'field-input', field: FormFieldKey): void
  (e: 'field-change', field: FormFieldKey): void
}>()

const onGenderChange = (value: string) => {
  props.form.gender = value as DiagnosisFormState['gender']
  emit('field-change', 'gender')
}
</script>

<template>
  <section class="space-y-7" aria-labelledby="step-1-title">
    <header class="space-y-2">
      <h1 id="step-1-title" tabindex="-1" class="font-display text-[26px] leading-[1.15] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
        Parlons un peu de votre enfant
      </h1>
      <p class="text-[15px] text-[var(--color-ink-2)]">
        Ces informations aident le pédiatre à adapter son évaluation.
      </p>
    </header>

    <div class="space-y-5">
      <!-- First name -->
      <Field>
        <FieldLabel for="child-first-name" required>Prénom</FieldLabel>
        <Input
          id="child-first-name"
          v-model="form.childFirstName"
          name="childFirstName"
          autocomplete="given-name"
          :aria-invalid="Boolean(errors.childFirstName)"
          :aria-describedby="shouldShowError('childFirstName') ? errorId('childFirstName') : undefined"
          @blur="emit('field-blur', 'childFirstName')"
          @input="emit('field-input', 'childFirstName')"
        />
        <FieldError
          v-if="shouldShowError('childFirstName')"
          :id="errorId('childFirstName')"
          :errors="[errors.childFirstName]"
        />
      </Field>

      <!-- Birth date -->
      <Field>
        <FieldLabel for="child-birth-date" required>Date de naissance</FieldLabel>
        <Input
          id="child-birth-date"
          v-model="form.childBirthDate"
          type="date"
          name="childBirthDate"
          autocomplete="bday"
          :max="maxBirthDate"
          :aria-invalid="Boolean(errors.childBirthDate)"
          :aria-describedby="shouldShowError('childBirthDate') ? errorId('childBirthDate') : undefined"
          @blur="emit('field-blur', 'childBirthDate')"
          @input="emit('field-input', 'childBirthDate')"
        />
        <FieldError
          v-if="shouldShowError('childBirthDate')"
          :id="errorId('childBirthDate')"
          :errors="[errors.childBirthDate]"
        />
      </Field>

      <div class="grid grid-cols-2 gap-3">
        <!-- Weight -->
        <Field>
          <FieldLabel for="child-weight" required>Poids</FieldLabel>
          <Input
            id="child-weight"
            v-model="form.weight"
            name="weight"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            affix="kg"
            :aria-invalid="Boolean(errors.weight)"
            :aria-describedby="shouldShowError('weight') ? errorId('weight') : undefined"
            @blur="emit('field-blur', 'weight')"
            @input="emit('field-input', 'weight')"
          />
          <FieldError
            v-if="shouldShowError('weight')"
            :id="errorId('weight')"
            :errors="[errors.weight]"
          />
        </Field>

        <!-- Height (optional) -->
        <Field>
          <FieldLabel for="child-height">Taille</FieldLabel>
          <Input
            id="child-height"
            v-model="form.height"
            name="height"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            affix="cm"
          />
        </Field>
      </div>

      <!-- Gender -->
      <Field id="child-gender">
        <FieldLabel required>Genre</FieldLabel>
        <Segmented
          :model-value="form.gender"
          :options="[...genderOptions]"
          aria-label="Genre de l'enfant"
          @update:model-value="onGenderChange"
        />
        <FieldError
          v-if="shouldShowError('gender')"
          :id="errorId('gender')"
          :errors="[errors.gender]"
        />
      </Field>
    </div>
  </section>
</template>
