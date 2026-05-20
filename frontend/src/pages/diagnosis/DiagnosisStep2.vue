<script setup lang="ts">
import { computed } from 'vue'
import { Chip } from '@/components/ui/chip'
import type { DiagnosisFormState } from '@/stores/diagnosisForm'
import { symptomGroups } from './diagnosisOptions'

const props = defineProps<{
  form: DiagnosisFormState
}>()

const isChecked = (id: string) => props.form.symptoms.includes(id)

const toggle = (id: string, value: boolean) => {
  const set = new Set(props.form.symptoms)
  if (value) set.add(id)
  else set.delete(id)
  props.form.symptoms = Array.from(set)
}

const selectedCount = computed(() => props.form.symptoms.length)
</script>

<template>
  <section class="space-y-7" aria-labelledby="step-2-title">
    <header class="space-y-2">
      <h1 id="step-2-title" tabindex="-1" class="font-display text-[26px] leading-[1.15] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
        Qu'est-ce qui vous amène à consulter ?
      </h1>
      <p class="text-[15px] text-[var(--color-ink-2)]">
        Sélectionnez tous les symptômes que vous observez.
      </p>
      <p class="text-sm text-[var(--color-muted-strong)]" aria-live="polite">
        {{ selectedCount === 0 ? 'Aucun symptôme sélectionné' : `${selectedCount} symptôme${selectedCount > 1 ? 's' : ''} sélectionné${selectedCount > 1 ? 's' : ''}` }}
      </p>
    </header>

    <div id="symptoms-group" class="space-y-6">
      <fieldset
        v-for="group in symptomGroups"
        :key="group.id"
        class="space-y-3"
      >
        <legend class="text-sm font-medium text-[var(--color-ink-2)]">{{ group.label }}</legend>
        <div class="flex flex-wrap gap-2">
          <Chip
            v-for="option in group.options"
            :key="option.id"
            :model-value="isChecked(option.id)"
            role="checkbox"
            @update:model-value="(v) => toggle(option.id, v)"
          >
            {{ option.label }}
          </Chip>
        </div>
      </fieldset>

      <div class="space-y-2">
        <label for="symptoms-other" class="text-sm font-medium text-[var(--color-ink-2)]">
          Autre — précisez si besoin
        </label>
        <textarea
          id="symptoms-other"
          v-model="form.symptomOther"
          rows="3"
          class="w-full rounded-[var(--r-md)] border border-[var(--color-line-2)] bg-[var(--color-surface)] px-[14px] py-3 text-base text-[var(--color-ink)] placeholder:text-[var(--color-muted-strong)] outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:shadow-[var(--shadow-input-focus)]"
          placeholder="Ex : éruption sur les bras depuis ce matin"
        ></textarea>
      </div>
    </div>
  </section>
</template>
