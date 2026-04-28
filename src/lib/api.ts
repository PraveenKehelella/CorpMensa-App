import type { Client } from '../types'

const API_BASE = 'http://127.0.0.1:8000/api'
const VITALS_API = `${API_BASE}/vitals/extract/`

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
  return res.json()
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
