export type Macros = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

/** 1 = warm-up/intuitive ... 5 = boss round / hardest gotcha. */
export type Difficulty = 1 | 2 | 3 | 4 | 5

export type Dish = {
  id: string
  name: string
  imageUrl: string
  cuisine: string
  macros: Macros
  difficulty: Difficulty
  /** Short, conversational "why" — grounded in the dish's real ingredients/composition. */
  explanation: string
  /** The surprising/interesting one-liner shown after the explanation. */
  gotcha: string
  /** e.g. 'hidden-oil', 'cheese', 'restaurant-portion', 'high-protein', 'deceptive-healthy' */
  tags: string[]
  recipeUrl?: string
  sourceCredit?: string
  /** Real serving weight, when known — shown during guessing to give a size reference. */
  servingSize?: { amount: number; unit: string }
  /** Real ingredient list, when known — shown on the reveal screen (post-guess, doesn't spoil the numbers). */
  ingredients?: string[]
}

// Small hand-written fallback pool (one per difficulty tier) used only until
// scripts/fetch-dishes.mjs has populated generatedDishes.json with real,
// photographed dishes. Macros here are ballpark/illustrative, not verified.
export const PLACEHOLDER_DISH_POOL: Dish[] = [
  {
    id: 'placeholder-1',
    name: 'Grilled Chicken Breast & Rice',
    imageUrl: '',
    cuisine: 'American',
    macros: { calories: 450, protein: 42, carbs: 45, fat: 10 },
    difficulty: 1,
    explanation: 'A pretty standard plate — the chicken carries the protein, the rice carries the carbs.',
    gotcha: 'What you see is basically what you get here — no hidden calories to speak of.',
    tags: ['straightforward', 'high-protein'],
  },
  {
    id: 'placeholder-2',
    name: 'Chicken Caesar Wrap',
    imageUrl: '',
    cuisine: 'American',
    macros: { calories: 620, protein: 32, carbs: 48, fat: 32,  },
    difficulty: 2,
    explanation: 'The tortilla and dressing add more carbs and fat than people expect from a "wrap."',
    gotcha: 'Caesar dressing alone can carry 150+ hidden calories.',
    tags: ['dressing', 'restaurant-portion'],
  },
  {
    id: 'placeholder-3',
    name: 'Restaurant Pasta Alfredo',
    imageUrl: '',
    cuisine: 'Italian',
    macros: { calories: 1100, protein: 28, carbs: 90, fat: 62 },
    difficulty: 3,
    explanation: 'Cream, butter, and parmesan make alfredo sauce one of the densest sauces on a menu.',
    gotcha: 'Restaurant portions are often 2-3x a standard serving size.',
    tags: ['cream-sauce', 'restaurant-portion', 'cheese'],
  },
  {
    id: 'placeholder-4',
    name: '"Healthy" Cobb Salad',
    imageUrl: '',
    cuisine: 'American',
    macros: { calories: 920, protein: 38, carbs: 22, fat: 74 },
    difficulty: 4,
    explanation: 'Bacon, blue cheese, avocado, and a creamy dressing turn lettuce into a calorie bomb.',
    gotcha: 'This salad has more calories than a cheeseburger.',
    tags: ['deceptive-healthy', 'cheese', 'dressing', 'hidden-oil'],
  },
  {
    id: 'placeholder-5',
    name: 'Acai Bowl',
    imageUrl: '',
    cuisine: 'Breakfast',
    macros: { calories: 680, protein: 12, carbs: 108, fat: 22 },
    difficulty: 5,
    explanation: 'Granola, honey, nut butter, and extra fruit toppings push the sugar and calories way up.',
    gotcha: 'A "light" breakfast bowl can out-calorie a fast food breakfast sandwich.',
    tags: ['deceptive-healthy', 'liquid-calories', 'toppings'],
  },
]
