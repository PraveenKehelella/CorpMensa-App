import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { PainTrendChart } from './PainTrendChart'
import { CognitiveTrendChart } from './CognitiveTrendChart'
import type { Client } from '../types'
import { formatDate } from '../lib/clients'

interface ClientDetailModalProps {
  client: Client | null
  open: boolean
  onClose: () => void
  /** If true, show edit form expanded on open */
  startInEditMode?: boolean
  onSaveClient: (id: string, patch: Partial<Client>) => void
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
      <span className="text-xs text-slate-500">{label}</span>
      <p className="font-medium text-slate-900">{value}</p>
    </div>
  )
}

export function ClientDetailModal({
  client,
  open,
  onClose,
  startInEditMode,
  onSaveClient,
}: ClientDetailModalProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [edPain, setEdPain] = useState('')
  const [edSleep, setEdSleep] = useState('')
  const [edHR, setEdHR] = useState('')
  const [chartTab, setChartTab] = useState<'pain' | 'cognitive'>('pain')

  useEffect(() => {
    if (!client) return
    setNotes(client.notes || '')
    setEdPain(String(client.painLevel))
    setEdSleep(String(client.sleep))
    setEdHR(String(client.heartRate))
    setEditOpen(!!startInEditMode)
    setChartTab('pain')
  }, [client, startInEditMode, open])

  if (!client) return null

  const c = client

  const loc = Array.isArray(c.location)
    ? c.location.join(', ')
    : c.location || '—'

  function handleSaveMetrics(e: React.FormEvent) {
    e.preventDefault()
    const p = parseInt(edPain, 10)
    const sl = parseFloat(edSleep)
    const hr = parseInt(edHR, 10)
    if (Number.isNaN(p) || p < 1 || p > 10) return
    if (Number.isNaN(sl) || sl < 0 || sl > 24) return
    if (Number.isNaN(hr) || hr < 30 || hr > 220) return

    const patch: Partial<Client> = {
      painLevel: p,
      sleep: sl,
      heartRate: hr,
      lastUpdated: new Date().toISOString(),
    }
    if (p !== c.painLevel) {
      const history = [...(c.painHistory || [])]
      history.push({ date: new Date().toISOString(), value: p })
      patch.painHistory = history
    }
    onSaveClient(c.id, patch)
    setEditOpen(false)
  }

  function handleSaveNotes() {
    onSaveClient(c.id, {
      notes,
      lastUpdated: new Date().toISOString(),
    })
  }

  return (
    <Modal open={open} title={c.name} onClose={onClose} size="lg">
      <div className="p-6 space-y-6">
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <ProfileRow label="Age" value={String(c.age)} />
          <ProfileRow label="Type" value={c.type} />
          <ProfileRow label="Age group" value={c.ageGroup} />
          <ProfileRow
            label="Sport"
            value={c.type === 'Athlete' && c.sport ? c.sport : '—'}
          />
          <ProfileRow label="Time of day" value={c.timeOfDay} />
          <ProfileRow label="Swelling" value={c.swelling} />
          <ProfileRow label="Pain locations" value={loc} />
          <ProfileRow label="Internal / External" value={c.internalExternal} />
          <ProfileRow label="Headaches" value={c.headaches} />
        </div>

        <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">
              {chartTab === 'pain' ? 'Pain trend' : 'Cognitive performance trend'}
            </h3>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setChartTab('pain')}
                className={`px-3 py-1 text-xs font-medium rounded-md ${
                  chartTab === 'pain' ? 'bg-medical-600 text-white' : 'text-slate-600'
                }`}
              >
                Pain
              </button>
              <button
                type="button"
                onClick={() => setChartTab('cognitive')}
                className={`px-3 py-1 text-xs font-medium rounded-md ${
                  chartTab === 'cognitive' ? 'bg-medical-600 text-white' : 'text-slate-600'
                }`}
              >
                Cognitive
              </button>
            </div>
          </div>
          {chartTab === 'pain' ? (
            <PainTrendChart
              key={c.id + c.painHistory.length}
              history={
                c.painHistory?.length
                  ? c.painHistory
                  : [{ date: new Date().toISOString(), value: c.painLevel }]
              }
            />
          ) : c.cognitiveHistory?.length ? (
            <CognitiveTrendChart history={c.cognitiveHistory} />
          ) : (
            <div className="h-56 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-sm text-slate-500">
              No cognitive sessions recorded yet.
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Cognitive metrics</h3>
          {c.cognitiveMetrics ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-center">
                <p className="text-xs text-slate-500">Last session</p>
                <p className="text-sm font-semibold text-slate-900">{formatDate(c.cognitiveMetrics.lastSession)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-center">
                <p className="text-xs text-slate-500">Accuracy</p>
                <p className="text-lg font-semibold text-slate-900">{c.cognitiveMetrics.accuracy.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-center">
                <p className="text-xs text-slate-500">Reaction</p>
                <p className="text-lg font-semibold text-slate-900">{Math.round(c.cognitiveMetrics.reactionTime)}ms</p>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-center">
                <p className="text-xs text-slate-500">Memory</p>
                <p className="text-lg font-semibold text-slate-900">{c.cognitiveMetrics.memoryScore}</p>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-center">
                <p className="text-xs text-slate-500">Proc. speed</p>
                <p className="text-lg font-semibold text-slate-900">{c.cognitiveMetrics.processingSpeed}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No cognitive metrics yet.</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Measurements</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-center">
              <p className="text-xs text-slate-500">Steps</p>
              <p className="text-lg font-semibold text-slate-900">{c.steps}</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-center">
              <p className="text-xs text-slate-500">Sleep</p>
              <p className="text-lg font-semibold text-slate-900">{c.sleep}h</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-center">
              <p className="text-xs text-slate-500">Heart rate</p>
              <p className="text-lg font-semibold text-slate-900">{c.heartRate}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-4 space-y-4 bg-medical-50/30">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Update metrics</h3>
            <button
              type="button"
              onClick={() => setEditOpen((v) => !v)}
              className="text-sm font-medium text-medical-700 hover:text-medical-800"
            >
              {editOpen ? 'Cancel' : 'Edit'}
            </button>
          </div>
          {editOpen && (
            <form onSubmit={handleSaveMetrics} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="edPain">
                    Pain level
                  </label>
                  <input
                    id="edPain"
                    type="number"
                    min={1}
                    max={10}
                    value={edPain}
                    onChange={(e) => setEdPain(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-medical-600/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="edSleep">
                    Sleep (hours)
                  </label>
                  <input
                    id="edSleep"
                    type="number"
                    min={0}
                    max={24}
                    step={0.5}
                    value={edSleep}
                    onChange={(e) => setEdSleep(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-medical-600/20"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="edHR">
                    Heart rate (bpm)
                  </label>
                  <input
                    id="edHR"
                    type="number"
                    min={30}
                    max={220}
                    value={edHR}
                    onChange={(e) => setEdHR(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-medical-600/20"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-medical-600 text-white text-sm font-medium hover:bg-medical-700"
              >
                Save changes
              </button>
            </form>
          )}
        </div>

        <div>
          <label htmlFor="detailNotes" className="block text-sm font-semibold text-slate-800 mb-2">
            Clinical notes
          </label>
          <textarea
            id="detailNotes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-medical-600/20 focus:border-medical-600 outline-none resize-y"
            placeholder="Session notes, observations…"
          />
          <button
            type="button"
            onClick={handleSaveNotes}
            className="mt-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Save notes
          </button>
        </div>

        <p className="text-xs text-slate-400">Last updated: {formatDate(c.lastUpdated)}</p>
      </div>
    </Modal>
  )
}
