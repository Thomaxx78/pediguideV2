/**
 * Pediguide parent flow — option lists.
 * Copy taken verbatim from the Claude Design handoff bundle (Parent flow).
 */

export type Option = { id: string, label: string }
export type SymptomGroup = { id: string, label: string, options: Option[] }

export const symptomGroups: SymptomGroup[] = [
  {
    id: 'general',
    label: 'Général',
    options: [
      { id: 'sym-fever', label: 'Fièvre' },
      { id: 'sym-fatigue', label: 'Fatigue inhabituelle' },
      { id: 'sym-appetite', label: "Perte d'appétit" },
      { id: 'sym-irritability', label: 'Pleurs / irritabilité' },
      { id: 'sym-sleep', label: 'Trouble du sommeil' },
    ],
  },
  {
    id: 'respiratory',
    label: 'Respiratoire',
    options: [
      { id: 'sym-cough', label: 'Toux' },
      { id: 'sym-runny-nose', label: 'Nez qui coule' },
      { id: 'sym-sore-throat', label: 'Mal de gorge' },
      { id: 'sym-breathing', label: 'Difficulté à respirer' },
      { id: 'sym-wheeze', label: 'Sifflement' },
    ],
  },
  {
    id: 'digestive',
    label: 'Digestif',
    options: [
      { id: 'sym-vomiting', label: 'Vomissements' },
      { id: 'sym-diarrhea', label: 'Diarrhée' },
      { id: 'sym-belly', label: 'Mal au ventre' },
      { id: 'sym-refuse-drink', label: 'Refuse de boire' },
      { id: 'sym-constipation', label: 'Constipation' },
    ],
  },
  {
    id: 'skin-ent',
    label: 'Peau & ORL',
    options: [
      { id: 'sym-rash', label: 'Éruption / boutons' },
      { id: 'sym-itching', label: 'Démangeaisons' },
      { id: 'sym-ear', label: "Mal d'oreille" },
      { id: 'sym-eye', label: 'Œil rouge ou collé' },
    ],
  },
]

export const allSymptoms: Option[] = symptomGroups.flatMap((g) => g.options)

export const symptomLabelById = Object.fromEntries(allSymptoms.map((s) => [s.id, s.label]))

export const timelineOptions: Option[] = [
  { id: 'time-lt1h', label: "Moins d'une heure" },
  { id: 'time-today', label: "Aujourd'hui" },
  { id: 'time-yesterday', label: 'Hier' },
  { id: 'time-2-3d', label: '2 à 3 jours' },
  { id: 'time-week', label: 'Cette semaine' },
  { id: 'time-gt-week', label: "Plus d'une semaine" },
]

export const timelineLabelById = Object.fromEntries(timelineOptions.map((t) => [t.id, t.label]))

export const allergyOptions: Option[] = [
  { id: 'allergy-peanut', label: 'Arachide' },
  { id: 'allergy-milk', label: 'Lait de vache' },
  { id: 'allergy-egg', label: 'Œuf' },
  { id: 'allergy-nuts', label: 'Fruits à coque' },
  { id: 'allergy-fish', label: 'Poisson' },
  { id: 'allergy-penicillin', label: 'Pénicilline' },
  { id: 'allergy-pollen', label: 'Pollen' },
  { id: 'allergy-mites', label: 'Acariens' },
]

export const antecedentOptions: Option[] = [
  { id: 'antec-asthma', label: 'Asthme' },
  { id: 'antec-eczema', label: 'Eczéma' },
  { id: 'antec-food-allergy', label: 'Allergie alimentaire' },
  { id: 'antec-diabetes', label: 'Diabète' },
  { id: 'antec-seizures', label: 'Convulsions fébriles' },
  { id: 'antec-heart', label: 'Cardiopathie' },
  { id: 'antec-preterm', label: 'Prématurité' },
]

export const genderOptions = [
  { value: 'fille', label: 'Fille' },
  { value: 'garcon', label: 'Garçon' },
  { value: 'autre', label: 'Autre' },
] as const

export const vaccinationsOptions = [
  { value: 'oui', label: 'Oui' },
  { value: 'non', label: 'Non' },
  { value: 'sais-pas', label: 'Je ne sais pas' },
] as const
