import type { Guess } from '../lib/scoring'

const CALORIE_MAX = 2000
const CALORIE_STEP = 10
const PROTEIN_MAX = 120
const PROTEIN_STEP = 1

function GuessSlider({
  label,
  value,
  max,
  step,
  unit,
  accent,
  onChange,
}: {
  label: string
  value: number
  max: number
  step: number
  unit: string
  accent: string
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-gray-300">{label}</span>
        <span className="text-3xl font-black tabular-nums text-white">
          {value}
          <span className="ml-1 text-base font-medium text-gray-400">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full ${accent}`}
      />
    </div>
  )
}

export function GuessControls({
  guess,
  onChange,
  onSubmit,
}: {
  guess: Guess
  onChange: (next: Guess) => void
  onSubmit: () => void
}) {
  return (
    <form
      className="flex w-full flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <GuessSlider
        label="Calories"
        value={guess.calories}
        max={CALORIE_MAX}
        step={CALORIE_STEP}
        unit="kcal"
        accent="accent-amber-400"
        onChange={(calories) => onChange({ ...guess, calories })}
      />
      <GuessSlider
        label="Protein"
        value={guess.protein}
        max={PROTEIN_MAX}
        step={PROTEIN_STEP}
        unit="g"
        accent="accent-emerald-400"
        onChange={(protein) => onChange({ ...guess, protein })}
      />
      <button
        type="submit"
        className="mt-2 w-full rounded-xl bg-emerald-500 px-4 py-4 text-lg font-bold text-black transition hover:bg-emerald-400 active:scale-[0.99]"
      >
        Lock In Guess
      </button>
    </form>
  )
}
