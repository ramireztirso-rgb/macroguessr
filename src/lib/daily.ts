import { DISH_POOL } from '../data/dishPool'
import type { Dish, Difficulty } from '../data/dish'

const DIFFICULTY_TIERS: Difficulty[] = [1, 2, 3, 4, 5]

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

export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const EPOCH = new Date('2024-01-01T00:00:00')

function daysSinceEpoch(dateKey: string): number {
  const d = new Date(`${dateKey}T00:00:00`)
  return Math.max(0, Math.round((d.getTime() - EPOCH.getTime()) / 86_400_000))
}

// Stable per-tier shuffle order (not date-dependent), so each day just walks
// forward through it — like a Wordle answer list. Guarantees no repeats
// within a tier until its whole pool has been used once.
const tierOrderCache = new Map<Difficulty, Dish[]>()
function tierOrder(tier: Difficulty): Dish[] {
  if (!tierOrderCache.has(tier)) {
    const poolForTier = DISH_POOL.filter((d) => d.difficulty === tier)
    const seed = hashStringToSeed(`macroguess-tier-${tier}-v15`)
    tierOrderCache.set(tier, seededShuffle(poolForTier, seed))
  }
  return tierOrderCache.get(tier)!
}

/**
 * Every player gets the same 5 dishes on a given calendar day: one per
 * difficulty tier (1 -> 5), so the round always has a warm-up -> boss arc.
 * If a tier has no dishes yet (e.g. small placeholder pool), it's skipped.
 */
export function getDailyDishes(dateKey: string = todayKey()): Dish[] {
  const dayIndex = daysSinceEpoch(dateKey)
  const dishes: Dish[] = []
  for (const tier of DIFFICULTY_TIERS) {
    const order = tierOrder(tier)
    if (order.length === 0) continue
    dishes.push(order[dayIndex % order.length])
  }
  return dishes
}
