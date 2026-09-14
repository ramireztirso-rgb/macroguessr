import type { Dish } from '../data/dish'
import type { Guess, RoundScore } from '../lib/scoring'

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
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="rounded-xl bg-gray-800/60 p-4 text-center">
        <p className="text-sm text-gray-400">You were {Math.round(score.combinedErrorPct * 100)}% off</p>
        <p className="mt-1 text-4xl font-black text-emerald-400">+{score.total} pts</p>
        <p className="mt-2 text-sm font-medium text-gray-300">{message}</p>
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
  )
}
