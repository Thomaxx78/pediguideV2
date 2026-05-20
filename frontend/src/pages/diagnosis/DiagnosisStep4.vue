<script setup lang="ts">
import { computed } from 'vue'
import { Chip } from '@/components/ui/chip'
import { Segmented } from '@/components/ui/segmented'
import type { DiagnosisFormState } from '@/stores/diagnosisForm'
import { allergyOptions, antecedentOptions, vaccinationsOptions } from './diagnosisOptions'

const props = defineProps<{
  form: DiagnosisFormState
}>()

const isAllergyChecked = (id: string) => props.form.allergies.includes(id)
const toggleAllergy = (id: string, value: boolean) => {
  if (props.form.noAllergies) return
  const set = new Set(props.form.allergies)
  if (value) set.add(id)
  else set.delete(id)
  props.form.allergies = Array.from(set)
}

const isAntecedentChecked = (id: string) => props.form.antecedents.includes(id)
const toggleAntecedent = (id: string, value: boolean) => {
  if (props.form.noAntecedents) return
  const set = new Set(props.form.antecedents)
  if (value) set.add(id)
  else set.delete(id)
  props.form.antecedents = Array.from(set)
}

const onToggleNoAllergies = (event: Event) => {
  const checked = (event.target as HTMLInputElement).checked
  props.form.noAllergies = checked
  if (checked) props.form.allergies = []
}

const onToggleNoAntecedents = (event: Event) => {
  const checked = (event.target as HTMLInputElement).checked
  props.form.noAntecedents = checked
  if (checked) props.form.antecedents = []
}

const onVaccinationsChange = (value: string) => {
  props.form.vaccinations = value as DiagnosisFormState['vaccinations']
}

const allergyChipsDisabled = computed(() => props.form.noAllergies)
const antecedentChipsDisabled = computed(() => props.form.noAntecedents)
</script>

<template>
  <section class="space-y-7" aria-labelledby="step-4-title">
    <header class="space-y-2">
      <h1 id="step-4-title" tabindex="-1" class="font-display text-[26px] leading-[1.15] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
        Antécédents et allergies
      </h1>
      <p class="text-[15px] text-[var(--color-ink-2)]">
        Ces informations permettent au professionnel de santé d'éviter certaines erreurs.
      </p>
    </header>

    <!-- Allergies -->
    <div class="space-y-3">
      <p class="text-sm font-medium text-[var(--color-ink-2)]">Allergies connues</p>
      <div id="allergies-group" class="flex flex-wrap gap-2" :class="{ 'opacity-50 pointer-events-none': allergyChipsDisabled }">
        <Chip
          v-for="option in allergyOptions"
          :key="option.id"
          :model-value="isAllergyChecked(option.id)"
          :disabled="allergyChipsDisabled"
          role="checkbox"
          @update:model-value="(v) => toggleAllergy(option.id, v)"
        >
          {{ option.label }}
        </Chip>
      </div>
      <label class="inline-flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          :checked="form.noAllergies"
          class="size-4 rounded border-[var(--color-line-2)] accent-primary"
          @change="onToggleNoAllergies"
        />
        <span class="text-sm text-[var(--color-ink-2)]">Aucune allergie connue</span>
      </label>
    </div>

    <!-- Treatments -->
    <div class="space-y-2">
      <label for="treatments" class="text-sm font-medium text-[var(--color-ink-2)]">
        Traitements en cours
      </label>
      <textarea
        id="treatments"
        v-model="form.treatments"
        rows="3"
        class="w-full rounded-[var(--r-md)] border border-[var(--color-line-2)] bg-[var(--color-surface)] px-[14px] py-3 text-base text-[var(--color-ink)] placeholder:text-[var(--color-muted-strong)] outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:shadow-[var(--shadow-input-focus)]"
        placeholder="Ex : Doliprane 150mg ce matin"
      ></textarea>
    </div>

    <!-- Antécédents -->
    <div class="space-y-3">
      <p class="text-sm font-medium text-[var(--color-ink-2)]">Antécédents médicaux</p>
      <div id="antecedents-group" class="flex flex-wrap gap-2" :class="{ 'opacity-50 pointer-events-none': antecedentChipsDisabled }">
        <Chip
          v-for="option in antecedentOptions"
          :key="option.id"
          :model-value="isAntecedentChecked(option.id)"
          :disabled="antecedentChipsDisabled"
          role="checkbox"
          @update:model-value="(v) => toggleAntecedent(option.id, v)"
        >
          {{ option.label }}
        </Chip>
      </div>
      <label class="inline-flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          :checked="form.noAntecedents"
          class="size-4 rounded border-[var(--color-line-2)] accent-primary"
          @change="onToggleNoAntecedents"
        />
        <span class="text-sm text-[var(--color-ink-2)]">Aucun antécédent particulier</span>
      </label>
    </div>

    <!-- Vaccinations -->
    <div id="vaccinations" class="space-y-2">
      <p class="text-sm font-medium text-[var(--color-ink-2)]">
        Vaccinations à jour&nbsp;?
      </p>
      <Segmented
        :model-value="form.vaccinations"
        :options="[...vaccinationsOptions]"
        aria-label="Vaccinations à jour"
        @update:model-value="onVaccinationsChange"
      />
    </div>
  </section>
</template>
