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

export interface Client {
  id: string
  name: string
  age: number
  type: ClientType
  ageGroup: AgeGroup
  sport: Sport | null
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
}
