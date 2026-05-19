<script setup lang="ts">
import type { DiagnosisFormState } from '@/stores/diagnosisForm'
import type { FormFieldKey } from '@/pages/diagnosis/diagnosisValidation'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

defineProps<{
  form: DiagnosisFormState
  errors: Partial<Record<FormFieldKey, string>>
  shouldShowError: (field: FormFieldKey) => boolean
  errorId: (field: FormFieldKey) => string
  maxBirthDate: string
}>()

const emit = defineEmits<{
  (e: 'field-blur', field: FormFieldKey): void
  (e: 'field-input', field: FormFieldKey): void
}>()
</script>

<template>
  <section class="space-y-6" aria-labelledby="step-1-title">
    <div class="space-y-2">
      <h2 id="step-1-title" tabindex="-1" class="text-h3 font-semibold text-foreground">
        Préparer la consultation de votre enfant
      </h2>
      <p class="text-sm text-muted-foreground">
        Remplissez les informations essentielles sur votre enfant.
      </p>
    </div>

    <FieldGroup>
      <Field :data-invalid="shouldShowError('childFirstName')">
        <FieldLabel for="child-first-name">
          Prénom de l'enfant
          <span class="text-destructive" aria-hidden="true">*</span>
          <span class="text-xs text-muted-foreground">(obligatoire)</span>
        </FieldLabel>
        <Input
          id="child-first-name"
          v-model="form.childFirstName"
          type="text"
          name="childFirstName"
          autocomplete="given-name"
          required
          :aria-invalid="Boolean(errors.childFirstName)"
          :aria-describedby="shouldShowError('childFirstName') ? errorId('childFirstName') : undefined"
          placeholder="Ex : Arthur"
          @blur="emit('field-blur', 'childFirstName')"
          @input="emit('field-input', 'childFirstName')"
        />
        <FieldError
          v-if="shouldShowError('childFirstName')"
          :id="errorId('childFirstName')"
          :errors="[errors.childFirstName]"
        />
      </Field>

      <Field :data-invalid="shouldShowError('childLastName')">
        <FieldLabel for="child-last-name">
          Nom de l'enfant
          <span class="text-destructive" aria-hidden="true">*</span>
          <span class="text-xs text-muted-foreground">(obligatoire)</span>
        </FieldLabel>
        <Input
          id="child-last-name"
          v-model="form.childLastName"
          type="text"
          name="childLastName"
          autocomplete="family-name"
          required
          :aria-invalid="Boolean(errors.childLastName)"
          :aria-describedby="shouldShowError('childLastName') ? errorId('childLastName') : undefined"
          placeholder="Ex : Dupont"
          @blur="emit('field-blur', 'childLastName')"
          @input="emit('field-input', 'childLastName')"
        />
        <FieldError
          v-if="shouldShowError('childLastName')"
          :id="errorId('childLastName')"
          :errors="[errors.childLastName]"
        />
      </Field>

      <Field :data-invalid="shouldShowError('childBirthDate')">
        <FieldLabel for="child-birth-date">
          Date de naissance
          <span class="text-destructive" aria-hidden="true">*</span>
          <span class="text-xs text-muted-foreground">(obligatoire)</span>
        </FieldLabel>
        <Input
          id="child-birth-date"
          v-model="form.childBirthDate"
          type="date"
          name="childBirthDate"
          autocomplete="bday"
          required
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

      <Field :data-invalid="shouldShowError('consultationReason')">
        <FieldLabel for="consultation-reason">
          Qu'est-ce qui vous amène ?
          <span class="text-destructive" aria-hidden="true">*</span>
          <span class="text-xs text-muted-foreground">(obligatoire)</span>
        </FieldLabel>
        <textarea
          id="consultation-reason"
          v-model="form.consultationReason"
          name="consultationReason"
          rows="4"
          required
          class="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20"
          :aria-invalid="Boolean(errors.consultationReason)"
          :aria-describedby="shouldShowError('consultationReason') ? errorId('consultationReason') : undefined"
          placeholder="Ex : Fièvre depuis 2 jours, toux et fatigue."
          @blur="emit('field-blur', 'consultationReason')"
          @input="emit('field-input', 'consultationReason')"
        ></textarea>
        <FieldError
          v-if="shouldShowError('consultationReason')"
          :id="errorId('consultationReason')"
          :errors="[errors.consultationReason]"
        />
      </Field>
    </FieldGroup>
  </section>
</template>
