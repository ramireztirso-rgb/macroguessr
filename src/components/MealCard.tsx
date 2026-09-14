import type { Meal } from '../data/meals'

export function MealCard({ meal }: { meal: Meal }) {
  if (meal.imageUrl) {
    return (
      <div className="w-full overflow-hidden rounded-2xl shadow-lg">
        <div className="relative aspect-[4/3] w-full">
          <img
            src={meal.imageUrl}
            alt={meal.name}
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-3 pt-10 text-left">
            <h2 className="text-lg font-bold text-white drop-shadow sm:text-xl">{meal.name}</h2>
            <p className="mt-1 line-clamp-2 text-xs text-white/85 drop-shadow-sm sm:text-sm">
              {meal.description}
            </p>
            <span className="mt-2 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {meal.cuisine}
            </span>
          </div>
        </div>
      </div>
    )
  }

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
