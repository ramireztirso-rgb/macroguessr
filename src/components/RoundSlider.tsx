import { useEffect, useState } from 'react'

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

function pct(value: number, max: number): number {
  return Math.min(100, Math.max(0, (value / max) * 100))
}

const LOCKED_COLOR = '#9ca3af'

/**
 * One slider that stays mounted across the whole round: interactive while
 * guessing, then locks in place and grows an "actual" marker on the same
 * track once revealed — instead of swapping to a different component.
 */
export function RoundSlider({
  label,
  unit,
  max,
  step,
  nudge,
  color,
  guess,
  onChange,
  disabled,
  actual,
  errorPct,
}: {
  label: string
  unit: string
  max: number
  step: number
  nudge: number
  color: string
  guess: number
  onChange: (value: number) => void
  disabled: boolean
  actual?: number
  errorPct?: number
}) {
  const clamp = (v: number) => Math.min(max, Math.max(0, v))
  const revealed = actual !== undefined
  const [actualVisible, setActualVisible] = useState(false)

  useEffect(() => {
    if (!revealed) {
      setActualVisible(false)
      return
    }
    const raf = requestAnimationFrame(() => setActualVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [revealed])

  const guessPct = pct(guess, max)
  const actualPct = revealed ? pct(actual, max) : guessPct
  const gapStart = Math.min(guessPct, actualVisible ? actualPct : guessPct)
  const gapEnd = Math.max(guessPct, actualVisible ? actualPct : guessPct)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-gray-300">{label}</span>
        <div className="text-right">
          <span className="text-3xl font-black tabular-nums text-white">
            {guess}
            <span className="ml-1 text-base font-medium text-gray-400">{unit}</span>
          </span>
          {revealed && (
            <p className="text-xs font-bold" style={{ color }}>
              Actual: {actual}
              {unit} · {Math.round((errorPct ?? 0) * 100)}% off
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!disabled && <StepButton label="−" onClick={() => onChange(clamp(guess - nudge))} />}

        <div className="relative flex-1">
          <input
            type="range"
            min={0}
            max={max}
            step={step}
            value={guess}
            disabled={disabled}
            onChange={(e) => onChange(Number(e.target.value))}
            className="guess-slider w-full"
            style={{ ['--slider-thumb-color' as string]: disabled ? LOCKED_COLOR : color }}
          />

          {revealed && (
            <>
              <div
                className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gray-400/30 transition-all duration-[1800ms] ease-out"
                style={{ left: `${gapStart}%`, width: `${gapEnd - gapStart}%` }}
              />
              <div
                className="pointer-events-none absolute top-1/2 h-[22px] w-[22px] -translate-y-1/2 -translate-x-1/2 rounded-full border-2 shadow transition-all duration-[1800ms] ease-out"
                style={{
                  left: `${actualVisible ? actualPct : guessPct}%`,
                  opacity: actualVisible ? 1 : 0,
                  background: color,
                  borderColor: color,
                }}
              />
            </>
          )}
        </div>

        {!disabled && <StepButton label="+" onClick={() => onChange(clamp(guess + nudge))} />}
      </div>
    </div>
  )
}
