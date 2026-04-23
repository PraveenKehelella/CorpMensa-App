import { useMemo, useState } from 'react'
import type { GameResult } from '../types'

interface Props {
  onGameEnd: (result: GameResult) => void
  onScoreUpdate: (score: number) => void
}

export function ReactionGame({ onGameEnd, onScoreUpdate }: Props) {
  const [trial, setTrial] = useState(1)
  const [status, setStatus] = useState<'idle' | 'wait' | 'go' | 'early'>('idle')
  const [goAt, setGoAt] = useState(0)
  const [times, setTimes] = useState<number[]>([])
  const [start] = useState(Date.now())
  const totalTrials = 5

  const avg = useMemo(
    () => (times.length ? Math.round(times.reduce((s, t) => s + t, 0) / times.length) : 0),
    [times],
  )

  function beginTrial() {
    setStatus('wait')
    const delay = 1000 + Math.floor(Math.random() * 3000)
    window.setTimeout(() => {
      setStatus('go')
      setGoAt(Date.now())
    }, delay)
  }

  function handleAreaClick() {
    if (status === 'wait') {
      setStatus('early')
      return
    }
    if (status !== 'go') return
    const rt = Date.now() - goAt
    const newTimes = [...times, rt]
    setTimes(newTimes)
    onScoreUpdate(newTimes.length)

    if (trial >= totalTrials) {
      onGameEnd({
        score: newTimes.length,
        accuracy: (newTimes.length / totalTrials) * 100,
        avgReactionTime: Math.round(newTimes.reduce((s, t) => s + t, 0) / newTimes.length),
        maxSequence: 0,
        completionTime: Math.round((Date.now() - start) / 1000),
      })
      return
    }
    setTrial((t) => t + 1)
    setStatus('idle')
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Trial {trial}/{totalTrials}</p>
      <button
        type="button"
        onClick={status === 'idle' ? beginTrial : handleAreaClick}
        className={`w-full h-56 rounded-2xl text-2xl font-bold transition ${
          status === 'go'
            ? 'bg-emerald-500 text-white'
            : status === 'early'
              ? 'bg-red-500 text-white'
              : 'bg-slate-200 text-slate-700'
        }`}
      >
        {status === 'idle' && 'Start Trial'}
        {status === 'wait' && 'Wait...'}
        {status === 'go' && 'CLICK!'}
        {status === 'early' && 'Too early - click to continue'}
      </button>
      {times.length > 0 && <p className="text-sm text-slate-500">Average reaction: {avg}ms</p>}
    </div>
  )
}
