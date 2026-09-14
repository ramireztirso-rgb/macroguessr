import { useEffect, useState } from 'react'
import type { Dish } from '../data/dish'
import {
  CALORIE_MAX,
  GOOD_ROUND_THRESHOLD,
  PROTEIN_MAX,
  scoreColorClass,
  type Guess,
  type RoundScore,
} from '../lib/scoring'
import { useCountUp } from '../lib/useCountUp'
import { playRoundResultSound } from '../lib/sound'
import { hapticBad, hapticGood, hapticStreak } from '../lib/haptics'
import { GuessActualBar } from './GuessActualBar'

const EXCELLENT_THRESHOLD = 85
const CALORIE_COLOR = '#fbbf24'
const PROTEIN_COLOR = '#34d399'

// Staged reveal, GeoGuessr/Worldle-style: show the guess-vs-actual numbers
// first, THEN converge the score (with sound), THEN the explanation — instead
// of dumping everything on screen at once. Deliberately slow — the pause is
// what makes the reveal feel suspenseful instead of instant.
const NUMBERS_DELAY_MS = 1400
const SCORE_TO_EXPLANATION_MS = 1100

type Stage = 'numbers' | 'score' | 'full'

export function RevealScreen({
  dish,
  guess,
  score,
  message,
  hotStreak,
  isLastRound,
  onNext,
}: {
  dish: Dish
  guess: Guess
  score: RoundScore
  message: string
  hotStreak: number
  isLastRound: boolean
  onNext: () => void
}) {
  const [stage, setStage] = useState<Stage>('numbers')
  const animatedPoints = useCountUp(stage === 'numbers' ? 0 : score.total, 900)
  const landed = stage !== 'numbers' && animatedPoints >= score.total
  const [popped, setPopped] = useState(false)
  const isExcellent = score.total >= EXCELLENT_THRESHOLD
  const onFire = hotStreak >= 2

  useEffect(() => {
    setStage('numbers')
    const toScore = setTimeout(() => {
      setStage('score')
      playRoundResultSound(score.total)
      if (score.total < GOOD_ROUND_THRESHOLD) hapticBad()
      else if (onFire) hapticStreak()
      else hapticGood()
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
      <div
        className={`rounded-xl bg-gray-800/60 p-4 text-center transition-shadow duration-300 ${
          stage !== 'numbers' && isExcellent ? 'ring-1 ring-emerald-400/50 shadow-[0_0_28px_-6px_rgba(52,211,153,0.7)]' : ''
        }`}
      >
        {stage === 'numbers' ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-gray-500">Comparing your guess...</p>
            <div className="flex gap-1.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-600 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-600 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-600" />
            </div>
          </div>
        ) : (
          <>
            {onFire && (
              <p className="reveal-fade-in mb-1 text-sm font-bold text-orange-400">
                🔥 {hotStreak} in a row!
              </p>
            )}
            <p className="text-sm text-gray-400">You were {Math.round(score.combinedErrorPct * 100)}% off</p>
            <p
              className={`mt-1 text-4xl font-black tabular-nums transition-transform duration-200 ${scoreColorClass(score.total)} ${
                popped ? 'scale-110' : 'scale-100'
              }`}
            >
              +{animatedPoints} pts
            </p>
            <p className="mt-2 text-sm font-medium text-gray-300">{message}</p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <GuessActualBar
          label="Calories"
          guess={guess.calories}
          actual={dish.macros.calories}
          max={CALORIE_MAX}
          unit=""
          accentColor={CALORIE_COLOR}
          errorPct={score.calorieErrorPct}
        />
        <GuessActualBar
          label="Protein"
          guess={guess.protein}
          actual={dish.macros.protein}
          max={PROTEIN_MAX}
          unit="g"
          accentColor={PROTEIN_COLOR}
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
            {dish.ingredients && dish.ingredients.length > 0 && (
              <div className="mt-3 border-t border-gray-700 pt-3">
                <p className="text-xs font-medium text-gray-500">What's in it</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {dish.ingredients.map((ing) => (
                    <span key={ing} className="rounded-full bg-gray-700/60 px-2 py-0.5 text-xs text-gray-300">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
