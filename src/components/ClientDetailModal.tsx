import { useEffect, useRef, useState } from 'react'
import { Modal } from './Modal'
import { PainTrendChart } from './PainTrendChart'
import { CognitiveTrendChart } from './CognitiveTrendChart'
import { VitalSignsChart } from './VitalSignsChart'
import type { Client, VitalSignsPoint } from '../types'
import { formatDate } from '../lib/clients'
import { extractVitalsFromImage } from '../lib/api'

interface ClientDetailModalProps {
  client: Client | null
  open: boolean
  onClose: () => void
  /** If true, show edit form expanded on open */
  startInEditMode?: boolean
  onSaveClient: (id: string, patch: Partial<Client>) => void
  onDeleteClient: (id: string) => void
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
  onDeleteClient,
}: ClientDetailModalProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [edPain, setEdPain] = useState('')
  const [edSleep, setEdSleep] = useState('')
  const [edHR, setEdHR] = useState('')
  const [chartTab, setChartTab] = useState<'pain' | 'cognitive'>('pain')
  const [extractingVitals, setExtractingVitals] = useState(false)
  const [vitalsError, setVitalsError] = useState('')
  const [vitalsMessage, setVitalsMessage] = useState('')
  const [confirmVitalsOpen, setConfirmVitalsOpen] = useState(false)
  const [pendingVitalsPoints, setPendingVitalsPoints] = useState<VitalSignsPoint[]>([])
  const [pendingVitalsOverview, setPendingVitalsOverview] = useState('')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!client) return
    setNotes(client.notes || '')
    setEdPain(String(client.painLevel))
    setEdSleep(String(client.sleep))
    setEdHR(String(client.heartRate))
    setEditOpen(!!startInEditMode)
    setChartTab('pain')
    setExtractingVitals(false)
    setVitalsError('')
    setVitalsMessage('')
    setConfirmVitalsOpen(false)
    setPendingVitalsPoints([])
    setPendingVitalsOverview('')
    setConfirmDeleteOpen(false)
    setDeleteText('')
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
      vitalSignsHistory: [
        ...(c.vitalSignsHistory || []),
        {
          date: new Date().toISOString(),
          heartRate: hr,
          systolic: c.bloodPressureSystolic,
          diastolic: c.bloodPressureDiastolic,
        },
      ],
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

  function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Failed to read image file'))
      reader.readAsDataURL(file)
    })
  }

  async function handleVitalsUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setVitalsError('')
    setVitalsMessage('')
    setExtractingVitals(true)

    try {
      const dataUrl = await readAsDataUrl(file)
      const imageBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
      const extracted = await extractVitalsFromImage(imageBase64, {
        id: c.id,
        name: c.name,
        age: c.age,
        type: c.type,
        sport: c.sport,
        ageGroup: c.ageGroup,
        painLevel: c.painLevel,
        sleep: c.sleep,
        heartRate: c.heartRate,
        bloodPressureSystolic: c.bloodPressureSystolic,
        bloodPressureDiastolic: c.bloodPressureDiastolic,
        notes: c.notes,
        recentVitals: (c.vitalSignsHistory || []).slice(-5),
      })
      const validPoints: VitalSignsPoint[] = (extracted.points || [])
        .map((point, index) => {
          const hasHeartRate =
            typeof point.heartRate === 'number' && point.heartRate >= 30 && point.heartRate <= 220
          const hasBloodPressure =
            typeof point.systolic === 'number' && typeof point.diastolic === 'number'
          if (!hasHeartRate && !hasBloodPressure) return null

          return {
            date: point.capturedAt || new Date(Date.now() + index * 1000).toISOString(),
            heartRate: hasHeartRate ? Number(point.heartRate) : c.heartRate,
            systolic: hasBloodPressure ? Number(point.systolic) : c.bloodPressureSystolic,
            diastolic: hasBloodPressure ? Number(point.diastolic) : c.bloodPressureDiastolic,
          }
        })
        .filter((point): point is VitalSignsPoint => point !== null)

      if (validPoints.length === 0) {
        setVitalsError('No valid vital signs were detected in this image.')
        return
      }

      const sortedPoints = [...validPoints].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )
      setPendingVitalsPoints(sortedPoints)
      setPendingVitalsOverview((extracted.overview || '').trim())
      setConfirmVitalsOpen(true)
      setVitalsMessage(`Extracted ${sortedPoints.length} data points. Please confirm.`)
    } catch (err) {
      setVitalsError(err instanceof Error ? err.message : 'Unable to extract vital signs.')
    } finally {
      setExtractingVitals(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleConfirmVitals() {
    if (!pendingVitalsPoints.length) return
    const latestPoint = pendingVitalsPoints[pendingVitalsPoints.length - 1] as VitalSignsPoint
    const patch: Partial<Client> = {
      heartRate: latestPoint.heartRate,
      bloodPressureSystolic: latestPoint.systolic,
      bloodPressureDiastolic: latestPoint.diastolic,
      vitalsOverview: pendingVitalsOverview || c.vitalsOverview || '',
      lastUpdated: new Date().toISOString(),
      vitalSignsHistory: [...(c.vitalSignsHistory || []), ...pendingVitalsPoints],
    }
    setEdHR(String(latestPoint.heartRate))
    onSaveClient(c.id, patch)
    setConfirmVitalsOpen(false)
    setPendingVitalsPoints([])
    setPendingVitalsOverview('')
    setVitalsMessage(`Saved ${pendingVitalsPoints.length} vital sign data points.`)
  }

  function handleCancelVitalsConfirm() {
    setConfirmVitalsOpen(false)
    setPendingVitalsPoints([])
    setPendingVitalsOverview('')
    setVitalsMessage('Extraction canceled. No data was saved.')
  }

  function handleRequestDelete() {
    setDeleteText('')
    setConfirmDeleteOpen(true)
  }

  function handleConfirmDelete() {
    if (deleteText.trim().toLowerCase() !== 'delete') return
    setConfirmDeleteOpen(false)
    onDeleteClient(c.id)
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
          <ProfileRow
            label="Oculomotor dominance"
            value={
              c.oculomotorDominance
                ? `${c.oculomotorDominance.dominantEye} eye — ${c.oculomotorDominance.fixationStability}`
                : '—'
            }
          />
          <ProfileRow
            label="Sensory dominance"
            value={
              c.sensoryDominance
                ? `${c.sensoryDominance.dominantEye} eye, suppression ${c.sensoryDominance.suppression}, rivalry ${c.sensoryDominance.rivalryResponse}`
                : '—'
            }
          />
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
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
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-center">
              <p className="text-xs text-slate-500">Blood pressure</p>
              <p className="text-lg font-semibold text-slate-900">
                {c.bloodPressureSystolic && c.bloodPressureDiastolic
                  ? `${c.bloodPressureSystolic}/${c.bloodPressureDiastolic}`
                  : '—'}
              </p>
            </div>
          </div>
          {(c.vitalSignsHistory?.length || 0) > 1 ? (
            <div className="mt-4 rounded-xl border border-slate-200 p-3 bg-white">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Vital signs trend
              </p>
              <VitalSignsChart history={c.vitalSignsHistory} />
              <div className="mt-3">
                <p className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  Medical overview
                </p>
                <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap break-words">
                  {c.vitalsOverview ||
                    'Upload a vital signs screenshot to generate a brief personalized interpretation.'}
                </div>
              </div>
            </div>
          ) : null}
          <div className="mt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleVitalsUpload}
              className="hidden"
              id="vitalsUploadInput"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={extractingVitals}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {extractingVitals ? 'Extracting vitals...' : 'Upload Vital Signs'}
            </button>
            {vitalsMessage ? (
              <p className="mt-2 text-xs text-emerald-700">{vitalsMessage}</p>
            ) : null}
            {vitalsError ? (
              <p className="mt-2 text-xs text-red-600">{vitalsError}</p>
            ) : null}
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
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleRequestDelete}
            className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50"
          >
            Delete client
          </button>
        </div>
      </div>
      <Modal
        open={confirmVitalsOpen}
        title="Confirm extracted vital signs"
        onClose={handleCancelVitalsConfirm}
        size="md"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Review the extracted values before saving to this client profile.
          </p>
          <div className="max-h-64 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 font-semibold">Date/Time</th>
                  <th className="px-3 py-2 font-semibold">Blood pressure</th>
                  <th className="px-3 py-2 font-semibold">Heart rate</th>
                </tr>
              </thead>
              <tbody>
                {pendingVitalsPoints.map((point) => (
                  <tr key={`${point.date}-${point.heartRate}-${point.systolic ?? 'n'}-${point.diastolic ?? 'n'}`} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 text-slate-700">
                      {new Date(point.date).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {point.systolic && point.diastolic ? `${point.systolic}/${point.diastolic}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{point.heartRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <label
              htmlFor="pendingOverview"
              className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1"
            >
              Generated medical overview
            </label>
            <textarea
              id="pendingOverview"
              value={pendingVitalsOverview || 'No overview generated.'}
              onChange={(e) => setPendingVitalsOverview(e.target.value)}
              className="w-full min-h-[72px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 resize-y"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelVitalsConfirm}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmVitals}
              className="px-4 py-2 rounded-lg bg-medical-600 text-white text-sm font-medium hover:bg-medical-700"
            >
              Confirm and save
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        open={confirmDeleteOpen}
        title="Delete client"
        onClose={() => setConfirmDeleteOpen(false)}
        size="md"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Type <span className="font-semibold text-slate-900">delete</span> to permanently remove this client.
          </p>
          <input
            type="text"
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder="Type delete"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleteText.trim().toLowerCase() !== 'delete'}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </Modal>
  )
}
