export type ClientType = 'Business' | 'Athlete'
export type AgeGroup = 'Teen' | 'Adult' | 'Senior'
export type Sport =
  | 'Soccer'
  | 'Cycle'
  | 'Motorbike'
  | 'Boxing'
  | 'Tennis'

export interface PainHistoryPoint {
  date: string
  value: number
}

export interface CognitiveMetrics {
  lastSession: string
  reactionTime: number
  accuracy: number
  memoryScore: number
  processingSpeed: number
}

export interface CognitiveSessionPoint {
  date: string
  score: number
  accuracy: number
  reactionTime: number
  memoryScore: number
  processingSpeed: number
}

export interface GameResult {
  score: number
  accuracy: number
  avgReactionTime: number
  maxSequence: number
  completionTime: number
}

export interface VitalSignsPoint {
  date: string
  heartRate: number
  systolic: number | null
  diastolic: number | null
}

/** Oculomotor dominance (motor alignment) — alternate cover / pointing test */
export interface OculomotorDominanceResult {
  dominantEye: 'left' | 'right'
  fixationStability: string
}

/** Sensory dominance — rivalry / blur / Worth 4 Dot */
export interface SensoryDominanceResult {
  dominantEye: 'left' | 'right'
  suppression: 'present' | 'absent'
  rivalryResponse: 'stable' | 'alternating'
}

/** Extended onboarding / profile fields */
export interface ClientProfile {
  photo: string | null
  height: string
  weight: string
  visceralFat: string
  painNotes: string
  problems: string[]
  goals: string[]
  posture: string[]
  cognitiveAbilities: string[]
  neuralDevelopment: string
  senseAbilities: string
  visualAbilities: string
  physicalAbilities: string[]
}

export interface Client {
  id: string
  name: string
  age: number
  type: ClientType
  ageGroup: AgeGroup
  sport: Sport | null
  profile: ClientProfile
  painLevel: number
  timeOfDay: string
  swelling: string
  location: string[]
  internalExternal: string
  headaches: string
  steps: number
  sleep: number
  heartRate: number
  bloodPressureSystolic: number | null
  bloodPressureDiastolic: number | null
  vitalsOverview: string
  lastUpdated: string
  notes: string
  active: boolean
  painHistory: PainHistoryPoint[]
  vitalSignsHistory: VitalSignsPoint[]
  cognitiveMetrics: CognitiveMetrics | null
  cognitiveHistory: CognitiveSessionPoint[]
  oculomotorDominance: OculomotorDominanceResult | null
  sensoryDominance: SensoryDominanceResult | null
}
