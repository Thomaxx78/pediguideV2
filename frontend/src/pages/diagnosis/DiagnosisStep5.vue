<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DiagnosisFormState } from '@/stores/diagnosisForm'

const props = defineProps<{
  form: DiagnosisFormState
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

const hasPhoto = computed(() => Boolean(props.form.photoName))

const openFilePicker = () => {
  fileInputRef.value?.click()
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  // UI-only for v1: we only record the filename, no upload to backend.
  props.form.photoName = file.name
}

const clearPhoto = () => {
  props.form.photoName = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}
</script>

<template>
  <section class="space-y-7" aria-labelledby="step-5-title">
    <header class="space-y-2">
      <h1 id="step-5-title" tabindex="-1" class="font-display text-[26px] leading-[1.15] font-medium tracking-[-0.02em] text-[var(--color-ink)]">
        Autre chose à signaler ?
      </h1>
      <p class="text-[15px] text-[var(--color-ink-2)]">
        Décrivez ce qui vous inquiète le plus, ajoutez une photo si utile.
      </p>
    </header>

    <!-- Worry -->
    <div class="space-y-2">
      <label for="worry" class="text-sm font-medium text-[var(--color-ink-2)]">
        Ce qui vous inquiète le plus
      </label>
      <textarea
        id="worry"
        v-model="form.worry"
        rows="3"
        class="w-full rounded-[var(--r-md)] border border-[var(--color-line-2)] bg-[var(--color-surface)] px-[14px] py-3 text-base text-[var(--color-ink)] placeholder:text-[var(--color-muted-strong)] outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:shadow-[var(--shadow-input-focus)]"
        placeholder="Ex : il n'a pas mangé depuis hier soir"
      ></textarea>
    </div>

    <!-- Photo upload (UI-only) -->
    <div class="space-y-2">
      <p class="text-sm font-medium text-[var(--color-ink-2)]">Photo (optionnel)</p>
      <div
        v-if="!hasPhoto"
        class="flex flex-col items-center gap-3 rounded-[var(--r-md)] border-2 border-dashed border-[var(--color-line-2)] bg-[var(--color-surface-2)] px-4 py-6 text-center"
      >
        <span class="inline-flex size-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-primary">
          <svg viewBox="0 0 20 20" class="size-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="6" width="14" height="10" rx="2" />
            <path d="M8 6V4h4v2" />
            <circle cx="10" cy="11" r="2.5" />
          </svg>
        </span>
        <button
          type="button"
          class="font-medium text-primary text-sm hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 rounded"
          @click="openFilePicker"
        >
          Ajouter une photo
        </button>
        <p class="text-xs text-[var(--color-muted-strong)]">PNG ou JPG, 10 Mo max</p>
      </div>
      <div
        v-else
        class="flex items-center justify-between rounded-[var(--r-md)] border border-[var(--color-line-2)] bg-[var(--color-surface)] px-4 py-3"
      >
        <span class="inline-flex items-center gap-2 text-sm text-[var(--color-ink)]">
          <span class="inline-flex size-7 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-primary">
            <svg viewBox="0 0 16 16" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 8.5l3.5 3.5L13 5" />
            </svg>
          </span>
          <span class="truncate max-w-[200px]">{{ form.photoName }}</span>
        </span>
        <button
          type="button"
          class="text-sm font-medium text-[var(--color-muted-strong)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 rounded"
          @click="clearPhoto"
        >
          Retirer
        </button>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        accept="image/png,image/jpeg"
        class="sr-only"
        @change="onFileChange"
      />
    </div>

    <!-- Additional notes -->
    <div class="space-y-2">
      <label for="additional-notes" class="text-sm font-medium text-[var(--color-ink-2)]">
        Autre contexte utile
      </label>
      <textarea
        id="additional-notes"
        v-model="form.additionalNotes"
        rows="3"
        class="w-full rounded-[var(--r-md)] border border-[var(--color-line-2)] bg-[var(--color-surface)] px-[14px] py-3 text-base text-[var(--color-ink)] placeholder:text-[var(--color-muted-strong)] outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:shadow-[var(--shadow-input-focus)]"
        placeholder="Ex : voyage récent, contact avec une personne malade…"
      ></textarea>
    </div>
  </section>
</template>
