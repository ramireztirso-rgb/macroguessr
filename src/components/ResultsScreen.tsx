import { useState } from 'react'
import type { RoundRecord, Stats } from '../lib/storage'
import { MAX_DAY_SCORE, scoreEmoji } from '../lib/scoring'

// Rough normal-distribution assumption for the "vs today's field" estimate,
// used only because there's no backend/accounts yet to source a real
// population from. Clearly labeled as an estimate in the UI below.
const ASSUMED_MEAN = 320
const ASSUMED_SD = 75

function erf(x: number): number {
  // Abramowitz-Stegun approximation.
  const sign = x < 0 ? -1 : 1
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911
  const ax = Math.abs(x)
  const t = 1 / (1 + p * ax)
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax)
  return sign * y
}

function estimatedPercentile(score: number): number {
  const z = (score - ASSUMED_MEAN) / ASSUMED_SD
  const cdf = 0.5 * (1 + erf(z / Math.SQRT2))
  return Math.round(cdf * 100)
}

function buildShareText(dateKey: string, rounds: RoundRecord[], totalScore: number, streak: number): string {
  const grid = rounds.map((r) => scoreEmoji(r.total)).join(' ')
  const streakLine = streak > 0 ? `\n🔥 ${streak} day streak` : ''
  return `MACRO GUESS — ${dateKey}\n${totalScore}/${MAX_DAY_SCORE}\n${grid}${streakLine}\n#MacroGuess`
}

export function ResultsScreen({
  dateKey,
  rounds,
  stats,
}: {
  dateKey: string
  rounds: RoundRecord[]
  stats: Stats
}) {
  const [copied, setCopied] = useState(false)
  const totalScore = rounds.reduce((sum, r) => sum + r.total, 0)
  const percentile = estimatedPercentile(totalScore)

  const handleShare = async () => {
    const text = buildShareText(dateKey, rounds, totalScore, stats.currentStreak)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard may be unavailable; fail quietly.
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="text-center">
        <p className="text-sm text-gray-400">Today's Score</p>
        <p className="text-5xl font-black text-white">
          {totalScore}
          <span className="text-2xl text-gray-500">/{MAX_DAY_SCORE}</span>
        </p>
        <p className="mt-2 text-lg">{rounds.map((r) => scoreEmoji(r.total)).join(' ')}</p>
        {stats.currentStreak > 0 && (
          <p className="mt-2 text-sm font-medium text-orange-300">🔥 {stats.currentStreak} day streak</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {rounds.map((r, i) => (
          <div key={r.dishId} className="flex items-center justify-between rounded-lg bg-gray-800/60 px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <span>{scoreEmoji(r.total)}</span>
              <span className="text-gray-300">
                Round {i + 1} · {r.dishName}
              </span>
            </div>
            <span className="font-bold text-white">{r.total} pts</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-gray-800/60 p-4">
        <div className="flex items-center justify-between">
          <p className="font-bold text-white">🏆 Leaderboard</p>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-gray-400">PREVIEW</span>
        </div>
        <p className="mt-2 text-sm text-gray-300">
          You beat an estimated <span className="font-bold text-emerald-400">{percentile}%</span> of today's field.
        </p>
        <p className="mt-2 text-xs text-gray-500">
          This is a rough estimate, not real friend data — add friends once accounts launch to see a real
          leaderboard here.
        </p>
      </div>

      <button
        onClick={handleShare}
        className="w-full rounded-xl bg-white px-4 py-3 font-bold text-black transition hover:bg-gray-200"
      >
        {copied ? 'Copied!' : 'Share Results'}
      </button>

      <p className="text-center text-sm text-gray-500">Come back tomorrow for 5 new dishes.</p>
    </div>
  )
}
