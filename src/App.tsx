import { useMemo, useState } from 'react'
import { MealCard } from './components/MealCard'
import { GuessForm } from './components/GuessForm'
import { RevealPanel } from './components/RevealPanel'
import { ProgressDots } from './components/ProgressDots'
import { SummaryScreen } from './components/SummaryScreen'
import { getDailyMeals, todayKey } from './lib/daily'
import { getRoastMessage, scoreMeal } from './lib/scoring'
import { loadStats, loadTodayProgress, recordDayComplete, saveTodayProgress, type GuessRecord } from './lib/storage'
import type { Macros } from './data/meals'

const EMPTY_GUESS: Macros = { calories: 500, protein: 20, carbs: 40, fat: 15, fiber: 5 }

type Phase = 'guessing' | 'revealed' | 'summary'

function App() {
  const dateKey = useMemo(() => todayKey(), [])
  const meals = useMemo(() => getDailyMeals(dateKey), [dateKey])

  const [stats, setStats] = useState(() => loadStats())
  const [guesses, setGuesses] = useState<GuessRecord[]>(() => loadTodayProgress(dateKey))
  const [mealIndex, setMealIndex] = useState(() => {
    const saved = loadTodayProgress(dateKey)
    return Math.min(saved.length, meals.length)
  })
  const [phase, setPhase] = useState<Phase>(() => {
    const saved = loadTodayProgress(dateKey)
    return saved.length >= meals.length ? 'summary' : 'guessing'
  })
  const [currentGuess, setCurrentGuess] = useState<Macros>(EMPTY_GUESS)
  const [message, setMessage] = useState('')

  const currentMeal = meals[mealIndex]

  const handleSubmitGuess = () => {
    if (!currentMeal) return
    const score = scoreMeal(currentGuess, currentMeal.macros)
    const record: GuessRecord = { mealId: currentMeal.id, guess: currentGuess, total: score.total }
    const nextGuesses = [...guesses, record]
    setGuesses(nextGuesses)
    saveTodayProgress(dateKey, nextGuesses)
    setMessage(getRoastMessage(score.total))
    setPhase('revealed')
  }

  const handleNext = () => {
    const isLast = mealIndex >= meals.length - 1
    if (isLast) {
      const finalStats = recordDayComplete(dateKey, guesses)
      setStats(finalStats)
      setPhase('summary')
    } else {
      setMealIndex((i) => i + 1)
      setCurrentGuess(EMPTY_GUESS)
      setPhase('guessing')
    }
  }

  const lastScore = guesses[guesses.length - 1]

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-4 py-8">
      <header className="text-center">
        <h1 className="text-3xl font-black tracking-tight text-white">
          Macro<span className="text-emerald-400">Guessr</span>
        </h1>
        <p className="mt-1 text-sm text-gray-400">Guess the macros. Get closer, score higher. No shade if you're off.</p>
      </header>

      {phase !== 'summary' && <ProgressDots total={meals.length} current={mealIndex} />}

      {phase === 'guessing' && currentMeal && (
        <>
          <MealCard meal={currentMeal} />
          <GuessForm guess={currentGuess} onChange={setCurrentGuess} onSubmit={handleSubmitGuess} />
        </>
      )}

      {phase === 'revealed' && currentMeal && lastScore && (
        <>
          <MealCard meal={currentMeal} />
          <RevealPanel
            meal={currentMeal}
            guess={lastScore.guess}
            score={{
              total: lastScore.total,
              perMacro: scoreMeal(lastScore.guess, currentMeal.macros).perMacro,
            }}
            message={message}
            isLastMeal={mealIndex >= meals.length - 1}
            onNext={handleNext}
          />
        </>
      )}

      {phase === 'summary' && <SummaryScreen dateKey={dateKey} guesses={guesses} stats={stats} />}

      <footer className="mt-auto pt-4 text-center text-xs text-gray-600">
        New meals every day at midnight, your time.
      </footer>
    </div>
  )
}

export default App
