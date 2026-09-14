import type { Stats } from '../lib/storage'
import { getAvgScore } from '../lib/storage'
import { MAX_DAY_SCORE } from '../lib/scoring'

export function HomeScreen({
  stats,
  alreadyPlayedToday,
  todayScore,
  onPlay,
  onViewResults,
}: {
  stats: Stats
  alreadyPlayedToday: boolean
  todayScore: number
  onPlay: () => void
  onViewResults: () => void
}) {
  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <p className="mt-4 text-lg text-gray-400">5 dishes. 2 minutes. Can you out-guess the plate?</p>

      {stats.currentStreak > 0 && (
        <div className="flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-2 text-orange-300">
          <span className="text-xl">🔥</span>
          <span className="font-bold">{stats.currentStreak} day streak</span>
        </div>
      )}

      <div className="w-full rounded-2xl bg-gray-800/60 p-6">
        {alreadyPlayedToday ? (
          <>
            <p className="text-sm text-gray-400">Today's score</p>
            <p className="text-4xl font-black text-white">
              {todayScore}
              <span className="text-lg text-gray-500">/{MAX_DAY_SCORE}</span>
            </p>
            <button
              onClick={onViewResults}
              className="mt-4 w-full rounded-xl bg-white px-4 py-3 font-bold text-black transition hover:bg-gray-200"
            >
              See Today's Results
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-400">Today's 5 dishes are ready</p>
            <p className="mt-1 text-xs text-gray-500">Same dishes for everyone. ~2-5 minutes.</p>
            <button
              onClick={onPlay}
              className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-4 text-lg font-bold text-black transition hover:bg-emerald-400 active:scale-[0.99]"
            >
              Play Today's Game
            </button>
          </>
        )}
      </div>

      {stats.gamesPlayed > 0 && (
        <div className="grid w-full grid-cols-3 gap-3">
          <MiniStat label="Games" value={stats.gamesPlayed} />
          <MiniStat label="Avg Score" value={getAvgScore(stats)} />
          <MiniStat label="Best Streak" value={stats.maxStreak} />
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-gray-800/60 py-3">
      <p className="text-xl font-black text-white">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}
