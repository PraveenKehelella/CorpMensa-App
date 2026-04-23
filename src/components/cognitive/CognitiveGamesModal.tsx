import { useMemo, useState } from 'react'
import { Modal } from '../Modal'
import { GameContainer } from './GameContainer'
import { GameSelector, type GameId } from './GameSelector'
import type { Client, GameResult } from '../../types'

interface Props {
  open: boolean
  clients: Client[]
  onClose: () => void
  onSaveResult: (clientId: string, result: GameResult) => void
}

export function CognitiveGamesModal({ open, clients, onClose, onSaveResult }: Props) {
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [selectedGame, setSelectedGame] = useState<GameId | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [timer] = useState(0)

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId],
  )

  function resetFlow() {
    setSelectedGame(null)
    setIsPlaying(false)
    setScore(0)
    setGameResult(null)
  }

  function closeAndReset() {
    resetFlow()
    onClose()
  }

  function startGame() {
    if (!selectedGame || !selectedClientId) return
    setGameResult(null)
    setScore(0)
    setIsPlaying(true)
  }

  function onGameEnd(result: GameResult) {
    setGameResult(result)
    setIsPlaying(false)
    onSaveResult(selectedClientId, result)
  }

  return (
    <Modal open={open} title="Cognitive Training Games" onClose={closeAndReset} size="lg">
      <div className="p-6 space-y-5">
        {!isPlaying && !gameResult && (
          <>
            <div className="space-y-2">
              <label htmlFor="cg-client" className="text-sm font-medium text-slate-700 block">
                Select client
              </label>
              <select
                id="cg-client"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-medical-600/20"
              >
                <option value="">Choose client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <GameSelector selectedGame={selectedGame} onSelect={setSelectedGame} />
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!selectedGame || !selectedClientId}
                onClick={startGame}
                className="px-5 py-2.5 rounded-lg bg-medical-600 text-white text-sm font-medium hover:bg-medical-700 disabled:opacity-50"
              >
                Start Session
              </button>
            </div>
          </>
        )}

        {isPlaying && selectedGame && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-4 py-2">
              <p className="text-sm text-slate-600">
                Client: <span className="font-semibold text-slate-900">{selectedClient?.name}</span>
              </p>
              <p className="text-sm text-slate-600">
                Score: <span className="font-semibold text-slate-900">{score}</span>
              </p>
            </div>
            <GameContainer selectedGame={selectedGame} onGameEnd={onGameEnd} onScoreUpdate={setScore} />
            <p className="text-xs text-slate-400">Timer state: {timer}</p>
          </div>
        )}

        {!isPlaying && gameResult && (
          <div className="max-w-md mx-auto text-center space-y-4">
            <h3 className="text-xl font-semibold text-slate-900">Session Complete</h3>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 space-y-1">
              <p>Score: {gameResult.score}</p>
              <p>Accuracy: {gameResult.accuracy.toFixed(1)}%</p>
              <p>Avg reaction: {Math.round(gameResult.avgReactionTime)} ms</p>
              <p>Max sequence: {gameResult.maxSequence}</p>
              <p>Completion: {gameResult.completionTime}s</p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={resetFlow}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
              >
                New Game
              </button>
              <button
                type="button"
                onClick={closeAndReset}
                className="px-4 py-2 rounded-lg bg-medical-600 text-white text-sm hover:bg-medical-700"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
