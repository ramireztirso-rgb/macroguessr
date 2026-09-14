import type { Macros } from '../data/meals'

export type GuessRecord = {
  mealId: string
  guess: Macros
  total: number // meal score 0-100
}

export type DayResult = {
  dateKey: string
  guesses: GuessRecord[]
  totalScore: number // sum of meal totals, 0-500
  completedAt: string
}

export type Stats = {
  gamesPlayed: number
  currentStreak: number
  maxStreak: number
  lastCompletedDate: string | null
  totalScoreSum: number
  history: DayResult[]
}

const STATS_KEY = 'macroguessr:stats:v1'
const PROGRESS_PREFIX = 'macroguessr:progress:'

const DEFAULT_STATS: Stats = {
  gamesPlayed: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastCompletedDate: null,
  totalScoreSum: 0,
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

export function recordDayComplete(dateKey: string, guesses: GuessRecord[]): Stats {
  const stats = loadStats()
  const totalScore = guesses.reduce((sum, g) => sum + g.total, 0)

  if (stats.lastCompletedDate === dateKey) {
    // Already recorded today; don't double count (e.g. re-render or tab refresh).
    return stats
  }

  const isConsecutive = stats.lastCompletedDate
    ? daysBetween(stats.lastCompletedDate, dateKey) === 1
    : false

  const currentStreak = isConsecutive ? stats.currentStreak + 1 : 1

  const next: Stats = {
    gamesPlayed: stats.gamesPlayed + 1,
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    lastCompletedDate: dateKey,
    totalScoreSum: stats.totalScoreSum + totalScore,
    history: [...stats.history, { dateKey, guesses, totalScore, completedAt: new Date().toISOString() }].slice(-60),
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STATS_KEY, JSON.stringify(next))
  }
  return next
}

export function loadTodayProgress(dateKey: string): GuessRecord[] {
  if (typeof localStorage === 'undefined') return []
  return safeParse(localStorage.getItem(PROGRESS_PREFIX + dateKey), [])
}

export function saveTodayProgress(dateKey: string, guesses: GuessRecord[]) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(PROGRESS_PREFIX + dateKey, JSON.stringify(guesses))
}
