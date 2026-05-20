<script setup lang="ts">
import { computed } from 'vue'
import { Chip } from '@/components/ui/chip'
import { SeveritySlider } from '@/components/ui/severity-slider'
import type { DiagnosisFormState } from '@/stores/diagnosisForm'
import { symptomLabelById, timelineOptions } from './diagnosisOptions'

const props = defineProps<{
  form: DiagnosisFormState
}>()

const selectedSymptoms = computed(() => {
  const ids = props.form.symptoms
  return ids
    .map((id) => ({ id, label: symptomLabelById[id] ?? id }))
    .filter((s) => Boolean(s.label))
})

const hasOther = computed(() => props.form.symptomOther.trim().length > 0)

const setTimeline = (symptomId: string, timelineId: string) => {
  if (props.form.symptomTimeline[symptomId] === timelineId) return
  props.form.symptomTimeline = { ...props.form.symptomTimeline, [symptomId]: timelineId }
}

const setSeverity = (symptomId: string, value: number) => {
  if (props.form.symptomSeverity[symptomId] === value) return
  props.form.symptomSeverity = { ...props.form.symptomSeverity, [symptomId]: value }
}

const severityFor = (symptomId: string) => props.form.symptomSeverity[symptomId] ?? 0
const timelineFor = (symptomId: string) => props.form.symptomTimeline[symptomId] ?? ''
</script>

<template>
  <section class="space-y-7" aria-labelledby="step-3-title">
    <header class="space-y-2">
      <h1 id="step-3-title" tabindex="-1" class="font-display text-[26px] leading-[1.15] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
        Depuis quand et à quel point ?
      </h1>
      <p class="text-[15px] text-[var(--color-ink-2)]">
        Pour chaque symptôme, indiquez quand il a commencé et son intensité actuelle.
      </p>
    </header>

    <div
      v-if="selectedSymptoms.length === 0 && !hasOther"
      class="rounded-[var(--r-md)] border border-[var(--color-line)] bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-ink-2)]"
    >
      Aucun symptôme sélectionné. Revenez à l'étape précédente pour en cocher au moins un.
    </div>

    <div v-else class="space-y-5">
      <article
        v-for="symptom in selectedSymptoms"
        :key="symptom.id"
        class="rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 space-y-5"
      >
        <header class="flex items-baseline justify-between">
          <h2 class="font-display text-lg font-medium tracking-[-0.01em] text-[var(--color-ink)]">
            {{ symptom.label }}
          </h2>
        </header>

        <!-- Timeline chips -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-[var(--color-ink-2)]">Depuis quand&nbsp;?</p>
          <div role="radiogroup" :aria-label="`Depuis quand pour ${symptom.label}`" class="flex flex-wrap gap-2">
            <Chip
              v-for="option in timelineOptions"
              :key="option.id"
              :model-value="timelineFor(symptom.id) === option.id"
              role="radio"
              @update:model-value="() => setTimeline(symptom.id, option.id)"
            >
              {{ option.label }}
            </Chip>
          </div>
        </div>

        <!-- Severity slider -->
        <SeveritySlider
          :model-value="severityFor(symptom.id)"
          :label="`Intensité actuelle (${symptom.label})`"
          @update:model-value="(v) => setSeverity(symptom.id, v)"
        />
      </article>

      <div
        v-if="hasOther"
        class="rounded-[var(--r-lg)] border border-dashed border-[var(--color-line-2)] bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-ink-2)]"
      >
        Vous avez ajouté un autre symptôme&nbsp;: «&nbsp;{{ form.symptomOther }}&nbsp;».
        Vous pourrez en parler plus en détail lors de la consultation.
      </div>
    </div>
  </section>
</template>
