import generatedMeals from './generatedMeals.json'

export type Macros = {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export type Meal = {
  id: string
  name: string
  description: string
  cuisine: string
  macros: Macros
  recipeQuery: string
  /** Real recipe photo. When absent, MealCard falls back to the emoji/gradient placeholder look. */
  imageUrl?: string
  /** Real, clickable recipe link (e.g. from Spoonacular). When absent, the recipe unlock falls back to a search link. */
  recipeUrl?: string
  /** Attribution text required by the data source (e.g. "Recipe via Spoonacular"). */
  sourceCredit?: string
  emoji?: string
  gradient?: string
}

type GeneratedMeal = {
  id: string
  name: string
  description: string
  cuisine: string
  macros: Macros
  recipeQuery: string
  imageUrl: string
  recipeUrl: string
  sourceCredit: string
}

const generated = generatedMeals as GeneratedMeal[]

// Small illustrated pool used only until a real data source (see
// scripts/fetch-meals.mjs) has been run to populate generatedMeals.json.
// Macros here are approximate/illustrative, not verified nutrition data.
const PLACEHOLDER_MEAL_POOL: Meal[] = [
  {
    id: 'chicken-burrito-bowl',
    name: 'Chicken Burrito Bowl',
    description: 'Rice, black beans, grilled chicken, salsa, cheese, and a scoop of guac.',
    emoji: '🌯',
    cuisine: 'Tex-Mex',
    gradient: 'from-amber-400 to-orange-500',
    macros: { calories: 720, protein: 48, carbs: 75, fat: 25, fiber: 11 },
    recipeQuery: 'chicken burrito bowl recipe',
  },
  {
    id: 'margherita-pizza-slice',
    name: 'Margherita Pizza (2 slices)',
    description: 'Classic wood-fired pizza with mozzarella, tomato, and basil.',
    emoji: '🍕',
    cuisine: 'Italian',
    gradient: 'from-red-400 to-rose-500',
    macros: { calories: 560, protein: 22, carbs: 66, fat: 22, fiber: 4 },
    recipeQuery: 'homemade margherita pizza recipe',
  },
  {
    id: 'salmon-quinoa-bowl',
    name: 'Salmon & Quinoa Bowl',
    description: 'Pan-seared salmon over quinoa with roasted veggies and lemon.',
    emoji: '🐟',
    cuisine: 'Healthy',
    gradient: 'from-teal-400 to-emerald-500',
    macros: { calories: 540, protein: 38, carbs: 45, fat: 22, fiber: 7 },
    recipeQuery: 'salmon quinoa bowl recipe',
  },
  {
    id: 'double-cheeseburger',
    name: 'Double Cheeseburger & Fries',
    description: 'Two beef patties, cheese, and a side of crispy fries.',
    emoji: '🍔',
    cuisine: 'American',
    gradient: 'from-yellow-400 to-amber-600',
    macros: { calories: 1050, protein: 45, carbs: 78, fat: 62, fiber: 5 },
    recipeQuery: 'homemade double cheeseburger and fries recipe',
  },
  {
    id: 'greek-salad',
    name: 'Greek Salad with Feta',
    description: 'Cucumber, tomato, olives, red onion, and feta with olive oil.',
    emoji: '🥗',
    cuisine: 'Mediterranean',
    gradient: 'from-lime-400 to-green-600',
    macros: { calories: 320, protein: 9, carbs: 15, fat: 26, fiber: 5 },
    recipeQuery: 'classic greek salad recipe',
  },
  {
    id: 'pad-thai',
    name: 'Chicken Pad Thai',
    description: 'Stir-fried rice noodles, chicken, egg, peanuts, and lime.',
    emoji: '🍜',
    cuisine: 'Thai',
    gradient: 'from-orange-400 to-red-500',
    macros: { calories: 650, protein: 30, carbs: 80, fat: 22, fiber: 4 },
    recipeQuery: 'chicken pad thai recipe',
  },
  {
    id: 'avocado-toast',
    name: 'Avocado Toast with Egg',
    description: 'Sourdough toast, smashed avocado, and a fried egg.',
    emoji: '🥑',
    cuisine: 'Brunch',
    gradient: 'from-green-400 to-emerald-600',
    macros: { calories: 380, protein: 15, carbs: 32, fat: 23, fiber: 9 },
    recipeQuery: 'avocado toast with egg recipe',
  },
  {
    id: 'beef-ramen',
    name: 'Beef Ramen',
    description: 'Rich broth, noodles, braised beef, soft egg, and scallions.',
    emoji: '🍲',
    cuisine: 'Japanese',
    gradient: 'from-amber-500 to-red-600',
    macros: { calories: 780, protein: 35, carbs: 85, fat: 32, fiber: 3 },
    recipeQuery: 'beef ramen recipe',
  },
  {
    id: 'protein-oatmeal',
    name: 'Protein Oatmeal with Berries',
    description: 'Oats cooked with protein powder, topped with mixed berries.',
    emoji: '🥣',
    cuisine: 'Breakfast',
    gradient: 'from-purple-400 to-indigo-500',
    macros: { calories: 400, protein: 32, carbs: 52, fat: 8, fiber: 8 },
    recipeQuery: 'protein oatmeal with berries recipe',
  },
  {
    id: 'sushi-platter',
    name: 'Sushi Platter (10 pieces)',
    description: 'Assorted nigiri and rolls with soy sauce and wasabi.',
    emoji: '🍣',
    cuisine: 'Japanese',
    gradient: 'from-sky-400 to-blue-600',
    macros: { calories: 480, protein: 24, carbs: 68, fat: 10, fiber: 2 },
    recipeQuery: 'homemade sushi platter recipe',
  },
  {
    id: 'steak-and-veggies',
    name: 'Steak with Roasted Veggies',
    description: 'Grilled ribeye with roasted broccoli and sweet potato.',
    emoji: '🥩',
    cuisine: 'Steakhouse',
    gradient: 'from-red-500 to-stone-700',
    macros: { calories: 680, protein: 46, carbs: 30, fat: 40, fiber: 6 },
    recipeQuery: 'steak with roasted vegetables recipe',
  },
  {
    id: 'veggie-stir-fry',
    name: 'Tofu Veggie Stir-Fry',
    description: 'Crispy tofu, broccoli, peppers, and rice in a savory sauce.',
    emoji: '🥦',
    cuisine: 'Asian',
    gradient: 'from-green-500 to-teal-600',
    macros: { calories: 460, protein: 22, carbs: 58, fat: 15, fiber: 9 },
    recipeQuery: 'tofu veggie stir fry recipe',
  },
  {
    id: 'chocolate-croissant',
    name: 'Chocolate Croissant',
    description: 'Buttery, flaky pastry with a dark chocolate center.',
    emoji: '🥐',
    cuisine: 'Bakery',
    gradient: 'from-yellow-600 to-amber-800',
    macros: { calories: 340, protein: 6, carbs: 38, fat: 18, fiber: 2 },
    recipeQuery: 'chocolate croissant recipe',
  },
  {
    id: 'chicken-caesar-wrap',
    name: 'Chicken Caesar Wrap',
    description: 'Grilled chicken, romaine, parmesan, and caesar dressing in a tortilla.',
    emoji: '🌮',
    cuisine: 'Lunch',
    gradient: 'from-lime-500 to-yellow-600',
    macros: { calories: 520, protein: 34, carbs: 40, fat: 24, fiber: 4 },
    recipeQuery: 'chicken caesar wrap recipe',
  },
  {
    id: 'protein-shake-pb',
    name: 'Peanut Butter Protein Shake',
    description: 'Blended protein powder, banana, peanut butter, and milk.',
    emoji: '🥤',
    cuisine: 'Post-Workout',
    gradient: 'from-yellow-500 to-orange-600',
    macros: { calories: 430, protein: 40, carbs: 38, fat: 14, fiber: 5 },
    recipeQuery: 'peanut butter protein shake recipe',
  },
  {
    id: 'pho',
    name: 'Beef Pho',
    description: 'Fragrant broth, rice noodles, thin beef slices, herbs, and lime.',
    emoji: '🍜',
    cuisine: 'Vietnamese',
    gradient: 'from-rose-400 to-pink-600',
    macros: { calories: 450, protein: 28, carbs: 55, fat: 10, fiber: 3 },
    recipeQuery: 'beef pho recipe',
  },
  {
    id: 'loaded-nachos',
    name: 'Loaded Nachos',
    description: 'Tortilla chips with cheese, jalapeños, beans, and sour cream.',
    emoji: '🧀',
    cuisine: 'Tex-Mex',
    gradient: 'from-amber-400 to-yellow-600',
    macros: { calories: 980, protein: 28, carbs: 90, fat: 56, fiber: 10 },
    recipeQuery: 'loaded nachos recipe',
  },
  {
    id: 'egg-fried-rice',
    name: 'Egg Fried Rice',
    description: 'Wok-fried rice with egg, peas, carrots, and soy sauce.',
    emoji: '🍚',
    cuisine: 'Chinese',
    gradient: 'from-yellow-400 to-lime-600',
    macros: { calories: 520, protein: 14, carbs: 78, fat: 16, fiber: 3 },
    recipeQuery: 'egg fried rice recipe',
  },
]

/**
 * Real meal pool once scripts/fetch-meals.mjs has populated generatedMeals.json;
 * falls back to the illustrated placeholder pool until then.
 */
export const MEAL_POOL: Meal[] = generated.length > 0 ? generated : PLACEHOLDER_MEAL_POOL

export const USING_PLACEHOLDER_DATA = generated.length === 0
