import type { Macros } from '../data/meals'
import { MACRO_KEYS, MACRO_LABELS, MACRO_UNITS } from '../lib/scoring'

const MACRO_MAX: Record<keyof Macros, number> = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 120,
  fiber: 40,
}

const MACRO_STEP: Record<keyof Macros, number> = {
  calories: 10,
  protein: 1,
  carbs: 1,
  fat: 1,
  fiber: 1,
}

export function GuessForm({
  guess,
  onChange,
  onSubmit,
}: {
  guess: Macros
  onChange: (next: Macros) => void
  onSubmit: () => void
}) {
  const setValue = (key: keyof Macros, value: number) => {
    onChange({ ...guess, [key]: Number.isFinite(value) ? value : 0 })
  }

  return (
    <form
      className="flex w-full flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      {MACRO_KEYS.map((key) => (
        <div key={key} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <label htmlFor={key} className="font-medium text-gray-200">
              {MACRO_LABELS[key]}
            </label>
            <span className="tabular-nums text-gray-400">
              {guess[key]} {MACRO_UNITS[key]}
            </span>
          </div>
          <input
            id={key}
            type="range"
            min={0}
            max={MACRO_MAX[key]}
            step={MACRO_STEP[key]}
            value={guess[key]}
            onChange={(e) => setValue(key, Number(e.target.value))}
            className="w-full accent-emerald-400"
          />
        </div>
      ))}
      <button
        type="submit"
        className="mt-2 w-full rounded-xl bg-emerald-500 px-4 py-3 font-bold text-black transition hover:bg-emerald-400 active:scale-[0.99]"
      >
        Lock In Guess
      </button>
    </form>
  )
}
