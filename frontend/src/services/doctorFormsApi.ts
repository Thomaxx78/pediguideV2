import api from '@/services/api'

export interface AiSynthesis {
  motif_principal: string
  symptomes_cles: string[]
  duree_evolution: string
  niveau_inquietude_parent: 'faible' | 'modéré' | 'élevé'
  actions_deja_prises: string[]
  points_attention: string[]
  niveau_priorite: 'non_urgent' | 'a_surveiller' | 'urgent'
  resume_message_libre: string | null
  disclaimer: string
}

export interface AiSynthesisVersion {
  id: string
  diagnosisId: string
  version: number
  synthesis: AiSynthesis
  model: string
  promptVersion: string
  generatedByDoctorId?: string | null
  createdAt: string
}

/**
 * Raw row shape returned by the backend. Pediguide had a legacy parent-flow
 * schema (childLastName, consultationReason, behaviorChanges, clinicalSigns,
 * duration, worryLevel, actionsTaken) that the v2 redesign replaced with a
 * wider one (weight, height, gender, symptoms[], symptomTimeline, ...).
 * Legacy fields stay nullable so old records still parse.
 */
export interface DiagnosisRecord {
  id: string
  createdAt: string

  // Identity (some legacy fields nullable now)
  childFirstName: string | null
  childLastName: string | null
  childBirthDate: string | null

  // Legacy parent-flow fields
  consultationReason?: string | null
  behaviorChanges?: string[] | null
  clinicalSigns?: string[] | null
  duration?: string | null
  worryLevel?: string | null
  actionsTaken?: string[] | null
  additionalNotes?: string | null

  // New Pediguide redesign fields
  weight?: string | null
  height?: string | null
  gender?: string | null
  symptoms?: string[] | null
  symptomOther?: string | null
  symptomTimeline?: Record<string, string> | null
  symptomSeverity?: Record<string, number> | null
  allergies?: string[] | null
  noAllergies?: boolean | null
  treatments?: string | null
  antecedents?: string[] | null
  noAntecedents?: boolean | null
  vaccinations?: string | null
  worry?: string | null
  photoName?: string | null

  status?: string | null
  aiSynthesis?: AiSynthesis | null
  aiSynthesisVersions?: AiSynthesisVersion[]
  triageLevel?: TriageLevel | null
  formTemplateId?: string | null
  customAnswers?: Record<string, string | string[]> | null
}

export type TriageLevel = 'rouge' | 'orange' | 'jaune' | 'vert'

export interface DoctorFormSummary {
  id: string
  patientFirstName: string
  patientLastName: string
  consultationReason: string
  submittedAt: string
  status: string
  /** Convenience pull from aiSynthesis.niveau_priorite so the dashboard can render a dot. */
  aiPriority: 'non_urgent' | 'a_surveiller' | 'urgent' | null
  triageLevel: TriageLevel | null
}

export interface DoctorFormDetail extends DoctorFormSummary {
  childBirthDate: string

  // Legacy fields
  behaviorChanges: string[]
  clinicalSigns: string[]
  duration: string
  worryLevel: string
  actionsTaken: string[]
  additionalNotes: string

  // New parent-flow fields
  weight: string
  height: string
  gender: string
  symptoms: string[]
  symptomOther: string
  symptomTimeline: Record<string, string>
  symptomSeverity: Record<string, number>
  allergies: string[]
  noAllergies: boolean
  treatments: string
  antecedents: string[]
  noAntecedents: boolean
  vaccinations: string
  worry: string
  photoName: string

  aiSynthesis: AiSynthesis | null
  aiSynthesisVersions: AiSynthesisVersion[]
  /**
   * True if this record was submitted via the legacy parent flow (no new
   * fields populated). Used to choose which render path the detail page uses.
   */
  isLegacy: boolean
  customAnswers: Record<string, string | string[]> | null
}

export interface DoctorFormsListParams {
  search?: string
}

const normalizeText = (value: string) =>
  value
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

const safeArray = <T>(value?: T[] | null): T[] => (Array.isArray(value) ? value : [])
const safeRecord = <V>(value?: Record<string, V> | null): Record<string, V> =>
  value && typeof value === 'object' ? value : {}
const clean = (value?: string | null): string => (!value || value === 'N/A' ? '' : value)

/**
 * A record is "legacy" if none of the new parent-flow fields are populated.
 * We detect by checking the v2 fields, not the legacy ones, since some legacy
 * records have empty arrays in the new columns.
 */
const isLegacyRecord = (record: DiagnosisRecord): boolean => {
  const hasNewFields =
    Boolean(record.weight) ||
    Boolean(record.gender) ||
    safeArray(record.symptoms).length > 0 ||
    Object.keys(safeRecord(record.symptomTimeline)).length > 0
  return !hasNewFields
}

const toSummary = (record: DiagnosisRecord): DoctorFormSummary => ({
  id: record.id,
  patientFirstName: clean(record.childFirstName),
  patientLastName: clean(record.childLastName),
  consultationReason: clean(record.consultationReason) || clean(record.worry),
  submittedAt: record.createdAt,
  status: record.status ?? 'new',
  aiPriority: record.aiSynthesis?.niveau_priorite ?? null,
  triageLevel: record.triageLevel ?? null,
})

const toDetail = (record: DiagnosisRecord): DoctorFormDetail => ({
  ...toSummary(record),
  childBirthDate: clean(record.childBirthDate),

  behaviorChanges: safeArray(record.behaviorChanges),
  clinicalSigns: safeArray(record.clinicalSigns),
  duration: clean(record.duration),
  worryLevel: clean(record.worryLevel),
  actionsTaken: safeArray(record.actionsTaken),
  additionalNotes: clean(record.additionalNotes),

  weight: record.weight ?? '',
  height: record.height ?? '',
  gender: record.gender ?? '',
  symptoms: safeArray(record.symptoms),
  symptomOther: record.symptomOther ?? '',
  symptomTimeline: safeRecord(record.symptomTimeline),
  symptomSeverity: safeRecord(record.symptomSeverity),
  allergies: safeArray(record.allergies),
  noAllergies: Boolean(record.noAllergies),
  treatments: record.treatments ?? '',
  antecedents: safeArray(record.antecedents),
  noAntecedents: Boolean(record.noAntecedents),
  vaccinations: record.vaccinations ?? '',
  worry: record.worry ?? '',
  photoName: record.photoName ?? '',

  aiSynthesis: record.aiSynthesis ?? null,
  aiSynthesisVersions: record.aiSynthesisVersions ?? [],
  isLegacy: isLegacyRecord(record),
  customAnswers: record.customAnswers ?? null,
})

const matchesSearch = (record: DiagnosisRecord, search: string) => {
  if (!search) return true
  const normalized = normalizeText(search)
  const fields = [
    record.childFirstName ?? '',
    record.childLastName ?? '',
    record.consultationReason ?? '',
    record.worry ?? '',
    record.id,
  ]
  return fields.some((field) => normalizeText(field).includes(normalized))
}

export const doctorFormsApi = {
  async list(params: DoctorFormsListParams = {}): Promise<DoctorFormSummary[]> {
    const data = (await api.diagnosis.list()) as DiagnosisRecord[]
    const search = params.search?.trim() ?? ''

    return data
      .filter((record) => matchesSearch(record, search))
      .map(toSummary)
  },

  async get(id: string): Promise<DoctorFormDetail> {
    const record = (await api.diagnosis.get(id)) as DiagnosisRecord
    return toDetail(record)
  },

  async synthesize(id: string): Promise<AiSynthesis> {
    const data = (await api.diagnosis.synthesize(id)) as { synthesis: AiSynthesis }
    return data.synthesis
  },
}

export default doctorFormsApi
