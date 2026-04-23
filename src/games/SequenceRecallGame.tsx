import { useEffect, useState } from 'react'
import type { GameResult } from '../types'

interface Props {
  onGameEnd: (result: GameResult) => void
  onScoreUpdate: (score: number) => void
}

const COLORS = ['bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-400']

export function SequenceRecallGame({ onGameEnd, onScoreUpdate }: Props) {
  const [sequence, setSequence] = useState<number[]>([Math.floor(Math.random() * 4)])
  const [userInput, setUserInput] = useState<number[]>([])
  const [isShowingSequence, setIsShowingSequence] = useState(true)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [maxSequence, setMaxSequence] = useState(1)
  const [start] = useState(Date.now())

  useEffect(() => {
    if (!isShowingSequence) return
    let i = 0
    const id = window.setInterval(() => {
      setActiveIndex(sequence[i])
      window.setTimeout(() => setActiveIndex(null), 260)
      i += 1
      if (i >= sequence.length) {
        window.clearInterval(id)
        window.setTimeout(() => setIsShowingSequence(false), 350)
      }
    }, 600)
    return () => window.clearInterval(id)
  }, [isShowingSequence, sequence])

  function failGame() {
    onGameEnd({
      score: maxSequence,
      accuracy: maxSequence > 1 ? ((maxSequence - 1) / maxSequence) * 100 : 0,
      avgReactionTime: 0,
      maxSequence,
      completionTime: Math.round((Date.now() - start) / 1000),
    })
  }

  function chooseTile(index: number) {
    if (isShowingSequence) return
    const next = [...userInput, index]
    setUserInput(next)
    const expected = sequence[next.length - 1]
    if (expected !== index) {
      failGame()
      return
    }
    if (next.length === sequence.length) {
      const grown = [...sequence, Math.floor(Math.random() * 4)]
      const newMax = grown.length - 1
      setMaxSequence(newMax)
      onScoreUpdate(newMax)
      setSequence(grown)
      setUserInput([])
      setIsShowingSequence(true)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Repeat the color sequence. Current length: <span className="font-semibold">{sequence.length}</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        {COLORS.map((color, idx) => (
          <button
            key={color}
            type="button"
            onClick={() => chooseTile(idx)}
            className={`h-28 rounded-xl ${color} ${
              activeIndex === idx ? 'ring-4 ring-offset-2 ring-slate-900/70 scale-[1.02]' : ''
            } transition`}
          />
        ))}
      </div>
      <p className="text-sm text-slate-500">
        {isShowingSequence ? 'Memorize...' : 'Your turn'}
      </p>
    </div>
  )
}
