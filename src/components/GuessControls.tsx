import { CALORIE_MAX, PROTEIN_MAX, type Guess } from '../lib/scoring'

const CALORIE_STEP = 10
const CALORIE_NUDGE = 25
const PROTEIN_STEP = 1
const PROTEIN_NUDGE = 5

function StepButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xl font-bold text-gray-200 transition active:scale-90 active:bg-gray-700"
    >
      {label}
    </button>
  )
}

function GuessSlider({
  label,
  value,
  max,
  step,
  nudge,
  unit,
  thumbColor,
  onChange,
}: {
  label: string
  value: number
  max: number
  step: number
  nudge: number
  unit: string
  thumbColor: string
  onChange: (value: number) => void
}) {
  const clamp = (v: number) => Math.min(max, Math.max(0, v))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-gray-300">{label}</span>
        <span className="text-3xl font-black tabular-nums text-white">
          {value}
          <span className="ml-1 text-base font-medium text-gray-400">{unit}</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <StepButton label="−" onClick={() => onChange(clamp(value - nudge))} />
        <input
          type="range"
          min={0}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="guess-slider w-full flex-1"
          style={{ ['--slider-thumb-color' as string]: thumbColor }}
        />
        <StepButton label="+" onClick={() => onChange(clamp(value + nudge))} />
      </div>
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
        nudge={CALORIE_NUDGE}
        unit="kcal"
        thumbColor="#fbbf24"
        onChange={(calories) => onChange({ ...guess, calories })}
      />
      <GuessSlider
        label="Protein"
        value={guess.protein}
        max={PROTEIN_MAX}
        step={PROTEIN_STEP}
        nudge={PROTEIN_NUDGE}
        unit="g"
        thumbColor="#34d399"
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
