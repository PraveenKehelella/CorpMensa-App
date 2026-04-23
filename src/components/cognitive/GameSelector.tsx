export const GAME_OPTIONS = [
  { id: 'math', name: 'Math MCQ', description: 'Solve arithmetic multiple-choice questions quickly.' },
  { id: 'tap-order', name: 'Tap Order', description: 'Tap numbers in ascending order as fast as possible.' },
  { id: 'sequence', name: 'Sequence Recall', description: 'Watch and repeat increasing color sequences.' },
  { id: 'stroop', name: 'Stroop Test', description: 'Select the text color instead of the written word.' },
  { id: 'reaction', name: 'Reaction Test', description: 'React as fast as possible after visual signal.' },
] as const

export type GameId = (typeof GAME_OPTIONS)[number]['id']

interface GameSelectorProps {
  selectedGame: GameId | null
  onSelect: (game: GameId) => void
}

export function GameSelector({ selectedGame, onSelect }: GameSelectorProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {GAME_OPTIONS.map((game) => (
        <button
          key={game.id}
          type="button"
          onClick={() => onSelect(game.id)}
          className={`rounded-xl border p-4 text-left transition ${
            selectedGame === game.id
              ? 'border-medical-600 bg-medical-50 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="font-semibold text-slate-900">{game.name}</p>
          <p className="mt-1 text-sm text-slate-600">{game.description}</p>
        </button>
      ))}
    </div>
  )
}
