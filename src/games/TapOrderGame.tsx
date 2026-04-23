import { useMemo, useState } from 'react'
import type { GameResult } from '../types'

interface Props {
  onGameEnd: (result: GameResult) => void
  onScoreUpdate: (score: number) => void
}

export function TapOrderGame({ onGameEnd, onScoreUpdate }: Props) {
  const [size] = useState(9)
  const [numbers] = useState(() => Array.from({ length: size }, (_, i) => i + 1).sort(() => Math.random() - 0.5))
  const [currentTarget, setCurrentTarget] = useState(1)
  const [wrong, setWrong] = useState<number | null>(null)
  const [start] = useState(Date.now())

  const completion = useMemo(() => ((currentTarget - 1) / size) * 100, [currentTarget, size])

  function clickNumber(value: number) {
    if (value === currentTarget) {
      const next = currentTarget + 1
      setCurrentTarget(next)
      onScoreUpdate(next - 1)
      if (next > size) {
        const completionTime = Math.round((Date.now() - start) / 1000)
        onGameEnd({
          score: size,
          accuracy: 100,
          avgReactionTime: 0,
          maxSequence: size,
          completionTime,
        })
      }
      return
    }
    setWrong(value)
    window.setTimeout(() => setWrong(null), 220)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Tap numbers in ascending order.</p>
      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full bg-medical-600 transition-all" style={{ width: `${completion}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {numbers.map((n) => {
          const isDone = n < currentTarget
          return (
            <button
              key={n}
              type="button"
              onClick={() => clickNumber(n)}
              className={`rounded-xl py-6 text-xl font-semibold border transition ${
                isDone
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  : wrong === n
                    ? 'bg-red-100 border-red-300 text-red-700'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}
