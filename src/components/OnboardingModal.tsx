import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import type { AgeGroup, Client, ClientType, Sport } from '../types'

const LOCATIONS = [
  'Joint',
  'Muscles',
  'Ligament',
  'Dorsal',
  'Lumbar',
  'Cervical',
] as const

const TOTAL_STEPS = 4
const STEP_TITLES = ['Basic info', 'Client type', 'Health assessment', 'Measurements']

interface OnboardingModalProps {
  open: boolean
  onClose: () => void
  onAdd: (client: Client) => void
}

const initialForm = () => ({
  name: '',
  age: '',
  ageGroup: '' as AgeGroup | '',
  type: '' as ClientType | '',
  sport: 'Soccer' as Sport,
  painLevel: 5,
  timeOfDay: '' as 'Morning' | 'Evening' | '',
  swelling: '' as 'Yes' | 'No' | '',
  locations: [] as string[],
  internalExternal: 'Internal' as 'Internal' | 'External',
  headaches: '' as 'Yes' | 'No' | '',
  steps: '',
  sleep: '',
  heartRate: '',
})

export function OnboardingModal({ open, onClose, onAdd }: OnboardingModalProps) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [stepError, setStepError] = useState('')

  useEffect(() => {
    if (open) {
      setStep(1)
      setForm(initialForm())
      setStepError('')
    }
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
      if (!f.ageGroup) {
        setStepError('Please select an age classification.')
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
      const steps = Number(f.steps)
      const sleep = Number(f.sleep)
      const hr = Number(f.heartRate)
      if (f.steps === '' || steps < 0 || !Number.isFinite(steps)) {
        setStepError('Please enter valid steps per day.')
        return false
      }
      if (f.sleep === '' || sleep < 0 || sleep > 24 || !Number.isFinite(sleep)) {
        setStepError('Please enter sleep hours (0–24).')
        return false
      }
      if (f.heartRate === '' || hr < 30 || hr > 220 || !Number.isFinite(hr)) {
        setStepError('Please enter heart rate (30–220 bpm).')
        return false
      }
    }
    return true
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
    const now = new Date().toISOString()
    const pain = form.painLevel
    const newClient: Client = {
      id: 'c' + Date.now(),
      name: form.name.trim(),
      age: Number(form.age),
      type: form.type as ClientType,
      ageGroup: form.ageGroup as AgeGroup,
      sport: form.type === 'Athlete' ? form.sport : null,
      painLevel: pain,
      timeOfDay: form.timeOfDay as string,
      swelling: form.swelling as string,
      location: form.locations.length ? form.locations : ['—'],
      internalExternal: form.internalExternal,
      headaches: form.headaches as string,
      steps: Number(form.steps),
      sleep: Number(form.sleep),
      heartRate: Number(form.heartRate),
      lastUpdated: now,
      notes: '',
      active: true,
      painHistory: [{ date: now, value: pain }],
      cognitiveMetrics: null,
      cognitiveHistory: [],
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

  return (
    <Modal open={open} title="Client onboarding" onClose={onClose} size="md">
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
              <div className="sm:col-span-2">
                <span className="block text-xs font-medium text-slate-600 mb-2">
                  Age classification
                </span>
                <div className="flex flex-wrap gap-4">
                  {(['Teen', 'Adult', 'Senior'] as const).map((ag) => (
                    <label key={ag} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="ageGroup"
                        checked={form.ageGroup === ag}
                        onChange={() => setForm((f) => ({ ...f, ageGroup: ag }))}
                        className="text-medical-600"
                      />
                      {ag === 'Teen' ? 'Teenagers' : ag === 'Adult' ? 'Adults' : 'Seniors'}
                    </label>
                  ))}
                </div>
              </div>
            </div>
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
          <fieldset className="space-y-4 border-0 p-0 m-0">
            <legend className="text-sm font-semibold text-medical-700">Measurements</legend>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="obSteps">
                  Steps per day
                </label>
                <input
                  id="obSteps"
                  type="number"
                  min={0}
                  value={form.steps}
                  onChange={(e) => setForm((f) => ({ ...f, steps: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-medical-600/20 focus:border-medical-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="obSleep">
                  Hours of sleep
                </label>
                <input
                  id="obSleep"
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  value={form.sleep}
                  onChange={(e) => setForm((f) => ({ ...f, sleep: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-medical-600/20 focus:border-medical-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="obHR">
                  Heart rate (bpm)
                </label>
                <input
                  id="obHR"
                  type="number"
                  min={30}
                  max={220}
                  value={form.heartRate}
                  onChange={(e) => setForm((f) => ({ ...f, heartRate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-medical-600/20 focus:border-medical-600 outline-none"
                />
              </div>
            </div>
          </fieldset>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
            )}
            {step < TOTAL_STEPS && (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-lg bg-medical-600 text-white text-sm font-medium hover:bg-medical-700 shadow-sm transition-colors"
              >
                Next
              </button>
            )}
            {step === TOTAL_STEPS && (
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-medical-600 text-white text-sm font-medium hover:bg-medical-700 shadow-sm transition-colors"
              >
                Submit
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setForm(initialForm())
              setStep(1)
              setStepError('')
            }}
            className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </form>
    </Modal>
  )
}
