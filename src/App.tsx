import { useEffect, useMemo, useState } from 'react'
import { OnboardingModal } from './components/OnboardingModal'
import { ClientDetailModal } from './components/ClientDetailModal'
import { CognitiveGamesModal } from './components/cognitive/CognitiveGamesModal'
import type { Client, GameResult } from './types'
import {
  createInitialClients,
  dashboardStats,
  filterClients,
  formatDate,
  painBadgeClass,
  sportsInUse,
} from './lib/clients'
import { createClient, fetchClients, updateClient } from './lib/api'

export default function App() {
  const [clients, setClients] = useState<Client[]>(() => createInitialClients())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterAge, setFilterAge] = useState('')
  const [filterSport, setFilterSport] = useState('')
  const [onboardOpen, setOnboardOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailStartEdit, setDetailStartEdit] = useState(false)
  const [cognitiveOpen, setCognitiveOpen] = useState(false)

  const sportOptions = useMemo(() => sportsInUse(clients), [clients])

  const filtered = useMemo(
    () => filterClients(clients, search, filterType, filterAge, filterSport),
    [clients, search, filterType, filterAge, filterSport],
  )

  const stats = useMemo(() => dashboardStats(clients), [clients])

  const detailClient = useMemo(
    () => (detailId ? clients.find((c) => c.id === detailId) ?? null : null),
    [clients, detailId],
  )

  useEffect(() => {
    let mounted = true
    fetchClients()
      .then((data) => {
        if (!mounted) return
        if (Array.isArray(data) && data.length > 0) {
          setClients(data)
        }
      })
      .catch(() => {
        // Keep local defaults if backend is unavailable or empty.
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  function openDetail(id: string, withEdit: boolean) {
    setDetailId(id)
    setDetailStartEdit(withEdit)
  }

  function closeDetail() {
    setDetailId(null)
    setDetailStartEdit(false)
  }

  async function handleAddClient(client: Client) {
    setClients((prev) => [...prev, client])
    try {
      const saved = await createClient(client)
      setClients((prev) => prev.map((c) => (c.id === client.id ? saved : c)))
    } catch {
      // Leave optimistic local state.
    }
  }

  async function handleSaveClient(id: string, patch: Partial<Client>) {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        return { ...c, ...patch }
      }),
    )
    try {
      const saved = await updateClient(id, patch)
      setClients((prev) => prev.map((c) => (c.id === id ? saved : c)))
    } catch {
      // Keep optimistic local state.
    }
  }

  async function handleSaveCognitiveResult(id: string, result: GameResult) {
    const now = new Date().toISOString()
    const processingSpeed =
      result.completionTime > 0 ? Math.round((result.score / result.completionTime) * 100) : 0
    let patch: Partial<Client> = {}
    setClients((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              cognitiveMetrics: {
                lastSession: now,
                reactionTime: result.avgReactionTime || c.cognitiveMetrics?.reactionTime || 0,
                accuracy: result.accuracy,
                memoryScore: result.maxSequence || result.score,
                processingSpeed,
              },
              cognitiveHistory: [
                ...(c.cognitiveHistory || []),
                {
                  date: now,
                  score: result.score,
                  accuracy: result.accuracy,
                  reactionTime: result.avgReactionTime || 0,
                  memoryScore: result.maxSequence || result.score,
                  processingSpeed,
                },
              ],
              lastUpdated: now,
            }
          : c,
      ),
    )
    const current = clients.find((c) => c.id === id)
    if (current) {
      patch = {
        cognitiveMetrics: {
          lastSession: now,
          reactionTime: result.avgReactionTime || current.cognitiveMetrics?.reactionTime || 0,
          accuracy: result.accuracy,
          memoryScore: result.maxSequence || result.score,
          processingSpeed,
        },
        cognitiveHistory: [
          ...(current.cognitiveHistory || []),
          {
            date: now,
            score: result.score,
            accuracy: result.accuracy,
            reactionTime: result.avgReactionTime || 0,
            memoryScore: result.maxSequence || result.score,
            processingSpeed,
          },
        ],
        lastUpdated: now,
      }
      try {
        const saved = await updateClient(id, patch)
        setClients((prev) => prev.map((c) => (c.id === id ? saved : c)))
      } catch {
        // Keep optimistic local state.
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-medical-600 flex items-center justify-center text-white shadow-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                Neurocognitive Therapy
              </h1>
              <p className="text-xs text-slate-500">Clinical dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCognitiveOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-medical-200 bg-medical-50 text-medical-700 text-sm font-medium hover:bg-medical-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3v2.25M14.25 3v2.25M3.75 9.75h16.5M4.5 6.75h15a.75.75 0 01.75.75v11.25a.75.75 0 01-.75.75h-15a.75.75 0 01-.75-.75V7.5a.75.75 0 01.75-.75z" />
              </svg>
              Start Cognitive Session
            </button>
            <button
              type="button"
              onClick={() => setOnboardOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-medical-600 text-white text-sm font-medium hover:bg-medical-700 shadow-sm transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New client
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <p className="mb-4 text-sm text-slate-500">Loading client data from backend...</p>
        )}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-slate-500">Total clients</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-slate-500">Active clients</p>
              <p className="mt-2 text-3xl font-bold text-medical-700">{stats.active}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-slate-500">Avg. pain level</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.avgPain}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-slate-500">Avg. sleep (hrs)</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.avgSleep}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-end gap-4">
              <div className="flex-1">
                <label
                  htmlFor="searchInput"
                  className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2"
                >
                  Search
                </label>
                <div className="relative">
                  <svg
                    className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    id="searchInput"
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name, classification, sport…"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-medical-600/20 focus:border-medical-600 outline-none text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[520px]">
                <div>
                  <label htmlFor="filterType" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Type
                  </label>
                  <select
                    id="filterType"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-medical-600/20 focus:border-medical-600 outline-none"
                  >
                    <option value="">All types</option>
                    <option value="Business">Business</option>
                    <option value="Athlete">Athlete</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="filterAge" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Age group
                  </label>
                  <select
                    id="filterAge"
                    value={filterAge}
                    onChange={(e) => setFilterAge(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-medical-600/20 focus:border-medical-600 outline-none"
                  >
                    <option value="">All groups</option>
                    <option value="Teen">Teen</option>
                    <option value="Adult">Adult</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="filterSport" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Sport
                  </label>
                  <select
                    id="filterSport"
                    value={sportOptions.includes(filterSport) ? filterSport : ''}
                    onChange={(e) => setFilterSport(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-medical-600/20 focus:border-medical-600 outline-none"
                  >
                    <option value="">All sports</option>
                    {sportOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 font-semibold">Name</th>
                    <th className="px-4 sm:px-6 py-3 font-semibold">Classification</th>
                    <th className="px-4 sm:px-6 py-3 font-semibold">Age group</th>
                    <th className="px-4 sm:px-6 py-3 font-semibold">Sport</th>
                    <th className="px-4 sm:px-6 py-3 font-semibold">Pain</th>
                    <th className="px-4 sm:px-6 py-3 font-semibold">Last updated</th>
                    <th className="px-4 sm:px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((c) => {
                    const badge = painBadgeClass(c.painLevel)
                    const sportCell = c.type === 'Athlete' && c.sport ? c.sport : '—'
                    return (
                      <tr key={c.id} className="hover:bg-medical-50/80 transition-colors">
                        <td className="px-4 sm:px-6 py-3 font-medium text-slate-900">{c.name}</td>
                        <td className="px-4 sm:px-6 py-3 text-slate-600">{c.type}</td>
                        <td className="px-4 sm:px-6 py-3 text-slate-600">{c.ageGroup}</td>
                        <td className="px-4 sm:px-6 py-3 text-slate-600">{sportCell}</td>
                        <td className="px-4 sm:px-6 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge}`}
                          >
                            {c.painLevel}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-slate-600 whitespace-nowrap">
                          {formatDate(c.lastUpdated)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openDetail(c.id, false)}
                            className="text-medical-700 hover:text-medical-900 text-sm font-medium"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openDetail(c.id, true)}
                            className="text-slate-600 hover:text-slate-900 text-sm font-medium"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <p className="px-6 py-12 text-center text-slate-500 text-sm">
                No clients match your filters.
              </p>
            )}
          </div>
        </section>
      </main>

      <OnboardingModal
        open={onboardOpen}
        onClose={() => setOnboardOpen(false)}
        onAdd={(c) => {
          handleAddClient(c)
          setOnboardOpen(false)
        }}
      />

      <ClientDetailModal
        client={detailClient}
        open={detailId !== null && detailClient !== null}
        startInEditMode={detailStartEdit}
        onClose={closeDetail}
        onSaveClient={handleSaveClient}
      />
      <CognitiveGamesModal
        open={cognitiveOpen}
        clients={clients}
        onClose={() => setCognitiveOpen(false)}
        onSaveResult={handleSaveCognitiveResult}
      />
    </div>
  )
}
