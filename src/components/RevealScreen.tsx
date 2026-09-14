import { useEffect, useState } from 'react'
import type { Dish } from '../data/dish'
import type { Guess, RoundScore } from '../lib/scoring'
import { useCountUp } from '../lib/useCountUp'
import { playRoundResultSound } from '../lib/sound'

// Staged reveal, GeoGuessr/Worldle-style: show the guess-vs-actual numbers
// first, THEN converge the score (with sound), THEN the explanation — instead
// of dumping everything on screen at once.
const NUMBERS_DELAY_MS = 550
const SCORE_TO_EXPLANATION_MS = 900

type Stage = 'numbers' | 'score' | 'full'

function StatCompare({
  label,
  guess,
  actual,
  unit,
  errorPct,
}: {
  label: string
  guess: number
  actual: number
  unit: string
  errorPct: number
}) {
  return (
    <div className="rounded-xl bg-gray-800/60 p-3">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <div className="mt-1 flex items-baseline justify-between">
        <div>
          <p className="text-xs text-gray-500">You guessed</p>
          <p className="text-xl font-bold text-gray-300">
            {guess}
            {unit}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Actual</p>
          <p className="text-xl font-bold text-emerald-400">
            {actual}
            {unit}
          </p>
        </div>
      </div>
      <p className="mt-1 text-right text-xs text-gray-500">{Math.round(errorPct * 100)}% off</p>
    </div>
  )
}

export function RevealScreen({
  dish,
  guess,
  score,
  message,
  isLastRound,
  onNext,
}: {
  dish: Dish
  guess: Guess
  score: RoundScore
  message: string
  isLastRound: boolean
  onNext: () => void
}) {
  const [stage, setStage] = useState<Stage>('numbers')
  const animatedPoints = useCountUp(stage === 'numbers' ? 0 : score.total, 700)
  const landed = stage !== 'numbers' && animatedPoints >= score.total
  const [popped, setPopped] = useState(false)

  useEffect(() => {
    setStage('numbers')
    const toScore = setTimeout(() => {
      setStage('score')
      playRoundResultSound(score.total)
    }, NUMBERS_DELAY_MS)
    const toFull = setTimeout(() => setStage('full'), NUMBERS_DELAY_MS + SCORE_TO_EXPLANATION_MS)
    return () => {
      clearTimeout(toScore)
      clearTimeout(toFull)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dish.id])

  useEffect(() => {
    if (landed) {
      setPopped(true)
      const t = setTimeout(() => setPopped(false), 220)
      return () => clearTimeout(t)
    }
  }, [landed])

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="rounded-xl bg-gray-800/60 p-4 text-center">
        {stage === 'numbers' ? (
          <p className="text-sm text-gray-500">Comparing your guess...</p>
        ) : (
          <>
            <p className="text-sm text-gray-400">You were {Math.round(score.combinedErrorPct * 100)}% off</p>
            <p
              className={`mt-1 text-4xl font-black tabular-nums text-emerald-400 transition-transform duration-200 ${
                popped ? 'scale-110' : 'scale-100'
              }`}
            >
              +{animatedPoints} pts
            </p>
            <p className="mt-2 text-sm font-medium text-gray-300">{message}</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCompare
          label="Calories"
          guess={guess.calories}
          actual={dish.macros.calories}
          unit=""
          errorPct={score.calorieErrorPct}
        />
        <StatCompare
          label="Protein"
          guess={guess.protein}
          actual={dish.macros.protein}
          unit="g"
          errorPct={score.proteinErrorPct}
        />
      </div>

      {stage === 'full' && (
        <div className="reveal-fade-in flex flex-col gap-4">
          <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-4">
            <p className="text-sm text-gray-300">{dish.explanation}</p>
            <p className="mt-2 flex items-start gap-2 text-sm font-medium text-amber-300">
              <span>💡</span>
              <span>{dish.gotcha}</span>
            </p>
          </div>

          <button
            onClick={onNext}
            className="w-full rounded-xl bg-white px-4 py-3 font-bold text-black transition hover:bg-gray-200"
          >
            {isLastRound ? 'See Results' : 'Next Dish'}
          </button>
        </div>
      )}
    </div>
  )
}
