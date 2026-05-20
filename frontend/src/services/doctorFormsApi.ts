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

export interface DiagnosisRecord {
  id: string
  createdAt: string
  childFirstName: string
  childLastName: string
  childBirthDate: string
  consultationReason: string
  behaviorChanges?: string[] | null
  clinicalSigns?: string[] | null
  duration: string
  worryLevel: string
  actionsTaken?: string[] | null
  additionalNotes?: string | null
  status?: string | null
  aiSynthesis?: AiSynthesis | null
  aiSynthesisVersions?: AiSynthesisVersion[]
}

export interface DoctorFormSummary {
  id: string
  patientFirstName: string
  patientLastName: string
  consultationReason: string
  submittedAt: string
  status: string
}

export interface DoctorFormDetail extends DoctorFormSummary {
  childBirthDate: string
  behaviorChanges: string[]
  clinicalSigns: string[]
  duration: string
  worryLevel: string
  actionsTaken: string[]
  additionalNotes: string
  aiSynthesis: AiSynthesis | null
  aiSynthesisVersions: AiSynthesisVersion[]
}

export interface DoctorFormsListParams {
  search?: string
}

const normalizeText = (value: string) =>
  value
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const safeArray = (value?: string[] | null) => (Array.isArray(value) ? value : [])

const toSummary = (record: DiagnosisRecord): DoctorFormSummary => ({
  id: record.id,
  patientFirstName: record.childFirstName,
  patientLastName: record.childLastName,
  consultationReason: record.consultationReason,
  submittedAt: record.createdAt,
  status: record.status ?? 'new',
})

const toDetail = (record: DiagnosisRecord): DoctorFormDetail => ({
  ...toSummary(record),
  childBirthDate: record.childBirthDate,
  behaviorChanges: safeArray(record.behaviorChanges),
  clinicalSigns: safeArray(record.clinicalSigns),
  duration: record.duration,
  worryLevel: record.worryLevel,
  actionsTaken: safeArray(record.actionsTaken),
  additionalNotes: record.additionalNotes ?? '',
  aiSynthesis: record.aiSynthesis ?? null,
  aiSynthesisVersions: record.aiSynthesisVersions ?? [],
})

const matchesSearch = (record: DiagnosisRecord, search: string) => {
  if (!search) return true
  const normalized = normalizeText(search)
  const fields = [
    record.childFirstName,
    record.childLastName,
    record.consultationReason,
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
