import type { Client, OculomotorDominanceResult, SensoryDominanceResult } from '../types'

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) || 'http://127.0.0.1:8000/api'
const VITALS_API = `${API_BASE}/vitals/extract/`
const ONBOARDING_VOICE_API = `${API_BASE}/onboarding/voice-tests/`
const ONBOARDING_VOICE_PROFILE_API = `${API_BASE}/onboarding/voice-profile/`

export interface ExtractedVitalPoint {
  heartRate: number | null
  systolic: number | null
  diastolic: number | null
  capturedAt: string | null
}

export interface ExtractedVitals {
  points: ExtractedVitalPoint[]
  overview: string
}

export async function fetchClients(): Promise<Client[]> {
  const res = await fetch(`${API_BASE}/clients/`)
  if (!res.ok) throw new Error('Failed to fetch clients')
  const list = (await res.json()) as Client[]
  return list.map((c) => ({
    ...c,
    profile: c.profile ?? {
      photo: null,
      height: '',
      weight: '',
      visceralFat: '',
      painNotes: '',
      problems: [],
      goals: [],
      posture: [],
      cognitiveAbilities: [],
      neuralDevelopment: '',
      senseAbilities: '',
      visualAbilities: '',
      physicalAbilities: [],
    },
    oculomotorDominance: c.oculomotorDominance ?? null,
    sensoryDominance: c.sensoryDominance ?? null,
  }))
}

export async function createClient(client: Client): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  })
  if (!res.ok) throw new Error('Failed to create client')
  return res.json()
}

export async function updateClient(id: string, patch: Partial<Client>): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('Failed to update client')
  return res.json()
}

export async function deleteClient(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/clients/${id}/`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete client')
}

export interface OnboardingVoiceTestsResponse {
  transcript: string
  oculomotor: OculomotorDominanceResult
  sensory: SensoryDominanceResult
}

export interface OnboardingVoiceProfileFields {
  name: string
  age: string
  height: string
  weight: string
  visceralFat: string
  pain: string
  type: 'Business' | 'Athlete'
  sport: string
  problems: string[]
  goals: string[]
  posture: string[]
  cognitiveAbilities: string[]
  neuralDevelopment: string
  senseAbilities: string
  visualAbilities: string
  physicalAbilities: string[]
}

export async function submitOnboardingVoiceProfile(
  audio: Blob,
): Promise<{ transcript: string; profile: OnboardingVoiceProfileFields }> {
  const form = new FormData()
  const ext = audio.type.includes('webm') ? 'webm' : audio.type.includes('wav') ? 'wav' : 'webm'
  form.append('audio', audio, `recording.${ext}`)

  const res = await fetch(ONBOARDING_VOICE_PROFILE_API, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    const message = await res.text()
    throw new Error(message || 'Voice profile transcription failed')
  }

  return res.json()
}

export async function submitOnboardingVoiceTests(audio: Blob): Promise<OnboardingVoiceTestsResponse> {
  const form = new FormData()
  const ext = audio.type.includes('webm') ? 'webm' : audio.type.includes('wav') ? 'wav' : 'webm'
  form.append('audio', audio, `recording.${ext}`)

  const res = await fetch(ONBOARDING_VOICE_API, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    const message = await res.text()
    throw new Error(message || 'Voice transcription failed')
  }

  return res.json()
}

export async function extractVitalsFromImage(
  imageBase64: string,
  clientContext: Record<string, unknown>,
): Promise<ExtractedVitals> {
  const res = await fetch(VITALS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, clientContext }),
  })

  if (!res.ok) {
    const message = await res.text()
    throw new Error(message || 'Failed to extract vital signs')
  }

  return res.json()
}
