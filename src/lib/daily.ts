import { MEAL_POOL, type Meal } from '../data/meals'

const MEALS_PER_DAY = 5

/** Small deterministic PRNG (mulberry32) so a given seed always produces the same sequence. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashStringToSeed(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed)
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Local calendar date as YYYY-MM-DD, so the puzzle rolls over at local midnight. */
export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Deterministic set of meals for a given day, shared by every player who opens the game that day. */
export function getDailyMeals(dateKey: string = todayKey()): Meal[] {
  const seed = hashStringToSeed(`macroguessr-${dateKey}`)
  const shuffled = seededShuffle(MEAL_POOL, seed)
  return shuffled.slice(0, MEALS_PER_DAY)
}

export { MEALS_PER_DAY }
