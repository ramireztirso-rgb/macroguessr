import { useEffect, useState } from 'react'
import type { Dish } from '../data/dish'
import { GOOD_ROUND_THRESHOLD, scoreColorClass, type RoundScore } from '../lib/scoring'
import { useCountUp } from '../lib/useCountUp'
import { playRoundResultSound } from '../lib/sound'
import { hapticBad, hapticGood, hapticStreak } from '../lib/haptics'

const EXCELLENT_THRESHOLD = 85

// The sliders themselves animate the actual-value marker into place
// (~700ms) as soon as you submit, so the score converges right as that
// lands instead of behind a separate loading screen — then the
// explanation follows a beat after that.
const SCORE_DELAY_MS = 800
const SCORE_TO_EXPLANATION_MS = 1100

type Stage = 'waiting' | 'score' | 'full'

export function RevealScreen({
  dish,
  score,
  message,
  hotStreak,
  isLastRound,
  onNext,
}: {
  dish: Dish
  score: RoundScore
  message: string
  hotStreak: number
  isLastRound: boolean
  onNext: () => void
}) {
  const [stage, setStage] = useState<Stage>('waiting')
  const animatedPoints = useCountUp(stage === 'waiting' ? 0 : score.total, 900)
  const landed = stage !== 'waiting' && animatedPoints >= score.total
  const [popped, setPopped] = useState(false)
  const isExcellent = score.total >= EXCELLENT_THRESHOLD
  const onFire = hotStreak >= 2

  useEffect(() => {
    setStage('waiting')
    const toScore = setTimeout(() => {
      setStage('score')
      playRoundResultSound(score.total)
      if (score.total < GOOD_ROUND_THRESHOLD) hapticBad()
      else if (onFire) hapticStreak()
      else hapticGood()
    }, SCORE_DELAY_MS)
    const toFull = setTimeout(() => setStage('full'), SCORE_DELAY_MS + SCORE_TO_EXPLANATION_MS)
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
      {stage !== 'waiting' && (
        <div
          className={`reveal-fade-in rounded-xl bg-gray-800/60 p-4 text-center transition-shadow duration-300 ${
            isExcellent ? 'ring-1 ring-emerald-400/50 shadow-[0_0_28px_-6px_rgba(52,211,153,0.7)]' : ''
          }`}
        >
          {onFire && <p className="reveal-fade-in mb-1 text-sm font-bold text-orange-400">🔥 {hotStreak} in a row!</p>}
          <p className="text-sm text-gray-400">You were {Math.round(score.combinedErrorPct * 100)}% off</p>
          <p
            className={`mt-1 text-4xl font-black tabular-nums transition-transform duration-200 ${scoreColorClass(score.total)} ${
              popped ? 'scale-110' : 'scale-100'
            }`}
          >
            +{animatedPoints} pts
          </p>
          <p className="mt-2 text-sm font-medium text-gray-300">{message}</p>
        </div>
      )}

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
