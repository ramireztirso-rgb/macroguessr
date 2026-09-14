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

// Soft floor, GeoGuessr-style — a genuinely terrible guess still isn't a
// punishing hard zero. Only pulls up guesses past ~35% error; anything
// closer than that is untouched by this floor.
const MIN_POINTS_FLOOR = 30

export function pointsForError(errorPct: number): number {
  const e = Math.abs(errorPct)
  if (e >= 1) return MIN_POINTS_FLOOR
  for (let i = 0; i < CURVE.length - 1; i++) {
    const [e0, p0] = CURVE[i]
    const [e1, p1] = CURVE[i + 1]
    if (e >= e0 && e <= e1) {
      const t = (e - e0) / (e1 - e0)
      return Math.max(MIN_POINTS_FLOOR, Math.round(p0 + (p1 - p0) * t))
    }
  }
  return MIN_POINTS_FLOOR
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

// Slider ranges shared between GuessControls (input) and the reveal screen's
// guess-vs-actual track (display), so both use the same scale.
// TODO: temporarily lowered for testing with the current small/lighter dish
// pool (today's max is 897kcal/70g) — bump back up once bigger dishes
// (3000-cal territory) are in the pool, or a dish could exceed this range.
export const CALORIE_MAX = 1000
export const PROTEIN_MAX = 100

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

/** Tailwind text-color class matching the same tiers as scoreEmoji, for the reveal screen's score display. */
export function scoreColorClass(roundTotal: number): string {
  if (roundTotal >= 85) return 'text-emerald-400'
  if (roundTotal >= 65) return 'text-yellow-400'
  if (roundTotal >= 40) return 'text-orange-400'
  return 'text-red-400'
}

const ENCOURAGEMENT_LOW = [
  "You good fam? 💀",
  "Bro... you gotta lock tf in. 🔒",
  "Nah that guess was NOT it, chief.",
  "We are not gonna talk about that one.",
  "Chat, this guess is not going well.",
  "Bro thought the sauce was a garnish.",
  "Big whiff energy right there.",
  "The dish said 'not even close' and walked away.",
  "That guess had no business being that far off.",
]
const ENCOURAGEMENT_MID = [
  "Aight that's respectable ngl.",
  "Not bad, not bad. You're cooking a little.",
  "Mid but in a good way. Keep locking in.",
  "You're warming up, big dog.",
  "Solid. Certified in-the-neighborhood behavior.",
  "Decent radar on that one.",
  "You're in striking distance, respect.",
]
const ENCOURAGEMENT_HIGH = [
  "Yessir. You're HIM for that one. 🐐",
  "Absolutely locked in, no cap.",
  "That's diff. You ATE that guess up.",
  "W guess. Certified dawg behavior.",
  "You're built for this fr fr.",
  "Bro really said 'I know food' and proved it.",
  "That guess was actually unfair ngl.",
  "Scary accurate. Who taught you that.",
  "Okay chef, we see you.",
  "You really are that guy.",
]

// Escalating roasts for consecutive bad rounds — a "cold streak" mirroring
// the hot-streak flame, but for whiffs.
const COLD_STREAK_2 = [
  "Bro TWO in a row? We gotta talk.",
  "This is becoming a pattern ngl.",
  "Ok now I'm a little concerned.",
  "Two Ls back to back. Lock in fr.",
  "Back-to-back whiffs. Rough.",
]
const COLD_STREAK_3_PLUS = [
  "Bro you down BAD. 💀",
  "This is a cry for help at this point.",
  "Three in a row?? Put the phone down and eat a vegetable.",
  "Ok we need an intervention.",
  "You are NOT locked in rn, chief.",
]

/**
 * `coldStreak` = consecutive bad rounds ending at and including this one
 * (1 = first bad guess, 2 = second in a row, 3+ = full spiral). Only
 * affects the message when the round itself was bad — a good round always
 * gets a normal high/mid message regardless of what came before it.
 */
export function getRoundMessage(total: number, coldStreak = 0): string {
  if (total < 50) {
    const pool = coldStreak >= 3 ? COLD_STREAK_3_PLUS : coldStreak === 2 ? COLD_STREAK_2 : ENCOURAGEMENT_LOW
    return pool[Math.floor(Math.random() * pool.length)]
  }
  const pool = total >= 80 ? ENCOURAGEMENT_HIGH : ENCOURAGEMENT_MID
  return pool[Math.floor(Math.random() * pool.length)]
}
