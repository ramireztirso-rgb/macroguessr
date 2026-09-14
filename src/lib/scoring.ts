import type { Macros } from '../data/meals'

export const MACRO_KEYS: (keyof Macros)[] = ['calories', 'protein', 'carbs', 'fat', 'fiber']

export const MACRO_LABELS: Record<keyof Macros, string> = {
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
  fiber: 'Fiber',
}

export const MACRO_UNITS: Record<keyof Macros, string> = {
  calories: 'kcal',
  protein: 'g',
  carbs: 'g',
  fat: 'g',
  fiber: 'g',
}

/** Points per macro, 0-100, based on percent error. A perfect guess is 100; error grows the score down to 0. */
export function scoreMacro(guess: number, actual: number): number {
  const denom = Math.max(actual, 1)
  const percentError = Math.abs(guess - actual) / denom
  // A guess within ~5% is treated as essentially perfect; score decays to 0 by ~60% error.
  const score = 100 * (1 - percentError / 0.6)
  return Math.max(0, Math.min(100, Math.round(score)))
}

export type MealScore = {
  perMacro: Record<keyof Macros, number>
  total: number // average of per-macro scores, 0-100
}

export function scoreMeal(guess: Macros, actual: Macros): MealScore {
  const perMacro = {} as Record<keyof Macros, number>
  for (const key of MACRO_KEYS) {
    perMacro[key] = scoreMacro(guess[key], actual[key])
  }
  const total = Math.round(
    MACRO_KEYS.reduce((sum, key) => sum + perMacro[key], 0) / MACRO_KEYS.length,
  )
  return { perMacro, total }
}

export const RECIPE_UNLOCK_THRESHOLD = 65

export function scoreEmoji(total: number): string {
  if (total >= 90) return '🟩'
  if (total >= 65) return '🟨'
  if (total >= 40) return '🟧'
  return '🟥'
}

const ROAST_MESSAGES_LOW = [
  "Bro thought this was a guessing game about vibes. Lock in next round 💀",
  "Not even close, chief. The meal is judging you right now.",
  "That guess had no business being that far off. We believe in you though.",
  "Respectfully... what? Take a breath, look at the plate, try again tomorrow.",
]

const MESSAGES_MID = [
  "Not bad! You're in the neighborhood, just not on the block.",
  "Solid effort. A registered dietitian would give you a nod, not applause.",
  "Mid-tier macro detective work. We'll allow it.",
]

const MESSAGES_HIGH = [
  "Okay chef, actually impressive. You might be built different.",
  "Certified macro menace. That was scary accurate.",
  "You could probably eyeball a menu and skip the nutrition app.",
]

export function getRoastMessage(total: number): string {
  const pool = total >= 80 ? MESSAGES_HIGH : total >= 50 ? MESSAGES_MID : ROAST_MESSAGES_LOW
  return pool[Math.floor(Math.random() * pool.length)]
}
