import { useMemo, useState } from 'react'
import { DishPhoto } from './components/DishPhoto'
import { GuessControls } from './components/GuessControls'
import { RevealScreen } from './components/RevealScreen'
import { ProgressDots } from './components/ProgressDots'
import { HomeScreen } from './components/HomeScreen'
import { ResultsScreen } from './components/ResultsScreen'
import { ProfileScreen } from './components/ProfileScreen'
import { getDailyDishes, todayKey } from './lib/daily'
import { getRoundMessage, scoreRound, type Guess } from './lib/scoring'
import { loadStats, loadTodayProgress, recordDayComplete, saveTodayProgress, type RoundRecord } from './lib/storage'
import { primeAudio } from './lib/sound'
import { USING_PLACEHOLDER_DATA } from './data/dishPool'
import { SoundToggle } from './components/SoundToggle'

const DEFAULT_GUESS: Guess = { calories: 500, protein: 25 }
const SUBMIT_ANTICIPATION_MS = 550

type View = 'home' | 'game' | 'results' | 'profile'
type GamePhase = 'guessing' | 'submitting' | 'revealed'

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
    primeAudio() // resume the AudioContext within this click's user-gesture, before the async reveal
    setGamePhase('submitting')
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
      setMessage(getRoundMessage(score.total))
      setGamePhase('revealed')
    }, SUBMIT_ANTICIPATION_MS)
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

  const lastScore = lastRound
    ? scoreRound(lastRound.guess, lastRound.actual)
    : null

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
          {gamePhase === 'guessing' && (
            <GuessControls guess={currentGuess} onChange={setCurrentGuess} onSubmit={handleSubmitGuess} />
          )}
          {gamePhase === 'submitting' && (
            <div className="flex flex-col items-center gap-3 py-10 text-gray-400">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.3s]" />
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.15s]" />
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-emerald-400" />
              </div>
              <p className="text-sm font-medium">Checking your guess...</p>
            </div>
          )}
          {gamePhase === 'revealed' && lastRound && lastScore && (
            <RevealScreen
              dish={currentDish}
              guess={lastRound.guess}
              score={lastScore}
              message={message}
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
