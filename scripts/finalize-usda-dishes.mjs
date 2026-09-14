// One-off merge: takes the 6 USDA dishes that survived manual photo review
// (2 accepted as-is, 4 rescaled to match what the photo actually shows —
// e.g. "chicken teriyaki" macros bumped up to include the rice + veggies
// that are visibly on the plate) and merges them into generatedDishes.json
// alongside the existing Spoonacular dishes. Then re-ranks the WHOLE pool
// by trickiness and rebalances the 5 difficulty tiers evenly, same approach
// as fetch-dishes.mjs.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'generatedDishes.json')

const HEALTHY_WORDS = ['salad', 'bowl', 'wrap', 'smoothie', 'avocado', 'veggie', 'grilled', 'fresh', 'parfait', 'toast']
const INDULGENT_WORDS = [
  'cheeseburger', 'fries', 'fried', 'milkshake', 'pizza', 'burger', 'wings', 'nachos',
  'cake', 'donut', 'lava', 'cheesecake', 'brownie', 'frappuccino',
]

function trickinessScoreFromDish(dish) {
  const nameLower = dish.name.toLowerCase()
  const looksHealthy = HEALTHY_WORDS.some((w) => nameLower.includes(w))
  const looksIndulgent = INDULGENT_WORDS.some((w) => nameLower.includes(w))
  const proteinDensity = dish.macros.protein / Math.max(dish.macros.calories / 100, 1)
  const fatPct = (dish.macros.fat * 9 * 100) / Math.max(dish.macros.calories, 1)
  const hiddenKeywordCount = (dish.tags ?? []).includes('hidden-calories') ? 2 : 0

  let score = 0
  if (looksHealthy) score += dish.macros.calories / 40 + hiddenKeywordCount * 8
  if (looksIndulgent) score -= 15
  score += Math.abs(fatPct - 30) * 0.4
  if (proteinDensity >= 9) score += 12
  if (proteinDensity <= 2) score += 8
  return score
}

const NEW_DISHES = [
  {
    id: 'usda-2708811',
    name: 'Macaroni and Cheese',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/Kraft_Dinner%2C_classic_prep.jpg/960px-Kraft_Dinner%2C_classic_prep.jpg',
    cuisine: 'American',
    macros: { calories: 513, protein: 20, carbs: 53, fat: 24 },
    explanation: 'Most of the calories come from the cheese sauce. The protein adds up across several ingredients rather than one big source.',
    gotcha: 'This is a real 1 cup serving — USDA measured survey data, not a recipe blog\'s guess.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2708811/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central',
    servingSize: { amount: 230, unit: 'g' },
    ingredients: ['Pasta', 'Cheese', 'Milk', 'Butter'],
  },
  {
    id: 'usda-2706796',
    name: 'Kung Pao Chicken',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/96/2016-08-14_Kung_Pao_Chicken_dish_in_Beijing_anagoria.jpg/960px-2016-08-14_Kung_Pao_Chicken_dish_in_Beijing_anagoria.jpg',
    cuisine: 'Chinese',
    macros: { calories: 209, protein: 16, carbs: 11, fat: 11 },
    explanation: 'Most of the calories come from the oil in the stir-fry sauce and the peanuts. The protein adds up across the chicken and peanuts together.',
    gotcha: 'This is a real 1 cup serving — USDA measured survey data, not a recipe blog\'s guess.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2706796/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central',
    servingSize: { amount: 162, unit: 'g' },
    ingredients: ['Chicken', 'Peanuts', 'Scallions', 'Sauce'],
  },
  {
    id: 'usda-2706750-tacos3',
    name: 'Beef Tacos (3)',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg/960px-001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg',
    cuisine: 'Mexican',
    macros: { calories: 565, protein: 32, carbs: 53, fat: 26 },
    explanation: 'Most of the calories come from the beef, cheese, and three full tortillas — easy to undercount when you\'re picturing just the filling.',
    gotcha: 'Nearly half the calories here come from fat in the beef and cheese, not the tortillas.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2706750/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central (taco filling) + standard corn tortillas to match the full plate shown',
    servingSize: { amount: 294, unit: 'g' },
    ingredients: ['Beef', 'Tortillas', 'Cheese', 'Tomatoes', 'Sauce', 'Lettuce'],
  },
  {
    id: 'usda-2708593-full',
    name: 'Chicken Quesadilla with Guac & Sour Cream',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/Chicken_Quesadilla_dish_at_Latin_Bistro_restaurant_Summit_NJ.JPG/960px-Chicken_Quesadilla_dish_at_Latin_Bistro_restaurant_Summit_NJ.JPG',
    cuisine: 'Mexican',
    macros: { calories: 520, protein: 22, carbs: 44, fat: 29 },
    explanation: 'The quesadilla itself is only half the story — the sour cream, guacamole, and salsa on the side add real calories most people don\'t count.',
    gotcha: 'Over half the fat on this whole plate comes from the dips, not the quesadilla.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2708593/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central (quesadilla) + standard dip portions to match the full plate shown',
    servingSize: { amount: 230, unit: 'g' },
    ingredients: ['Tortillas', 'Chicken', 'Cheese', 'Sour Cream', 'Guacamole', 'Salsa'],
  },
  {
    id: 'usda-2706433-full',
    name: 'Chicken Teriyaki with Rice & Vegetables',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Gfp-teriyaki-chicken.jpg/960px-Gfp-teriyaki-chicken.jpg',
    cuisine: 'Japanese',
    macros: { calories: 476, protein: 44, carbs: 54, fat: 10 },
    explanation: 'The chicken and sauce are actually lean — most of the calories here come from the cup of rice next to it.',
    gotcha: 'Strip out the rice and this is one of the leanest dishes around — 37g of protein for just 236 calories.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2706433/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central (chicken teriyaki) + standard rice and vegetable sides to match the full plate shown',
    servingSize: { amount: 403, unit: 'g' },
    ingredients: ['Chicken', 'Teriyaki Sauce', 'Rice', 'Broccoli', 'Carrots', 'Asparagus'],
  },
  {
    id: 'usda-2706470-full',
    name: 'Spaghetti with Meat Sauce',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Liat_Portal_for_Foodie_Disorder_-_Spaghetti_bolognese_with_peas.jpg/960px-Liat_Portal_for_Foodie_Disorder_-_Spaghetti_bolognese_with_peas.jpg',
    cuisine: 'Italian',
    macros: { calories: 589, protein: 29, carbs: 86, fat: 13 },
    explanation: 'A full bowl of pasta adds up fast — most of the calories here come from the noodles themselves, not the meat sauce on top.',
    gotcha: 'The peas are basically a rounding error — almost every calorie here is pasta and beef.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2706470/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central (meat sauce) + a standard pasta portion to match the full bowl shown',
    servingSize: { amount: 553, unit: 'g' },
    ingredients: ['Spaghetti', 'Beef', 'Tomato Sauce', 'Peas'],
  },
]

const existing = JSON.parse(fs.readFileSync(outPath, 'utf-8'))
const merged = [...existing.map(({ difficulty, ...rest }) => rest), ...NEW_DISHES]

const ranked = [...merged].sort((a, b) => trickinessScoreFromDish(a) - trickinessScoreFromDish(b))
const n = ranked.length
const base = Math.floor(n / 5)
const remainder = n % 5
const dishes = []
let cursor = 0
for (let tier = 1; tier <= 5; tier++) {
  const size = base + (tier <= remainder ? 1 : 0)
  for (let j = 0; j < size; j++) dishes.push({ ...ranked[cursor++], difficulty: tier })
}

fs.writeFileSync(outPath, JSON.stringify(dishes, null, 2) + '\n')

const tierCounts = [1, 2, 3, 4, 5].map((t) => dishes.filter((d) => d.difficulty === t).length)
console.log(`Merged ${NEW_DISHES.length} new dishes. Pool now has ${dishes.length} dishes.`)
console.log(`Difficulty tier counts (1-5): ${tierCounts.join(', ')}`)
