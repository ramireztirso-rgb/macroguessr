import { MAX_ROUND_SCORE } from './scoring'

export type RoundRecord = {
  dishId: string
  dishName: string
  cuisine: string
  difficulty: number
  guess: { calories: number; protein: number }
  actual: { calories: number; protein: number }
  calorieErrorPct: number
  proteinErrorPct: number
  total: number // round score, 0-MAX_ROUND_SCORE
}

export type DayResult = {
  dateKey: string
  rounds: RoundRecord[]
  totalScore: number // sum of round totals, 0-MAX_DAY_SCORE
  completedAt: string
}

type CuisineAgg = { scoreSum: number; count: number }

export type Stats = {
  gamesPlayed: number
  currentStreak: number
  maxStreak: number
  lastCompletedDate: string | null
  totalScoreSum: number
  bestScore: number
  calorieErrorSum: number
  proteinErrorSum: number
  calorieBiasSum: number // signed (guess-actual)/actual, for over/under insight
  proteinBiasSum: number
  roundCount: number
  cuisineStats: Record<string, CuisineAgg>
  history: DayResult[]
}

const STATS_KEY = 'macroguess:stats:v2'
const PROGRESS_PREFIX = 'macroguess:progress:v2:'

const DEFAULT_STATS: Stats = {
  gamesPlayed: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastCompletedDate: null,
  totalScoreSum: 0,
  bestScore: 0,
  calorieErrorSum: 0,
  proteinErrorSum: 0,
  calorieBiasSum: 0,
  proteinBiasSum: 0,
  roundCount: 0,
  cuisineStats: {},
  history: [],
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadStats(): Stats {
  if (typeof localStorage === 'undefined') return DEFAULT_STATS
  return safeParse(localStorage.getItem(STATS_KEY), DEFAULT_STATS)
}

function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`)
  const db = new Date(`${b}T00:00:00`)
  return Math.round((db.getTime() - da.getTime()) / 86_400_000)
}

function signedError(guess: number, actual: number): number {
  const denom = Math.max(actual, 1)
  return (guess - actual) / denom
}

export function recordDayComplete(dateKey: string, rounds: RoundRecord[]): Stats {
  const stats = loadStats()
  const totalScore = rounds.reduce((sum, r) => sum + r.total, 0)

  if (stats.lastCompletedDate === dateKey) {
    // Already recorded today; don't double count (re-render, refresh, etc.).
    return stats
  }

  const isConsecutive = stats.lastCompletedDate ? daysBetween(stats.lastCompletedDate, dateKey) === 1 : false
  const currentStreak = isConsecutive ? stats.currentStreak + 1 : 1

  const cuisineStats = { ...stats.cuisineStats }
  let calorieErrorSum = stats.calorieErrorSum
  let proteinErrorSum = stats.proteinErrorSum
  let calorieBiasSum = stats.calorieBiasSum
  let proteinBiasSum = stats.proteinBiasSum

  for (const r of rounds) {
    calorieErrorSum += r.calorieErrorPct
    proteinErrorSum += r.proteinErrorPct
    calorieBiasSum += signedError(r.guess.calories, r.actual.calories)
    proteinBiasSum += signedError(r.guess.protein, r.actual.protein)

    const agg = cuisineStats[r.cuisine] ?? { scoreSum: 0, count: 0 }
    cuisineStats[r.cuisine] = { scoreSum: agg.scoreSum + r.total, count: agg.count + 1 }
  }

  const next: Stats = {
    gamesPlayed: stats.gamesPlayed + 1,
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    lastCompletedDate: dateKey,
    totalScoreSum: stats.totalScoreSum + totalScore,
    bestScore: Math.max(stats.bestScore, totalScore),
    calorieErrorSum,
    proteinErrorSum,
    calorieBiasSum,
    proteinBiasSum,
    roundCount: stats.roundCount + rounds.length,
    cuisineStats,
    history: [...stats.history, { dateKey, rounds, totalScore, completedAt: new Date().toISOString() }].slice(-60),
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STATS_KEY, JSON.stringify(next))
  }
  return next
}

export function loadTodayProgress(dateKey: string): RoundRecord[] {
  if (typeof localStorage === 'undefined') return []
  return safeParse(localStorage.getItem(PROGRESS_PREFIX + dateKey), [])
}

export function saveTodayProgress(dateKey: string, rounds: RoundRecord[]) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(PROGRESS_PREFIX + dateKey, JSON.stringify(rounds))
}

// --- Derived stats for the profile screen ---

export type CuisinePerformance = { cuisine: string; avgPercent: number; count: number }

export function getCuisinePerformance(stats: Stats): CuisinePerformance[] {
  return Object.entries(stats.cuisineStats)
    .map(([cuisine, agg]) => ({
      cuisine,
      avgPercent: Math.round((agg.scoreSum / agg.count / MAX_ROUND_SCORE) * 100),
      count: agg.count,
    }))
    .sort((a, b) => b.avgPercent - a.avgPercent)
}

export function getAvgCalorieAccuracy(stats: Stats): number {
  if (stats.roundCount === 0) return 0
  return Math.max(0, Math.round(100 - (stats.calorieErrorSum / stats.roundCount) * 100))
}

export function getAvgProteinAccuracy(stats: Stats): number {
  if (stats.roundCount === 0) return 0
  return Math.max(0, Math.round(100 - (stats.proteinErrorSum / stats.roundCount) * 100))
}

export function getAvgScore(stats: Stats): number {
  if (stats.gamesPlayed === 0) return 0
  return Math.round(stats.totalScoreSum / stats.gamesPlayed)
}

/** A short, genuinely-computed insight sentence from the player's own guess history (not scripted). */
export function getBiasInsight(stats: Stats): string | null {
  if (stats.roundCount < 5) return null
  const calBias = stats.calorieBiasSum / stats.roundCount
  const proteinBias = stats.proteinBiasSum / stats.roundCount

  const calLabel =
    calBias < -0.1 ? 'underestimate calories' : calBias > 0.1 ? 'overestimate calories' : null
  const proteinLabel =
    proteinBias < -0.1 ? 'underestimate protein' : proteinBias > 0.1 ? 'overestimate protein' : null

  if (calLabel && proteinLabel) return `You tend to ${calLabel} and ${proteinLabel}.`
  if (calLabel) return `You tend to ${calLabel}.`
  if (proteinLabel) return `You tend to ${proteinLabel}.`
  return "You're well-calibrated — no consistent over/underestimating pattern."
}
