import type { Client, PainHistoryPoint } from '../types'

export const SPORTS = ['Soccer', 'Cycle', 'Motorbike', 'Boxing', 'Tennis'] as const

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function painSeries(base: number, variance: number): PainHistoryPoint[] {
  const out: PainHistoryPoint[] = []
  for (let i = 6; i >= 0; i--) {
    const v = Math.min(
      10,
      Math.max(1, Math.round(base + (Math.random() - 0.5) * variance)),
    )
    out.push({ date: daysAgo(i), value: v })
  }
  return out
}

export function createInitialClients(): Client[] {
  return [
    {
      id: 'c1',
      name: 'Sarah Chen',
      age: 42,
      type: 'Business',
      ageGroup: 'Adult',
      sport: null,
      painLevel: 3,
      timeOfDay: 'Morning',
      swelling: 'No',
      location: ['Cervical', 'Lumbar'],
      internalExternal: 'Internal',
      headaches: 'No',
      steps: 6200,
      sleep: 6.5,
      heartRate: 72,
      lastUpdated: daysAgo(2),
      notes: 'Responds well to cognitive pacing strategies.',
      active: true,
      painHistory: painSeries(3, 2),
      cognitiveMetrics: null,
      cognitiveHistory: [],
    },
    {
      id: 'c2',
      name: 'Marcus Webb',
      age: 58,
      type: 'Business',
      ageGroup: 'Senior',
      sport: null,
      painLevel: 6,
      timeOfDay: 'Evening',
      swelling: 'Yes',
      location: ['Joint', 'Lumbar'],
      internalExternal: 'External',
      headaches: 'Yes',
      steps: 4100,
      sleep: 5.5,
      heartRate: 78,
      lastUpdated: daysAgo(5),
      notes: 'Monitor headache frequency; consider sleep hygiene module.',
      active: true,
      painHistory: painSeries(6, 3),
      cognitiveMetrics: null,
      cognitiveHistory: [],
    },
    {
      id: 'c3',
      name: 'Elena Rossi',
      age: 19,
      type: 'Athlete',
      ageGroup: 'Teen',
      sport: 'Soccer',
      painLevel: 8,
      timeOfDay: 'Evening',
      swelling: 'Yes',
      location: ['Ligament', 'Muscles'],
      internalExternal: 'External',
      headaches: 'No',
      steps: 12400,
      sleep: 7,
      heartRate: 58,
      lastUpdated: daysAgo(1),
      notes: 'ACL rehab phase; high load days correlate with pain spikes.',
      active: true,
      painHistory: painSeries(8, 2),
      cognitiveMetrics: null,
      cognitiveHistory: [],
    },
    {
      id: 'c4',
      name: 'James Okonkwo',
      age: 31,
      type: 'Athlete',
      ageGroup: 'Adult',
      sport: 'Boxing',
      painLevel: 5,
      timeOfDay: 'Morning',
      swelling: 'No',
      location: ['Dorsal', 'Muscles'],
      internalExternal: 'Internal',
      headaches: 'Yes',
      steps: 9800,
      sleep: 6,
      heartRate: 65,
      lastUpdated: daysAgo(3),
      notes: 'Focus on neck stabilization and visual tracking drills.',
      active: true,
      painHistory: painSeries(5, 2),
      cognitiveMetrics: null,
      cognitiveHistory: [],
    },
    {
      id: 'c5',
      name: 'Nina Patel',
      age: 27,
      type: 'Athlete',
      ageGroup: 'Adult',
      sport: 'Tennis',
      painLevel: 2,
      timeOfDay: 'Morning',
      swelling: 'No',
      location: ['Joint'],
      internalExternal: 'External',
      headaches: 'No',
      steps: 11200,
      sleep: 8,
      heartRate: 62,
      lastUpdated: daysAgo(0),
      notes: 'Maintenance phase; excellent adherence to home program.',
      active: true,
      painHistory: painSeries(2, 1),
      cognitiveMetrics: null,
      cognitiveHistory: [],
    },
  ]
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function painBadgeClass(level: number): string {
  const n = Number(level)
  if (n > 7) return 'bg-red-100 text-red-800 border-red-200'
  if (n >= 4) return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-emerald-100 text-emerald-800 border-emerald-200'
}

export function filterClients(
  clients: Client[],
  q: string,
  filterType: string,
  filterAge: string,
  filterSport: string,
): Client[] {
  const query = q.trim().toLowerCase()
  return clients.filter((c) => {
    if (filterType && c.type !== filterType) return false
    if (filterAge && c.ageGroup !== filterAge) return false
    if (filterSport && (c.sport || '') !== filterSport) return false
    if (!query) return true
    const hay = [c.name, c.type, c.sport || '', c.ageGroup]
      .join(' ')
      .toLowerCase()
    return hay.includes(query)
  })
}

export function dashboardStats(clients: Client[]) {
  const total = clients.length
  const active = clients.filter((c) => c.active).length
  const painSum = clients.reduce((s, c) => s + Number(c.painLevel), 0)
  const sleepSum = clients.reduce((s, c) => s + Number(c.sleep), 0)
  return {
    total,
    active,
    avgPain: total ? (painSum / total).toFixed(1) : '—',
    avgSleep: total ? (sleepSum / total).toFixed(1) : '—',
  }
}

export function sportsInUse(clients: Client[]): string[] {
  const used = new Set(
    clients.map((c) => c.sport).filter(Boolean) as string[],
  )
  return SPORTS.filter((s) => used.has(s))
}
