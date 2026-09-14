import { useEffect, useState } from 'react'

function pct(value: number, max: number): number {
  return Math.min(100, Math.max(0, (value / max) * 100))
}

export function GuessActualBar({
  label,
  guess,
  actual,
  max,
  unit,
  accentColor,
  errorPct,
}: {
  label: string
  guess: number
  actual: number
  max: number
  unit: string
  accentColor: string
  errorPct: number
}) {
  const guessPct = pct(guess, max)
  const actualPct = pct(actual, max)
  const [actualVisible, setActualVisible] = useState(false)

  useEffect(() => {
    // Mount the marker at the guess position first, then animate it sliding
    // to the actual position on the next frame — the "watch it land" moment.
    const raf = requestAnimationFrame(() => setActualVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const gapStart = Math.min(guessPct, actualVisible ? actualPct : guessPct)
  const gapEnd = Math.max(guessPct, actualVisible ? actualPct : guessPct)

  return (
    <div className="rounded-xl bg-gray-800/60 p-3">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-gray-400">{label}</span>
        <span className="text-gray-500">{Math.round(errorPct * 100)}% off</span>
      </div>

      <div className="relative mt-4 mb-5 h-2 rounded-full bg-gray-700">
        <div
          className="absolute h-full rounded-full bg-gray-500/40 transition-all duration-700 ease-out"
          style={{ left: `${gapStart}%`, width: `${gapEnd - gapStart}%` }}
        />

        {/* Guess marker — where the player dragged to. */}
        <div
          className="absolute top-1/2 flex -translate-y-1/2 -translate-x-1/2 flex-col items-center"
          style={{ left: `${guessPct}%` }}
        >
          <div className="h-4 w-4 rounded-full border-2 border-gray-300 bg-gray-800" />
          <span className="absolute top-5 whitespace-nowrap text-[10px] font-medium text-gray-400">
            You: {guess}
            {unit}
          </span>
        </div>

        {/* Actual marker — slides into place on mount. */}
        <div
          className="absolute top-1/2 flex -translate-y-1/2 -translate-x-1/2 flex-col items-center transition-all duration-700 ease-out"
          style={{ left: `${actualVisible ? actualPct : guessPct}%`, opacity: actualVisible ? 1 : 0 }}
        >
          <span className="absolute bottom-5 whitespace-nowrap text-[10px] font-bold" style={{ color: accentColor }}>
            Actual: {actual}
            {unit}
          </span>
          <div className="h-4 w-4 rounded-full border-2 shadow" style={{ background: accentColor, borderColor: accentColor }} />
        </div>
      </div>
    </div>
  )
}
