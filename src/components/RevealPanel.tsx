import type { Macros, Meal } from '../data/meals'
import { MACRO_KEYS, MACRO_LABELS, MACRO_UNITS, RECIPE_UNLOCK_THRESHOLD, type MealScore } from '../lib/scoring'

function scoreColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

export function RevealPanel({
  meal,
  guess,
  score,
  message,
  isLastMeal,
  onNext,
}: {
  meal: Meal
  guess: Macros
  score: MealScore
  message: string
  isLastMeal: boolean
  onNext: () => void
}) {
  const unlocked = score.total >= RECIPE_UNLOCK_THRESHOLD

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="rounded-xl bg-gray-800/60 p-4 text-center">
        <p className="text-sm text-gray-400">Meal score</p>
        <p className="text-4xl font-black text-white">{score.total}/100</p>
        <p className="mt-2 text-sm font-medium text-gray-300">{message}</p>
      </div>

      <div className="flex flex-col gap-3">
        {MACRO_KEYS.map((key) => (
          <div key={key} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-200">{MACRO_LABELS[key]}</span>
              <span className="tabular-nums text-gray-400">
                you: {guess[key]} {MACRO_UNITS[key]} · actual: {meal.macros[key]} {MACRO_UNITS[key]}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
              <div
                className={`h-full ${scoreColor(score.perMacro[key])} transition-all`}
                style={{ width: `${score.perMacro[key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {unlocked ? (
        <a
          href={meal.recipeUrl ?? `https://www.google.com/search?q=${encodeURIComponent(meal.recipeQuery)}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-emerald-400/50 bg-emerald-400/10 px-4 py-3 text-center font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
        >
          🔓 Recipe unlocked — {meal.recipeUrl ? 'get the recipe' : 'find it here'}
          {meal.sourceCredit && (
            <span className="mt-1 block text-xs font-normal text-emerald-300/70">{meal.sourceCredit}</span>
          )}
        </a>
      ) : (
        <div className="rounded-xl border border-gray-700 bg-gray-800/40 px-4 py-3 text-center text-sm text-gray-400">
          🔒 Recipe locked — score {RECIPE_UNLOCK_THRESHOLD}+ to unlock it. No worries, next one's yours.
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full rounded-xl bg-white px-4 py-3 font-bold text-black transition hover:bg-gray-200"
      >
        {isLastMeal ? 'See Daily Results' : 'Next Meal'}
      </button>
    </div>
  )
}
