import { useEffect, useRef, useState } from 'react'

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** Animates from 0 up to `target` once on mount (or whenever `target` changes). */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    setValue(0)
    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const t = Math.min(1, elapsed / durationMs)
      setValue(Math.round(target * easeOutCubic(t)))
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, durationMs])

  return value
}
