import { useMemo, useState } from 'react'
import { DishPhoto } from './components/DishPhoto'
import { RoundSlider } from './components/RoundSlider'
import { RevealScreen } from './components/RevealScreen'
import { ProgressDots } from './components/ProgressDots'
import { HomeScreen } from './components/HomeScreen'
import { ResultsScreen } from './components/ResultsScreen'
import { ProfileScreen } from './components/ProfileScreen'
import { getDailyDishes, todayKey } from './lib/daily'
import { CALORIE_MAX, GOOD_ROUND_THRESHOLD, PROTEIN_MAX, getRoundMessage, scoreRound, type Guess } from './lib/scoring'
import { loadStats, loadTodayProgress, recordDayComplete, saveTodayProgress, type RoundRecord } from './lib/storage'
import { primeAudio } from './lib/sound'
import { USING_PLACEHOLDER_DATA } from './data/dishPool'
import { SoundToggle } from './components/SoundToggle'

const DEFAULT_GUESS: Guess = { calories: 500, protein: 25 }
const THINKING_MS = 1500

const CALORIE_STEP = 10
const CALORIE_NUDGE = 25
const PROTEIN_STEP = 1
const PROTEIN_NUDGE = 5
const CALORIE_COLOR = '#fbbf24'
const PROTEIN_COLOR = '#34d399'

/** Trailing count of consecutive "good" rounds ending at the most recent one — the in-game hot streak. */
function trailingHotStreak(rounds: RoundRecord[]): number {
  let count = 0
  for (let i = rounds.length - 1; i >= 0; i--) {
    if (rounds[i].total >= GOOD_ROUND_THRESHOLD) count++
    else break
  }
  return count
}

/** Trailing count of consecutive bad (<50) rounds ending at the most recent one — for escalating roast lines. */
function trailingColdStreak(rounds: RoundRecord[]): number {
  let count = 0
  for (let i = rounds.length - 1; i >= 0; i--) {
    if (rounds[i].total < 50) count++
    else break
  }
  return count
}

type View = 'home' | 'game' | 'results' | 'profile'
type GamePhase = 'guessing' | 'thinking' | 'revealed'

function App() {
  const dateKey = useMemo(() => todayKey(), [])
  const dishes = useMemo(() => getDailyDishes(dateKey), [dateKey])

  const [stats, setStats] = useState(() => loadStats())
  const [rounds, setRounds] = useState<RoundRecord[]>(() => loadTodayProgress(dateKey))
  const alreadyPlayedToday = rounds.length >= dishes.length && dishes.length > 0

  const [view, setView] = useState<View>('home')
  const [roundIndex, setRoundIndex] = useState(() => Math.min(loadTodayProgress(dateKey).length, dishes.length))
  const [gamePhase, setGamePhase] = useState<GamePhase>('guessing')
  const [currentGuess, setCurrentGuess] = useState<Guess>(DEFAULT_GUESS)
  const [message, setMessage] = useState('')

  const currentDish = dishes[roundIndex]
  const lastRound = rounds[rounds.length - 1]

  const startGame = () => {
    if (alreadyPlayedToday) {
      setView('results')
      return
    }
    setRoundIndex(rounds.length)
    setCurrentGuess(DEFAULT_GUESS)
    setGamePhase('guessing')
    setView('game')
  }

  const handleSubmitGuess = () => {
    if (!currentDish) return
    primeAudio() // resume the AudioContext within this click's user-gesture
    // Sliders lock immediately (frozen at the submitted guess, no more
    // dragging) but the actual-value marker doesn't appear until after a
    // beat — a real pause, without hiding the sliders behind another screen.
    setGamePhase('thinking')
    setTimeout(() => {
      const score = scoreRound(currentGuess, currentDish.macros)
      const record: RoundRecord = {
        dishId: currentDish.id,
        dishName: currentDish.name,
        cuisine: currentDish.cuisine,
        difficulty: currentDish.difficulty,
        guess: currentGuess,
        actual: { calories: currentDish.macros.calories, protein: currentDish.macros.protein },
        calorieErrorPct: score.calorieErrorPct,
        proteinErrorPct: score.proteinErrorPct,
        total: score.total,
      }
      const nextRounds = [...rounds, record]
      setRounds(nextRounds)
      saveTodayProgress(dateKey, nextRounds)
      setMessage(getRoundMessage(score.total, trailingColdStreak(nextRounds)))
      setGamePhase('revealed')
    }, THINKING_MS)
  }

  const handleNext = () => {
    const isLast = roundIndex >= dishes.length - 1
    if (isLast) {
      const finalStats = recordDayComplete(dateKey, rounds)
      setStats(finalStats)
      setView('results')
    } else {
      setRoundIndex((i) => i + 1)
      setCurrentGuess(DEFAULT_GUESS)
      setGamePhase('guessing')
    }
  }

  const revealed = gamePhase === 'revealed'
  const locked = gamePhase !== 'guessing' // frozen during both 'thinking' and 'revealed'
  const lastScore = revealed && lastRound ? scoreRound(lastRound.guess, lastRound.actual) : null
  const hotStreak = trailingHotStreak(rounds)

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-4 py-6">
      <SoundToggle />
      {view !== 'game' && (
        <header className="flex items-center justify-between">
          <button onClick={() => setView('home')} className="text-lg font-black tracking-tight text-white">
            Macro<span className="text-emerald-400">Guess</span>
          </button>
          <nav className="flex gap-2 text-sm">
            <button
              onClick={() => setView('home')}
              className={`rounded-full px-3 py-1 ${view === 'home' ? 'bg-white text-black' : 'text-gray-400'}`}
            >
              Home
            </button>
            <button
              onClick={() => setView('profile')}
              className={`rounded-full px-3 py-1 ${view === 'profile' ? 'bg-white text-black' : 'text-gray-400'}`}
            >
              Profile
            </button>
          </nav>
        </header>
      )}

      {view === 'home' && (
        <HomeScreen
          stats={stats}
          dishes={dishes}
          alreadyPlayedToday={alreadyPlayedToday}
          todayScore={rounds.reduce((s, r) => s + r.total, 0)}
          onPlay={startGame}
          onViewResults={() => setView('results')}
        />
      )}

      {view === 'game' && currentDish && (
        <>
          <ProgressDots total={dishes.length} current={roundIndex} />
          <DishPhoto dish={currentDish} />

          <div className="flex flex-col gap-6">
            <RoundSlider
              label="Calories"
              unit="kcal"
              max={CALORIE_MAX}
              step={CALORIE_STEP}
              nudge={CALORIE_NUDGE}
              color={CALORIE_COLOR}
              guess={currentGuess.calories}
              onChange={(calories) => setCurrentGuess({ ...currentGuess, calories })}
              disabled={locked}
              actual={revealed ? currentDish.macros.calories : undefined}
              errorPct={lastScore?.calorieErrorPct}
            />
            <RoundSlider
              label="Protein"
              unit="g"
              max={PROTEIN_MAX}
              step={PROTEIN_STEP}
              nudge={PROTEIN_NUDGE}
              color={PROTEIN_COLOR}
              guess={currentGuess.protein}
              onChange={(protein) => setCurrentGuess({ ...currentGuess, protein })}
              disabled={locked}
              actual={revealed ? currentDish.macros.protein : undefined}
              errorPct={lastScore?.proteinErrorPct}
            />

            {gamePhase === 'guessing' && (
              <button
                onClick={handleSubmitGuess}
                className="w-full rounded-xl bg-emerald-500 px-4 py-4 text-lg font-bold text-black transition hover:bg-emerald-400 active:scale-[0.99]"
              >
                Lock In Guess
              </button>
            )}

            {gamePhase === 'thinking' && (
              <div className="flex w-full items-center justify-center gap-2 py-4 text-gray-400">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" />
              </div>
            )}
          </div>

          {revealed && lastScore && (
            <RevealScreen
              dish={currentDish}
              score={lastScore}
              message={message}
              hotStreak={hotStreak}
              isLastRound={roundIndex >= dishes.length - 1}
              onNext={handleNext}
            />
          )}
        </>
      )}

      {view === 'results' && <ResultsScreen dateKey={dateKey} rounds={rounds} stats={stats} />}

      {view === 'profile' && <ProfileScreen stats={stats} />}

      {USING_PLACEHOLDER_DATA && view === 'home' && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-300">
          Running on a small placeholder pool — run <code className="rounded bg-black/30 px-1">scripts/fetch-dishes.mjs</code>{' '}
          to load real photographed dishes.
        </p>
      )}
    </div>
  )
}

export default App
