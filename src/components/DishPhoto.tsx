import type { Dish } from '../data/dish'

const DIFFICULTY_LABEL: Record<number, string> = {
  1: 'Warm-up',
  2: 'Moderate',
  3: 'Tricky',
  4: 'Deceptive',
  5: 'Boss round',
}

export function DishPhoto({ dish }: { dish: Dish }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl shadow-lg">
      <div className="relative aspect-[4/3] w-full bg-gray-800">
        {dish.imageUrl && (
          <img src={dish.imageUrl} alt={dish.name} className="h-full w-full object-cover" loading="eager" />
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {dish.cuisine}
          </span>
          <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {DIFFICULTY_LABEL[dish.difficulty] ?? 'Round'} · {dish.difficulty}/5
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-3 pt-10 text-left">
          <h2 className="text-lg font-bold text-white drop-shadow sm:text-xl">{dish.name}</h2>
        </div>
      </div>
    </div>
  )
}
