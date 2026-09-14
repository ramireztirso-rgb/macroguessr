import { useState } from 'react'
import type { GuessRecord } from '../lib/storage'
import type { Stats } from '../lib/storage'
import { scoreEmoji } from '../lib/scoring'

function buildShareText(dateKey: string, guesses: GuessRecord[], totalScore: number): string {
  const grid = guesses.map((g) => scoreEmoji(g.total)).join('')
  return `MacroGuessr ${dateKey}\n${grid}\n${totalScore}/500\nplay: macroguessr`
}

export function SummaryScreen({
  dateKey,
  guesses,
  stats,
}: {
  dateKey: string
  guesses: GuessRecord[]
  stats: Stats
}) {
  const [copied, setCopied] = useState(false)
  const totalScore = guesses.reduce((sum, g) => sum + g.total, 0)
  const avg = stats.gamesPlayed > 0 ? Math.round(stats.totalScoreSum / stats.gamesPlayed) : 0

  const handleShare = async () => {
    const text = buildShareText(dateKey, guesses, totalScore)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard may be unavailable (permissions, insecure context); fail quietly.
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <div>
        <h2 className="text-2xl font-black text-white">Today's Results</h2>
        <p className="mt-1 text-gray-400">
          {totalScore}/500 · {guesses.map((g) => scoreEmoji(g.total)).join(' ')}
        </p>
      </div>

      <div className="grid w-full grid-cols-3 gap-3">
        <StatBox label="Streak" value={stats.currentStreak} />
        <StatBox label="Best Streak" value={stats.maxStreak} />
        <StatBox label="Avg Score" value={avg} />
      </div>

      <button
        onClick={handleShare}
        className="w-full rounded-xl bg-white px-4 py-3 font-bold text-black transition hover:bg-gray-200"
      >
        {copied ? 'Copied!' : 'Share Results'}
      </button>

      <p className="text-sm text-gray-500">Come back tomorrow for 5 new meals.</p>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-gray-800/60 py-4">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}
