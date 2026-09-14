import {
  getAvgCalorieAccuracy,
  getAvgProteinAccuracy,
  getAvgScore,
  getBiasInsight,
  getCuisinePerformance,
  type Stats,
} from '../lib/storage'
import { MAX_DAY_SCORE } from '../lib/scoring'

export function ProfileScreen({ stats }: { stats: Stats }) {
  const cuisinePerf = getCuisinePerformance(stats)
  const insight = getBiasInsight(stats)
  const best = cuisinePerf[0]
  const worst = cuisinePerf[cuisinePerf.length - 1]

  if (stats.gamesPlayed === 0) {
    return (
      <div className="flex w-full flex-col items-center gap-3 text-center text-gray-400">
        <p className="text-lg font-bold text-white">No games yet</p>
        <p>Play today's game to start building your stats.</p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <h2 className="text-center text-2xl font-black text-white">Your Stats</h2>

      <div className="grid grid-cols-2 gap-3">
        <StatBox label="Current Streak" value={`🔥 ${stats.currentStreak}`} />
        <StatBox label="Longest Streak" value={stats.maxStreak} />
        <StatBox label="Games Played" value={stats.gamesPlayed} />
        <StatBox label="Avg Score" value={`${getAvgScore(stats)}/${MAX_DAY_SCORE}`} />
        <StatBox label="Best Score" value={`${stats.bestScore}/${MAX_DAY_SCORE}`} />
        <StatBox label="Avg Calorie Accuracy" value={`${getAvgCalorieAccuracy(stats)}%`} />
      </div>

      <StatBox label="Avg Protein Accuracy" value={`${getAvgProteinAccuracy(stats)}%`} wide />

      {insight && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4 text-sm text-emerald-200">
          🧠 {insight}
        </div>
      )}

      {cuisinePerf.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-gray-300">Category Performance</h3>
          <div className="flex flex-col gap-2">
            {cuisinePerf.map((c) => (
              <div key={c.cuisine} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm text-gray-300">{c.cuisine}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-700">
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${Math.min(100, Math.max(0, c.avgPercent))}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm text-gray-400">{c.avgPercent}%</span>
              </div>
            ))}
          </div>
          {best && worst && best.cuisine !== worst.cuisine && (
            <p className="mt-3 text-xs text-gray-500">
              Best: <span className="text-emerald-400">{best.cuisine}</span> · Worst:{' '}
              <span className="text-red-400">{worst.cuisine}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, wide }: { label: string; value: string | number; wide?: boolean }) {
  return (
    <div className={`rounded-xl bg-gray-800/60 p-4 text-center ${wide ? 'col-span-2' : ''}`}>
      <p className="text-xl font-black text-white">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}
