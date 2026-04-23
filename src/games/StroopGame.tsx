import { useMemo, useState } from 'react'
import type { GameResult } from '../types'

interface Props {
  onGameEnd: (result: GameResult) => void
  onScoreUpdate: (score: number) => void
}

const choices = [
  { label: 'Red', value: 'red', cls: 'bg-red-500' },
  { label: 'Blue', value: 'blue', cls: 'bg-blue-500' },
  { label: 'Green', value: 'green', cls: 'bg-emerald-500' },
  { label: 'Yellow', value: 'yellow', cls: 'bg-amber-400' },
]
const textColorClass: Record<string, string> = {
  red: 'text-red-500',
  blue: 'text-blue-500',
  green: 'text-emerald-500',
  yellow: 'text-amber-400',
}

function nextPrompt() {
  const word = choices[Math.floor(Math.random() * choices.length)]
  const color = choices[Math.floor(Math.random() * choices.length)]
  return { word, color }
}

export function StroopGame({ onGameEnd, onScoreUpdate }: Props) {
  const [prompt, setPrompt] = useState(nextPrompt)
  const [round, setRound] = useState(1)
  const [correct, setCorrect] = useState(0)
  const [reactionTimes, setReactionTimes] = useState<number[]>([])
  const [startedAt, setStartedAt] = useState(Date.now())
  const [sessionStart] = useState(Date.now())
  const totalRounds = 10

  const avgReaction = useMemo(
    () =>
      reactionTimes.length
        ? Math.round(reactionTimes.reduce((s, t) => s + t, 0) / reactionTimes.length)
        : 0,
    [reactionTimes],
  )

  function pick(value: string) {
    const rt = Date.now() - startedAt
    setReactionTimes((prev) => [...prev, rt])
    const ok = value === prompt.color.value
    if (ok) {
      const next = correct + 1
      setCorrect(next)
      onScoreUpdate(next)
    }

    if (round >= totalRounds) {
      const accuracy = ((ok ? correct + 1 : correct) / totalRounds) * 100
      onGameEnd({
        score: ok ? correct + 1 : correct,
        accuracy,
        avgReactionTime: avgReaction || rt,
        maxSequence: 0,
        completionTime: Math.round((Date.now() - sessionStart) / 1000),
      })
      return
    }

    setRound((r) => r + 1)
    setPrompt(nextPrompt())
    setStartedAt(Date.now())
  }

  return (
    <div className="space-y-5 text-center">
      <p className="text-sm text-slate-600">Select the actual text color, not the word.</p>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-8">
        <p className="text-sm text-slate-500">Round {round}/{totalRounds}</p>
        <p className={`mt-2 text-5xl font-bold ${textColorClass[prompt.color.value]}`}>{prompt.word.label}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {choices.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => pick(c.value)}
            className={`${c.cls} rounded-xl py-4 text-white font-semibold`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  )
}
