import { useEffect, useRef, useState } from 'react'
import { Modal } from './Modal'
import type { Client, ClientType, Sport } from '../types'
import { SPORTS, emptyProfile } from '../lib/clients'
import { submitOnboardingVoiceProfile, type OnboardingVoiceProfileFields } from '../lib/api'

function ageToGroup(age: number): Client['ageGroup'] {
  if (age < 20) return 'Teen'
  if (age < 60) return 'Adult'
  return 'Senior'
}

function painLevelFromNotes(notes: string): number {
  const t = notes.trim().toLowerCase()
  if (!t || t === 'none') return 1
  const m = t.match(/\d+/)
  if (m) return Math.min(10, Math.max(1, parseInt(m[0], 10)))
  return 5
}

function cleanList(items: string[]): string[] {
  return items.map((s) => s.trim()).filter(Boolean)
}

const SPORT_SET = new Set<string>(SPORTS)

function applyVoiceProfile(prev: FormState, p: OnboardingVoiceProfileFields): FormState {
  const nextType: ClientType = p.type === 'Athlete' ? 'Athlete' : 'Business'
  const sport =
    p.sport && SPORT_SET.has(p.sport) ? (p.sport as Sport) : prev.sport
  const pain = p.pain?.trim() ? p.pain.trim() : prev.pain

  return {
    ...prev,
    name: p.name?.trim() || prev.name,
    age: p.age?.trim() || prev.age,
    height: p.height?.trim() || prev.height,
    weight: p.weight?.trim() || prev.weight,
    visceralFat: p.visceralFat?.trim() || prev.visceralFat,
    pain: pain || prev.pain,
    type: p.type ? nextType : prev.type,
    sport,
    problems: p.problems?.length ? p.problems : prev.problems,
    goals: p.goals?.length ? p.goals : prev.goals,
    posture: p.posture?.length ? p.posture : prev.posture,
    cognitiveAbilities: p.cognitiveAbilities?.length
      ? p.cognitiveAbilities
      : prev.cognitiveAbilities,
    neuralDevelopment: p.neuralDevelopment?.trim() || prev.neuralDevelopment,
    senseAbilities: p.senseAbilities?.trim() || prev.senseAbilities,
    visualAbilities: p.visualAbilities?.trim() || prev.visualAbilities,
    physicalAbilities: p.physicalAbilities?.length
      ? p.physicalAbilities
      : prev.physicalAbilities,
  }
}

interface OnboardingModalProps {
  open: boolean
  onClose: () => void
  onAdd: (client: Client) => void
}

type FormState = {
  photo: string | null
  name: string
  age: string
  height: string
  weight: string
  visceralFat: string
  pain: string
  type: ClientType
  sport: Sport
  problems: string[]
  goals: string[]
  posture: string[]
  cognitiveAbilities: string[]
  neuralDevelopment: string
  senseAbilities: string
  visualAbilities: string
  physicalAbilities: string[]
}

const initialForm = (): FormState => ({
  photo: null,
  name: '',
  age: '',
  height: '',
  weight: '',
  visceralFat: '',
  pain: 'none',
  type: 'Business',
  sport: 'Soccer',
  problems: [''],
  goals: ['', '', ''],
  posture: [''],
  cognitiveAbilities: ['', ''],
  neuralDevelopment: '',
  senseAbilities: '',
  visualAbilities: '',
  physicalAbilities: ['', '', ''],
})

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-1">
      {children}
    </span>
  )
}

function ListEditor({
  label,
  items,
  onChange,
  placeholder = 'Add item…',
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-4 shrink-0">{i + 1}.</span>
            <input
              value={item}
              onChange={(e) => {
                const next = [...items]
                next[i] = e.target.value
                onChange(next)
              }}
              placeholder={placeholder}
              className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-medical-600/20"
            />
            {items.length > 1 ? (
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="text-slate-400 hover:text-red-600 text-lg leading-none px-1"
                aria-label="Remove"
              >
                ×
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="mt-1 text-xs font-medium text-medical-700 hover:text-medical-800"
      >
        + Add line
      </button>
    </div>
  )
}

function VoiceListeningAnimation({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div className="flex flex-col items-center gap-2 py-3" aria-live="polite">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <div className="voice-listen-ring absolute inset-0 rounded-full bg-medical-600/25" />
        <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-medical-600 text-white">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
      </div>
      <div className="flex h-6 items-end justify-center gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="voice-listen-bar w-1 rounded-full bg-medical-600"
            style={{ height: '50%', animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>
      <p className="text-xs font-medium text-medical-700">AI is listening…</p>
    </div>
  )
}

export function OnboardingModal({ open, onClose, onAdd }: OnboardingModalProps) {
  const [form, setForm] = useState(initialForm)
  const [formError, setFormError] = useState('')
  const [recording, setRecording] = useState(false)
  const [voiceProcessing, setVoiceProcessing] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const [lastTranscript, setLastTranscript] = useState('')
  const [voiceFilledHint, setVoiceFilledHint] = useState('')
  const photoInputRef = useRef<HTMLInputElement | null>(null)
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
    setForm(initialForm())
    setFormError('')
    setRecording(false)
    setVoiceProcessing(false)
    setVoiceError('')
    setLastTranscript('')
    setVoiceFilledHint('')
  }, [open])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, photo: String(reader.result || '') }))
    reader.readAsDataURL(file)
  }

  async function handleToggleVoice() {
    if (voiceProcessing) return
    if (recording) {
      mediaRecorderRef.current?.stop()
      return
    }
    setVoiceError('')
    setLastTranscript('')
    setVoiceFilledHint('')
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
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data)
      }
      mr.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        setRecording(false)
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        if (blob.size < 200) {
          setVoiceError('Recording too short.')
          return
        }
        setVoiceProcessing(true)
        try {
          const data = await submitOnboardingVoiceProfile(blob)
          setLastTranscript(data.transcript)
          setForm((prev) => applyVoiceProfile(prev, data.profile))
          const filled = [
            data.profile.name && 'name',
            data.profile.age && 'age',
            data.profile.height && 'height',
            data.profile.weight && 'weight',
            data.profile.goals?.length && 'goals',
            data.profile.problems?.length && 'problems',
          ].filter(Boolean)
          setVoiceFilledHint(
            filled.length
              ? `Filled: ${filled.join(', ')}. Review and edit below, then save.`
              : 'Could not extract clear fields — try speaking more slowly or edit manually.',
          )
        } catch (err) {
          setVoiceError(err instanceof Error ? err.message : 'Voice fill failed')
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) {
      setFormError('Name is required.')
      return
    }
    const ageNum = Number(form.age)
    if (!form.age || ageNum < 1 || ageNum > 120) {
      setFormError('Enter a valid age (1–120).')
      return
    }

    const now = new Date().toISOString()
    const painLevel = painLevelFromNotes(form.pain)
    const profile = {
      ...emptyProfile(),
      photo: form.photo,
      height: form.height.trim(),
      weight: form.weight.trim(),
      visceralFat: form.visceralFat.trim(),
      painNotes: form.pain.trim() || 'none',
      problems: cleanList(form.problems),
      goals: cleanList(form.goals),
      posture: cleanList(form.posture),
      cognitiveAbilities: cleanList(form.cognitiveAbilities),
      neuralDevelopment: form.neuralDevelopment.trim(),
      senseAbilities: form.senseAbilities.trim(),
      visualAbilities: form.visualAbilities.trim(),
      physicalAbilities: cleanList(form.physicalAbilities),
    }

    const defaultHr = 72
    const newClient: Client = {
      id: 'c' + Date.now(),
      name: form.name.trim(),
      age: ageNum,
      type: form.type,
      ageGroup: ageToGroup(ageNum),
      sport: form.type === 'Athlete' ? form.sport : null,
      profile,
      painLevel,
      timeOfDay: 'Morning',
      swelling: 'No',
      location: ['—'],
      internalExternal: 'Internal',
      headaches: 'No',
      steps: 0,
      sleep: 0,
      heartRate: defaultHr,
      bloodPressureSystolic: null,
      bloodPressureDiastolic: null,
      vitalsOverview: '',
      lastUpdated: now,
      notes: [
        profile.neuralDevelopment && `Neural: ${profile.neuralDevelopment}`,
        profile.senseAbilities && `Sense: ${profile.senseAbilities}`,
        profile.visualAbilities && `Visual: ${profile.visualAbilities}`,
      ]
        .filter(Boolean)
        .join(' · '),
      active: true,
      painHistory: [{ date: now, value: painLevel }],
      vitalSignsHistory: [
        { date: now, heartRate: defaultHr, systolic: null, diastolic: null },
      ],
      cognitiveMetrics: null,
      cognitiveHistory: [],
      oculomotorDominance: null,
      sensoryDominance: null,
    }
    onAdd(newClient)
  }

  const listeningUi = recording || voiceProcessing

  return (
    <Modal open={open} title="New client profile" onClose={onClose} size="xl">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="rounded-xl border-2 border-medical-200 bg-gradient-to-br from-medical-50 to-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900">Voice intake</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Tap the microphone and describe the client in one pass — name, age, height, weight,
                pain, goals, problems, posture, cognitive and physical abilities. OpenAI will
                transcribe your speech and fill every matching field below. You can still edit
                manually afterward.
              </p>
              {!recording && !voiceProcessing ? (
                <p className="mt-2 text-xs text-slate-500 italic">
                  Example: &quot;Patient Javier, 34 years old, five foot seven, 67 kilos, visceral
                  fat 9 kg, no pain, business client, tight core, goals are feel more active,
                  reduce stress, play with children, posture range of motion, memory and
                  planning, good listening, max heart rate and VO2 max.&quot;
                </p>
              ) : null}
            </div>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <VoiceListeningAnimation active={recording} />
              {voiceProcessing ? (
                <div className="flex items-center gap-2 py-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-medical-600 border-t-transparent" />
                  <span className="text-xs font-medium text-slate-700">Processing…</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  disabled={voiceProcessing}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold shadow-md transition-all ${
                    recording
                      ? 'bg-red-600 text-white hover:bg-red-700 ring-2 ring-red-300'
                      : 'bg-medical-600 text-white hover:bg-medical-700 ring-2 ring-medical-200'
                  } disabled:opacity-50`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  {recording ? 'Stop recording' : 'Describe client by voice'}
                </button>
              )}
            </div>
          </div>
          {voiceError ? (
            <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {voiceError}
            </p>
          ) : null}
          {voiceFilledHint && !voiceProcessing ? (
            <p className="mt-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              {voiceFilledHint}
            </p>
          ) : null}
          {lastTranscript && !voiceProcessing ? (
            <details className="mt-3">
              <summary className="text-xs font-medium text-slate-600 cursor-pointer">
                View transcript
              </summary>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{lastTranscript}</p>
            </details>
          ) : null}
        </div>

        {formError ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Photo column */}
          <div className="lg:w-56 shrink-0 flex flex-col items-center">
            <div className="w-full aspect-[3/4] max-w-[220px] rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 overflow-hidden flex items-center justify-center">
              {form.photo ? (
                <img src={form.photo} alt="Client" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-slate-400 px-4 text-center">Upload photo</span>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="mt-3 w-full max-w-[220px] px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-white"
            >
              {form.photo ? 'Change photo' : 'Upload photo'}
            </button>
            {form.photo ? (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, photo: null }))}
                className="mt-1 text-xs text-red-600 hover:underline"
              >
                Remove photo
              </button>
            ) : null}
          </div>

          {/* Data columns */}
          <div className="flex-1 grid md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-4">
              <div>
                <FieldLabel>name</FieldLabel>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-medical-600/20"
                />
              </div>
              <div>
                <FieldLabel>age</FieldLabel>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={form.age}
                  onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-medical-600/20"
                />
              </div>
              <div>
                <FieldLabel>height</FieldLabel>
                <input
                  value={form.height}
                  onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))}
                  placeholder={"e.g. 5' 7\""}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-medical-600/20"
                />
              </div>
              <div>
                <FieldLabel>weight</FieldLabel>
                <input
                  value={form.weight}
                  onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                  placeholder="e.g. 67 kg"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-medical-600/20"
                />
              </div>
              <div>
                <FieldLabel>visceral fat</FieldLabel>
                <input
                  value={form.visceralFat}
                  onChange={(e) => setForm((f) => ({ ...f, visceralFat: e.target.value }))}
                  placeholder="e.g. 9 kg"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-medical-600/20"
                />
              </div>
              <div>
                <FieldLabel>pain</FieldLabel>
                <input
                  value={form.pain}
                  onChange={(e) => setForm((f) => ({ ...f, pain: e.target.value }))}
                  placeholder="none or description"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-medical-600/20"
                />
              </div>
              <div>
                <FieldLabel>type</FieldLabel>
                <div className="flex gap-4 mt-1">
                  {(['Business', 'Athlete'] as const).map((t) => (
                    <label key={t} className="inline-flex items-center gap-2 capitalize">
                      <input
                        type="radio"
                        name="clientType"
                        checked={form.type === t}
                        onChange={() => setForm((f) => ({ ...f, type: t }))}
                        className="text-medical-600"
                      />
                      {t.toLowerCase()}
                    </label>
                  ))}
                </div>
              </div>
              {form.type === 'Athlete' ? (
                <div>
                  <FieldLabel>sport</FieldLabel>
                  <select
                    value={form.sport}
                    onChange={(e) => setForm((f) => ({ ...f, sport: e.target.value as Sport }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-medical-600/20"
                  >
                    <option value="Soccer">Soccer</option>
                    <option value="Cycle">Cycle</option>
                    <option value="Motorbike">Motorbike</option>
                    <option value="Boxing">Boxing</option>
                    <option value="Tennis">Tennis</option>
                  </select>
                </div>
              ) : null}
              <ListEditor
                label="problem"
                items={form.problems}
                onChange={(problems) => setForm((f) => ({ ...f, problems }))}
                placeholder="e.g. Tight core"
              />
            </div>

            <div className="space-y-4">
              <ListEditor
                label="Goals"
                items={form.goals}
                onChange={(goals) => setForm((f) => ({ ...f, goals }))}
              />
              <ListEditor
                label="posture"
                items={form.posture}
                onChange={(posture) => setForm((f) => ({ ...f, posture }))}
              />
              <ListEditor
                label="Cognitive abilities"
                items={form.cognitiveAbilities}
                onChange={(cognitiveAbilities) => setForm((f) => ({ ...f, cognitiveAbilities }))}
              />
              <div>
                <FieldLabel>Neural development</FieldLabel>
                <textarea
                  rows={2}
                  value={form.neuralDevelopment}
                  onChange={(e) => setForm((f) => ({ ...f, neuralDevelopment: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-medical-600/20 resize-y"
                />
              </div>
              <div>
                <FieldLabel>Sense abilities</FieldLabel>
                <input
                  value={form.senseAbilities}
                  onChange={(e) => setForm((f) => ({ ...f, senseAbilities: e.target.value }))}
                  placeholder="e.g. listening"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-medical-600/20"
                />
              </div>
              <div>
                <FieldLabel>Visual abilities</FieldLabel>
                <input
                  value={form.visualAbilities}
                  onChange={(e) => setForm((f) => ({ ...f, visualAbilities: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-medical-600/20"
                />
              </div>
              <ListEditor
                label="Physical abilities"
                items={form.physicalAbilities}
                onChange={(physicalAbilities) => setForm((f) => ({ ...f, physicalAbilities }))}
                placeholder="e.g. max heart rate"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={listeningUi}
            className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={listeningUi}
            className="px-6 py-2.5 rounded-lg bg-medical-600 text-white text-sm font-medium hover:bg-medical-700 shadow-sm disabled:opacity-50"
          >
            Save client
          </button>
        </div>
      </form>
    </Modal>
  )
}
