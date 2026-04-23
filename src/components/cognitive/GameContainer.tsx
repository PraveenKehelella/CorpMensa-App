import type { GameResult } from '../../types'
import { MathMCQGame } from '../../games/MathMCQGame'
import { TapOrderGame } from '../../games/TapOrderGame'
import { SequenceRecallGame } from '../../games/SequenceRecallGame'
import { StroopGame } from '../../games/StroopGame'
import { ReactionGame } from '../../games/ReactionGame'
import type { GameId } from './GameSelector'

interface GameContainerProps {
  selectedGame: GameId
  onGameEnd: (result: GameResult) => void
  onScoreUpdate: (score: number) => void
}

export function GameContainer({ selectedGame, onGameEnd, onScoreUpdate }: GameContainerProps) {
  if (selectedGame === 'math') {
    return <MathMCQGame onGameEnd={onGameEnd} onScoreUpdate={onScoreUpdate} />
  }
  if (selectedGame === 'tap-order') {
    return <TapOrderGame onGameEnd={onGameEnd} onScoreUpdate={onScoreUpdate} />
  }
  if (selectedGame === 'sequence') {
    return <SequenceRecallGame onGameEnd={onGameEnd} onScoreUpdate={onScoreUpdate} />
  }
  if (selectedGame === 'stroop') {
    return <StroopGame onGameEnd={onGameEnd} onScoreUpdate={onScoreUpdate} />
  }
  return <ReactionGame onGameEnd={onGameEnd} onScoreUpdate={onScoreUpdate} />
}
