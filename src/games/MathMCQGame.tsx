import { useMemo, useState } from 'react'
import { Timer } from '../components/cognitive/Timer'
import type { GameResult } from '../types'

interface Props {
  onGameEnd: (result: GameResult) => void
  onScoreUpdate: (score: number) => void
}

function randomQuestion() {
  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  const ops = ['+', '-', '*'] as const
  const op = ops[Math.floor(Math.random() * ops.length)]
  let answer = a + b
  if (op === '-') answer = a - b
  if (op === '*') answer = a * b

  const options = new Set<number>([answer])
  while (options.size < 4) {
    const delta = Math.floor(Math.random() * 7) - 3
    options.add(answer + delta)
  }
  const shuffled = Array.from(options).sort(() => Math.random() - 0.5)
  return { prompt: `${a} ${op} ${b}`, answer, options: shuffled }
}

export function MathMCQGame({ onGameEnd, onScoreUpdate }: Props) {
  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [showAnswer, setShowAnswer] = useState<number | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [start] = useState(Date.now())
  const [question, setQuestion] = useState(randomQuestion)
  const totalRounds = 8

  const accuracy = useMemo(() => (round > 1 ? (correct / (round - 1)) * 100 : 0), [correct, round])

  function nextRound() {
    if (round >= totalRounds) {
      onGameEnd({
        score,
        accuracy,
        avgReactionTime: 0,
        maxSequence: 0,
        completionTime: Math.round((Date.now() - start) / 1000),
      })
      return
    }
    setRound((r) => r + 1)
    setQuestion(randomQuestion())
    setShowAnswer(null)
    setResetKey((k) => k + 1)
  }

  function submitAnswer(value: number) {
    const isCorrect = value === question.answer
    if (isCorrect) {
      const next = score + 1
      setScore(next)
      setCorrect((c) => c + 1)
      onScoreUpdate(next)
    } else {
      setShowAnswer(question.answer)
    }
    window.setTimeout(nextRound, 500)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">Round {round}/{totalRounds}</p>
        <Timer duration={10} isRunning={showAnswer === null} resetKey={resetKey} onTimeout={nextRound} />
      </div>
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center">
        <p className="text-sm text-slate-500">Solve</p>
        <p className="text-4xl font-bold text-slate-900 mt-2">{question.prompt}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => submitAnswer(option)}
            className="rounded-xl border border-slate-200 bg-white py-4 text-lg font-semibold hover:bg-medical-50 transition"
          >
            {option}
          </button>
        ))}
      </div>
      {showAnswer !== null && <p className="text-sm text-amber-700">Correct answer: {showAnswer}</p>}
    </div>
  )
}
