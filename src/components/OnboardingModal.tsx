import { useEffect, useRef, useState } from 'react'
import { Modal } from './Modal'
import type { Client, ClientType, Sport } from '../types'
import { submitOnboardingVoiceTests } from '../lib/api'

const LOCATIONS = [
  'Joint',
  'Muscles',
  'Ligament',
  'Dorsal',
  'Lumbar',
  'Cervical',
] as const

const TOTAL_STEPS = 4
const STEP_TITLES = ['Basic info', 'Client type', 'Health assessment', 'Binocular test results']

function ageToGroup(age: number): Client['ageGroup'] {
  if (age < 20) return 'Teen'
  if (age < 60) return 'Adult'
  return 'Senior'
}

interface OnboardingModalProps {
  open: boolean
  onClose: () => void
  onAdd: (client: Client) => void
}

const initialForm = () => ({
  name: '',
  age: '',
  type: '' as ClientType | '',
  sport: 'Soccer' as Sport,
  painLevel: 5,
  timeOfDay: 'Morning' as 'Morning' | 'Evening',
  swelling: 'No' as 'Yes' | 'No',
  locations: [] as string[],
  internalExternal: 'Internal' as 'Internal' | 'External',
  headaches: 'No' as 'Yes' | 'No',
  oculomotorEye: '' as '' | 'left' | 'right',
  oculomotorFixation: '',
  sensoryEye: '' as '' | 'left' | 'right',
  sensorySuppression: '' as '' | 'present' | 'absent',
  sensoryRivalry: '' as '' | 'stable' | 'alternating',
})

function VoiceListeningAnimation({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div className="flex flex-col items-center gap-3 py-4" aria-live="polite">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="voice-listen-ring absolute inset-0 rounded-full bg-medical-600/25" />
        <div
          className="voice-listen-ring absolute inset-1 rounded-full bg-medical-600/35"
          style={{ animationDelay: '0.15s' }}
        />
        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-medical-600 text-white shadow-md">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
      </div>
      <div className="flex h-8 items-end justify-center gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="voice-listen-bar w-1.5 rounded-full bg-medical-600"
            style={{
              height: '60%',
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>
      <p className="text-xs font-medium text-medical-700">Listening… speak your test results</p>
    </div>
  )
}

export function OnboardingModal({ open, onClose, onAdd }: OnboardingModalProps) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [stepError, setStepError] = useState('')
  const [recording, setRecording] = useState(false)
  const [voiceProcessing, setVoiceProcessing] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const [lastTranscript, setLastTranscript] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  useEffect(() => {
    if (!open) {
      mediaRecorderRef.current?.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      return
    }
    setStep(1)
    setForm(initialForm())
    setStepError('')
    setRecording(false)
    setVoiceProcessing(false)
    setVoiceError('')
    setLastTranscript('')
  }, [open])

  function validateStep(s: number): boolean {
    setStepError('')
    const f = form
    if (s === 1) {
      if (!f.name.trim()) {
        setStepError('Please enter a name.')
        return false
      }
      const age = Number(f.age)
      if (!f.age || age < 1 || age > 120) {
        setStepError('Please enter a valid age (1–120).')
        return false
      }
    }
    if (s === 2) {
      if (!f.type) {
        setStepError('Please select a client type.')
        return false
      }
      if (f.type === 'Athlete' && !f.sport) {
        setStepError('Please select a sport.')
        return false
      }
    }
    if (s === 3) {
      if (!f.timeOfDay) {
        setStepError('Please select time of day.')
        return false
      }
      if (!f.swelling) {
        setStepError('Please indicate swelling.')
        return false
      }
      if (!f.headaches) {
        setStepError('Please indicate headaches.')
        return false
      }
    }
    if (s === 4) {
      if (!f.oculomotorEye) {
        setStepError('Select dominant eye (oculomotor) or use voice input.')
        return false
      }
      if (!f.oculomotorFixation.trim()) {
        setStepError('Enter fixation stability (oculomotor) or use voice input.')
        return false
      }
      if (!f.sensoryEye) {
        setStepError('Select dominant eye (sensory) or use voice input.')
        return false
      }
      if (!f.sensorySuppression) {
        setStepError('Select suppression (sensory) or use voice input.')
        return false
      }
      if (!f.sensoryRivalry) {
        setStepError('Select rivalry response (sensory) or use voice input.')
        return false
      }
    }
    return true
  }

  async function handleToggleVoice() {
    if (voiceProcessing) return
    if (recording) {
      mediaRecorderRef.current?.stop()
      return
    }
    setVoiceError('')
    setLastTranscript('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        setRecording(false)
        const blobType = mr.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: blobType })
        if (blob.size < 200) {
          setVoiceError('Recording too short. Try again.')
          return
        }
        setVoiceProcessing(true)
        try {
          const data = await submitOnboardingVoiceTests(blob)
          setLastTranscript(data.transcript)
          setForm((prev) => ({
            ...prev,
            oculomotorEye: data.oculomotor.dominantEye,
            oculomotorFixation: data.oculomotor.fixationStability,
            sensoryEye: data.sensory.dominantEye,
            sensorySuppression: data.sensory.suppression,
            sensoryRivalry: data.sensory.rivalryResponse,
          }))
        } catch (e) {
          setVoiceError(e instanceof Error ? e.message : 'Transcription failed')
        } finally {
          setVoiceProcessing(false)
        }
      }
      mediaRecorderRef.current = mr
      mr.start(200)
      setRecording(true)
    } catch {
      setVoiceError('Microphone access denied or unavailable.')
    }
  }

  function handleNext() {
    if (!validateStep(step)) return
    setStep((s) => Math.min(TOTAL_STEPS, s + 1))
  }

  function handleBack() {
    setStepError('')
    setStep((s) => Math.max(1, s - 1))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateStep(step)) return
    const ocuEye = form.oculomotorEye as 'left' | 'right'
    const senEye = form.sensoryEye as 'left' | 'right'
    const senSup = form.sensorySuppression as 'present' | 'absent'
    const senRiv = form.sensoryRivalry as 'stable' | 'alternating'
    const now = new Date().toISOString()
    const pain = form.painLevel
    const ageNumber = Number(form.age)
    const defaultSteps = 0
    const defaultSleep = 0
    const defaultHr = 72
    const newClient: Client = {
      id: 'c' + Date.now(),
      name: form.name.trim(),
      age: ageNumber,
      type: form.type as ClientType,
      ageGroup: ageToGroup(ageNumber),
      sport: form.type === 'Athlete' ? form.sport : null,
      painLevel: pain,
      timeOfDay: form.timeOfDay as string,
      swelling: form.swelling as string,
      location: form.locations.length ? form.locations : ['—'],
      internalExternal: form.internalExternal,
      headaches: form.headaches as string,
      steps: defaultSteps,
      sleep: defaultSleep,
      heartRate: defaultHr,
      bloodPressureSystolic: null,
      bloodPressureDiastolic: null,
      vitalsOverview: '',
      lastUpdated: now,
      notes: '',
      active: true,
      painHistory: [{ date: now, value: pain }],
      vitalSignsHistory: [
        {
          date: now,
          heartRate: defaultHr,
          systolic: null,
          diastolic: null,
        },
      ],
      cognitiveMetrics: null,
      cognitiveHistory: [],
      oculomotorDominance: {
        dominantEye: ocuEye,
        fixationStability: form.oculomotorFixation.trim(),
      },
      sensoryDominance: {
        dominantEye: senEye,
        suppression: senSup,
        rivalryResponse: senRiv,
      },
    }
    onAdd(newClient)
  }

  function toggleLocation(loc: string) {
    setForm((f) => ({
      ...f,
      locations: f.locations.includes(loc)
        ? f.locations.filter((x) => x !== loc)
        : [...f.locations, loc],
    }))
  }

  const progress = (step / TOTAL_STEPS) * 100
  const listeningUi = recording || voiceProcessing

  return (
    <Modal open={open} title="Client onboarding" onClose={onClose} size={step === 4 ? 'lg' : 'md'}>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-medical-700">
              Step {step} of {TOTAL_STEPS}
            </p>
            <p className="text-xs text-slate-500">{STEP_TITLES[step - 1]}</p>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-medical-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {stepError && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {stepError}
          </p>
        )}

        {step === 1 && (
          <fieldset className="space-y-4 border-0 p-0 m-0">
            <legend className="text-sm font-semibold text-medical-700">Basic info</legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="obName">
                  Name
                </label>
                <input
                  id="obName"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-medical-600/20 focus:border-medical-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="obAge">
                  Age
                </label>
                <input
                  id="obAge"
                  type="number"
                  min={1}
                  max={120}
                  value={form.age}
                  onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-medical-600/20 focus:border-medical-600 outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Age group is assigned automatically from age (Teen / Adult / Senior).
            </p>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="space-y-4 border-0 p-0 m-0">
            <legend className="text-sm font-semibold text-medical-700">Client type</legend>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="type"
                  checked={form.type === 'Business'}
                  onChange={() => setForm((f) => ({ ...f, type: 'Business' }))}
                  className="text-medical-600"
                />
                Business client
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="type"
                  checked={form.type === 'Athlete'}
                  onChange={() => setForm((f) => ({ ...f, type: 'Athlete' }))}
                  className="text-medical-600"
                />
                Athlete
              </label>
            </div>
            {form.type === 'Athlete' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="obSport">
                  Sport type
                </label>
                <select
                  id="obSport"
                  value={form.sport}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sport: e.target.value as Sport }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-medical-600/20 focus:border-medical-600 outline-none"
                >
                  <option value="Soccer">Soccer</option>
                  <option value="Cycle">Bike rider — Cycle</option>
                  <option value="Motorbike">Bike rider — Motorbike</option>
                  <option value="Boxing">Boxing</option>
                  <option value="Tennis">Tennis</option>
                </select>
              </div>
            )}
          </fieldset>
        )}

        {step === 3 && (
          <fieldset className="space-y-4 border-0 p-0 m-0">
            <legend className="text-sm font-semibold text-medical-700">Health assessment</legend>
            <div>
              <label className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                <span>Pain level</span>
                <span className="text-medical-700">{form.painLevel}</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={form.painLevel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, painLevel: Number(e.target.value) }))
                }
                className="w-full accent-medical-600"
              />
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-600 mb-2">Time of day</span>
              <div className="flex gap-4">
                {(['Morning', 'Evening'] as const).map((t) => (
                  <label key={t} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="timeOfDay"
                      checked={form.timeOfDay === t}
                      onChange={() => setForm((f) => ({ ...f, timeOfDay: t }))}
                      className="text-medical-600"
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-600 mb-2">Swelling</span>
              <div className="flex gap-4">
                {(['Yes', 'No'] as const).map((v) => (
                  <label key={v} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="swelling"
                      checked={form.swelling === v}
                      onChange={() => setForm((f) => ({ ...f, swelling: v }))}
                      className="text-medical-600"
                    />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-600 mb-2">Pain location</span>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                {LOCATIONS.map((loc) => (
                  <label key={loc} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.locations.includes(loc)}
                      onChange={() => toggleLocation(loc)}
                      className="rounded text-medical-600"
                    />
                    {loc}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="obIntExt">
                Internal vs external
              </label>
              <select
                id="obIntExt"
                value={form.internalExternal}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    internalExternal: e.target.value as 'Internal' | 'External',
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-medical-600/20 focus:border-medical-600 outline-none"
              >
                <option value="Internal">Internal</option>
                <option value="External">External</option>
              </select>
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-600 mb-2">Headaches</span>
              <div className="flex gap-4">
                {(['Yes', 'No'] as const).map((v) => (
                  <label key={v} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="headaches"
                      checked={form.headaches === v}
                      onChange={() => setForm((f) => ({ ...f, headaches: v }))}
                      className="text-medical-600"
                    />
                    {v}
                  </label>
                ))}
              </div>
            </div>
          </fieldset>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <p className="text-sm text-slate-600">
              Record a short voice summary of both tests, or enter results manually below.
            </p>

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              {voiceProcessing ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-medical-600 border-t-transparent" />
                  <p className="text-sm font-medium text-slate-700">Transcribing and filling fields…</p>
                </div>
              ) : (
                <>
                  <VoiceListeningAnimation active={recording} />
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleToggleVoice}
                      disabled={voiceProcessing}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        recording
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-medical-600 text-white hover:bg-medical-700'
                      } disabled:opacity-50`}
                    >
                      {recording ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                          </span>
                          Stop & process
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                            />
                          </svg>
                          Start voice input
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
              {voiceError ? (
                <p className="mt-3 text-center text-xs text-red-600">{voiceError}</p>
              ) : null}
              {lastTranscript && !voiceProcessing ? (
                <p className="mt-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-600">Transcript:</span> {lastTranscript}
                </p>
              ) : null}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4 m-0">
                <legend className="text-sm font-semibold text-medical-800 px-1">
                  Oculomotor dominance
                </legend>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Determines the dominant eye for motor alignment (alternate cover test or pointing test).
                  Record which eye maintains fixation more consistently.
                </p>
                <div>
                  <span className="block text-xs font-medium text-slate-600 mb-2">Dominant eye</span>
                  <div className="flex gap-4">
                    {(['left', 'right'] as const).map((eye) => (
                      <label key={eye} className="inline-flex items-center gap-2 text-sm capitalize">
                        <input
                          type="radio"
                          name="oculomotorEye"
                          checked={form.oculomotorEye === eye}
                          onChange={() => setForm((f) => ({ ...f, oculomotorEye: eye }))}
                          className="text-medical-600"
                        />
                        {eye}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="obOcuFix">
                    Fixation stability (qualitative)
                  </label>
                  <input
                    id="obOcuFix"
                    value={form.oculomotorFixation}
                    onChange={(e) => setForm((f) => ({ ...f, oculomotorFixation: e.target.value }))}
                    placeholder="e.g. Stable, mild drift…"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-medical-600/20 focus:border-medical-600 outline-none"
                  />
                </div>
              </fieldset>

              <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4 m-0">
                <legend className="text-sm font-semibold text-medical-800 px-1">Sensory dominance</legend>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sensory dominance (binocular rivalry, +1.50D blur, or Worth 4 Dot). Note suppression and
                  whether rivalry is stable or alternating.
                </p>
                <div>
                  <span className="block text-xs font-medium text-slate-600 mb-2">Dominant eye</span>
                  <div className="flex gap-4">
                    {(['left', 'right'] as const).map((eye) => (
                      <label key={eye} className="inline-flex items-center gap-2 text-sm capitalize">
                        <input
                          type="radio"
                          name="sensoryEye"
                          checked={form.sensoryEye === eye}
                          onChange={() => setForm((f) => ({ ...f, sensoryEye: eye }))}
                          className="text-medical-600"
                        />
                        {eye}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-600 mb-2">Suppression</span>
                  <div className="flex gap-4">
                    {(['present', 'absent'] as const).map((v) => (
                      <label key={v} className="inline-flex items-center gap-2 text-sm capitalize">
                        <input
                          type="radio"
                          name="sensorySuppression"
                          checked={form.sensorySuppression === v}
                          onChange={() => setForm((f) => ({ ...f, sensorySuppression: v }))}
                          className="text-medical-600"
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-600 mb-2">Rivalry response</span>
                  <div className="flex gap-4">
                    {(['stable', 'alternating'] as const).map((v) => (
                      <label key={v} className="inline-flex items-center gap-2 text-sm capitalize">
                        <input
                          type="radio"
                          name="sensoryRivalry"
                          checked={form.sensoryRivalry === v}
                          onChange={() => setForm((f) => ({ ...f, sensoryRivalry: v }))}
                          className="text-medical-600"
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>
              </fieldset>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={listeningUi}
                className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
            )}
            {step < TOTAL_STEPS && (
              <button
                type="button"
                onClick={handleNext}
                disabled={listeningUi}
                className="px-5 py-2.5 rounded-lg bg-medical-600 text-white text-sm font-medium hover:bg-medical-700 shadow-sm transition-colors disabled:opacity-50"
              >
                Next
              </button>
            )}
            {step === 3 && (
              <button
                type="button"
                onClick={() => {
                  setStepError('')
                  setStep(4)
                }}
                disabled={listeningUi}
                className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Skip
              </button>
            )}
            {step === TOTAL_STEPS && (
              <button
                type="submit"
                disabled={listeningUi}
                className="px-5 py-2.5 rounded-lg bg-medical-600 text-white text-sm font-medium hover:bg-medical-700 shadow-sm transition-colors disabled:opacity-50"
              >
                Submit
              </button>
            )}
          </div>
          <button
            type="button"
            disabled={listeningUi}
            onClick={() => {
              setForm(initialForm())
              setStep(1)
              setStepError('')
              setVoiceError('')
              setLastTranscript('')
            }}
            className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </form>
    </Modal>
  )
}
