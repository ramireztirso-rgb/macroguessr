import type { Meal } from '../data/meals'

export function MealCard({ meal }: { meal: Meal }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${meal.gradient} aspect-[4/3] w-full text-center shadow-lg`}
    >
      <span className="text-7xl drop-shadow-sm sm:text-8xl">{meal.emoji}</span>
      <div className="mt-4 px-4">
        <h2 className="text-xl font-bold text-white drop-shadow sm:text-2xl">{meal.name}</h2>
        <p className="mt-1 text-sm text-white/90 drop-shadow-sm">{meal.description}</p>
        <span className="mt-2 inline-block rounded-full bg-black/20 px-3 py-1 text-xs font-medium text-white">
          {meal.cuisine}
        </span>
      </div>
    </div>
  )
}
