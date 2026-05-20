/**
 * Shared id → French-label dictionaries for the Pediguide diagnosis form.
 *
 * The parent flow stores chip selections by id (e.g. `sym-fever`, `allergy-peanut`).
 * The doctor side needs to render the human-readable labels. These maps are also
 * mirrored in `backend/src/routes/diagnosis.ts` for the PDF export — keep both
 * in sync when adding new options.
 */

import {
  allergyOptions,
  antecedentOptions,
  genderOptions,
  symptomLabelById as parentSymptomLabelById,
  timelineLabelById as parentTimelineLabelById,
  vaccinationsOptions,
} from '@/pages/diagnosis/diagnosisOptions'

export const symptomLabelById: Record<string, string> = parentSymptomLabelById
export const timelineLabelById: Record<string, string> = parentTimelineLabelById

export const allergyLabelById: Record<string, string> = Object.fromEntries(
  allergyOptions.map((o) => [o.id, o.label]),
)

export const antecedentLabelById: Record<string, string> = Object.fromEntries(
  antecedentOptions.map((o) => [o.id, o.label]),
)

export const genderLabelByValue: Record<string, string> = Object.fromEntries(
  genderOptions.map((o) => [o.value, o.label]),
)

export const vaccinationsLabelByValue: Record<string, string> = Object.fromEntries(
  vaccinationsOptions.map((o) => [o.value, o.label]),
)

/**
 * Look up a label for an id; falls back to the id if unknown (defensive).
 */
export const labelFor = (dict: Record<string, string>, id: string | null | undefined): string => {
  if (!id) return ''
  return dict[id] ?? id
}

/**
 * Map an array of ids to their labels. Filters out empty strings.
 */
export const labelsFor = (dict: Record<string, string>, ids: string[] | null | undefined): string[] => {
  if (!ids || ids.length === 0) return []
  return ids.map((id) => labelFor(dict, id)).filter(Boolean)
}
