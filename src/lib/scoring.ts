// Percent-error -> points curve. Anchor points are exact; everything between
// them is linearly interpolated, so the curve is continuous and monotonic.
const CURVE: [errorPct: number, points: number][] = [
  [0, 100],
  [0.05, 95],
  [0.1, 85],
  [0.2, 65],
  [0.3, 40],
  [0.5, 10],
  [1, 0],
]

export function pointsForError(errorPct: number): number {
  const e = Math.abs(errorPct)
  if (e >= 1) return 0
  for (let i = 0; i < CURVE.length - 1; i++) {
    const [e0, p0] = CURVE[i]
    const [e1, p1] = CURVE[i + 1]
    if (e >= e0 && e <= e1) {
      const t = (e - e0) / (e1 - e0)
      return Math.round(p0 + (p1 - p0) * t)
    }
  }
  return 0
}

function percentError(guess: number, actual: number): number {
  const denom = Math.max(actual, 1)
  return Math.abs(guess - actual) / denom
}

export type Guess = { calories: number; protein: number }

export type RoundScore = {
  calorieErrorPct: number
  proteinErrorPct: number
  calorieScore: number
  proteinScore: number
  total: number // 0-MAX_ROUND_SCORE
  combinedErrorPct: number // for the single headline "you were X% off"
}

export function scoreRound(guess: Guess, actual: Guess): RoundScore {
  const calorieErrorPct = percentError(guess.calories, actual.calories)
  const proteinErrorPct = percentError(guess.protein, actual.protein)
  const calorieScore = pointsForError(calorieErrorPct)
  const proteinScore = pointsForError(proteinErrorPct)
  const total = Math.round(calorieScore * 0.5 + proteinScore * 0.5)
  const combinedErrorPct = (calorieErrorPct + proteinErrorPct) / 2
  return { calorieErrorPct, proteinErrorPct, calorieScore, proteinScore, total, combinedErrorPct }
}

export const MAX_ROUND_SCORE = 100
/** Threshold for a "good" round — used to sync the sound, haptics, and hot-streak tracking. */
export const GOOD_ROUND_THRESHOLD = 65
export const ROUNDS_PER_DAY = 5
export const MAX_DAY_SCORE = MAX_ROUND_SCORE * ROUNDS_PER_DAY

export function scoreEmoji(roundTotal: number): string {
  if (roundTotal >= 85) return '🟩'
  if (roundTotal >= 65) return '🟨'
  if (roundTotal >= 40) return '🟧'
  return '🟥'
}

const ENCOURAGEMENT_LOW = [
  "Not your round — the dish got you. Happens to everyone.",
  "Way off, but hey, now you know for next time.",
  "That one was a trap. No shame, on to the next.",
]
const ENCOURAGEMENT_MID = [
  "Solid guess — you were in the right neighborhood.",
  "Not bad! Your gut instinct is coming along.",
  "Respectable. A little more precision and that's a green square.",
]
const ENCOURAGEMENT_HIGH = [
  "Nailed it. Your macro sense is scary good.",
  "Incredible read on that one.",
  "Certified food detective right there.",
]

export function getRoundMessage(total: number): string {
  const pool = total >= 80 ? ENCOURAGEMENT_HIGH : total >= 50 ? ENCOURAGEMENT_MID : ENCOURAGEMENT_LOW
  return pool[Math.floor(Math.random() * pool.length)]
}
