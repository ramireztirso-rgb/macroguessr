// Second USDA batch: desserts + drinks, per user request. Same manual
// photo-review process as finalize-usda-dishes.mjs — reviewed each photo
// against its claimed serving size, rescaled two dishes (cookies, orange
// juice) to match what's actually shown, and swapped the "milkshake" entry
// for real USDA "chocolate milk" data once the best photo we could find
// turned out to be a glass of chocolate milk rather than a frothy shake.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'generatedDishes.json')

const HEALTHY_WORDS = ['salad', 'bowl', 'wrap', 'smoothie', 'avocado', 'veggie', 'grilled', 'fresh', 'parfait', 'toast']
const INDULGENT_WORDS = [
  'cheeseburger', 'fries', 'fried', 'milkshake', 'pizza', 'burger', 'wings', 'nachos',
  'cake', 'donut', 'lava', 'cheesecake', 'brownie', 'frappuccino', 'sundae', 'cookie', 'cola', 'pie',
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
    id: 'usda-2708064',
    name: 'Chocolate Donut',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Dunkin-Donuts-Chocolate-Glazed.jpg/960px-Dunkin-Donuts-Chocolate-Glazed.jpg',
    cuisine: 'Dessert',
    macros: { calories: 313, protein: 4, carbs: 39, fat: 17 },
    explanation: 'Most of the calories come from the fried dough and chocolate glaze. This dish is fairly light on protein.',
    gotcha: 'This is a real 1 donut serving — USDA measured survey data, not a recipe blog\'s guess.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2708064/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central',
    servingSize: { amount: 75, unit: 'g' },
    ingredients: ['Doughnuts', 'Frostings', 'Cocoa'],
  },
  {
    id: 'usda-2707909-6ct',
    name: 'Chocolate Chip Cookies (6)',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/Chocolate_chip_cookies_on_a_white_plate_and_dark_background.jpg/960px-Chocolate_chip_cookies_on_a_white_plate_and_dark_background.jpg',
    cuisine: 'Dessert',
    macros: { calories: 887, protein: 9, carbs: 118, fat: 44 },
    explanation: 'A whole plate of cookies adds up fast — most people picture one cookie, not six, when they hear "chocolate chip cookies."',
    gotcha: 'One cookie alone is only about 150 calories — it\'s the plateful that gets you.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2707909/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central, scaled up from a single-cookie serving to match the full plate shown',
    servingSize: { amount: 180, unit: 'g' },
    ingredients: ['Cookies'],
  },
  {
    id: 'usda-2707907',
    name: 'Brownie',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/Brownie_on_plate.jpg/960px-Brownie_on_plate.jpg',
    cuisine: 'Dessert',
    macros: { calories: 365, protein: 4, carbs: 58, fat: 15 },
    explanation: 'Most of the calories come from the carbs and fat in this dish. This dish is fairly light on protein.',
    gotcha: 'Light on protein here — only 4g despite the size.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2707907/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central',
    servingSize: { amount: 90, unit: 'g' },
    ingredients: ['Brownie'],
  },
  {
    id: 'usda-2707995',
    name: 'Apple Pie (1 Slice)',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/65/Slice_of_apple_pie.jpg/960px-Slice_of_apple_pie.jpg',
    cuisine: 'Dessert',
    macros: { calories: 444, protein: 4, carbs: 56, fat: 23 },
    explanation: 'Most of the calories come from the apple filling and sugar, not the crust. This dish is fairly light on protein.',
    gotcha: 'This is a real 1 regular slice serving — USDA measured survey data, not a recipe blog\'s guess.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2707995/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central',
    servingSize: { amount: 150, unit: 'g' },
    ingredients: ['Apples', 'Pie Crust', 'Sugars', 'Butter'],
  },
  {
    id: 'usda-2707667',
    name: 'Cinnamon Roll',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Rollo_de_canela_%28Cinnamon_roll%29.jpg/960px-Rollo_de_canela_%28Cinnamon_roll%29.jpg',
    cuisine: 'Dessert',
    macros: { calories: 569, protein: 9, carbs: 78, fat: 25 },
    explanation: 'Most of the calories come from the carbs and fat in this dish. This dish is fairly light on protein.',
    gotcha: 'This is a real 1 large roll serving — USDA measured survey data, not a recipe blog\'s guess.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2707667/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central',
    servingSize: { amount: 153, unit: 'g' },
    ingredients: ['Sweet Rolls'],
  },
  {
    id: 'usda-2707866',
    name: 'Chocolate Layer Cake (1 Slice)',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/2025-01-26_16_53_04_A_slice_of_chocolate_raspberry_3-layer_cake_in_the_Mountainview_section_of_Ewing_Township%2C_Mercer_County%2C_New_Jersey.jpg/960px-2025-01-26_16_53_04_A_slice_of_chocolate_raspberry_3-layer_cake_in_the_Mountainview_section_of_Ewing_Township%2C_Mercer_County%2C_New_Jersey.jpg',
    cuisine: 'Dessert',
    macros: { calories: 587, protein: 6, carbs: 89, fat: 26 },
    explanation: 'Most of the calories come from the frosting, not the cake itself. This dish is fairly light on protein.',
    gotcha: 'This is a real 1 large slice serving — USDA measured survey data, not a recipe blog\'s guess.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2707866/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central',
    servingSize: { amount: 170, unit: 'g' },
    ingredients: ['Cake', 'Chocolate Frosting'],
  },
  {
    id: 'usda-2705467',
    name: 'Chocolate Milk',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/New_chocolate_milk.JPG/960px-New_chocolate_milk.JPG',
    cuisine: 'Drink',
    macros: { calories: 206, protein: 8, carbs: 26, fat: 8 },
    explanation: 'A full glass adds up — most people underestimate how much sugar is packed into a cup of chocolate milk.',
    gotcha: 'This is a real 1 cup serving — USDA measured survey data, not a recipe blog\'s guess.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2705467/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central',
    servingSize: { amount: 248, unit: 'g' },
    ingredients: ['Milk', 'Chocolate Syrup'],
  },
  {
    id: 'usda-2710386',
    name: 'Latte',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9f/Caffe_Latte_cup.jpg/960px-Caffe_Latte_cup.jpg',
    cuisine: 'Drink',
    macros: { calories: 103, protein: 7, carbs: 10, fat: 4 },
    explanation: 'Most of the calories here come from the steamed milk, not the espresso itself.',
    gotcha: 'This is a real 1 cup (8 fl oz) serving — USDA measured survey data, not a recipe blog\'s guess.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2710386/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central',
    servingSize: { amount: 240, unit: 'g' },
    ingredients: ['Milk', 'Espresso'],
  },
  {
    id: 'usda-2705476',
    name: 'Hot Chocolate with Whipped Cream',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/14/Hot_chocolate_mug_with_whipped_cream.jpg',
    cuisine: 'Drink',
    macros: { calories: 250, protein: 7, carbs: 40, fat: 7 },
    explanation: 'Most of the calories come from the cocoa mix and the whipped cream on top. This dish is fairly light on protein.',
    gotcha: 'This is a real 1 cup serving — USDA measured survey data, not a recipe blog\'s guess.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2705476/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central',
    servingSize: { amount: 248, unit: 'g' },
    ingredients: ['Hot Chocolate / Cocoa', 'Whipped Cream'],
  },
  {
    id: 'usda-2710541-can',
    name: 'Cola (1 Can)',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Coca-cola_50cl_can_-_Italia.jpg/960px-Coca-cola_50cl_can_-_Italia.jpg',
    cuisine: 'Drink',
    macros: { calories: 156, protein: 0, carbs: 39, fat: 1 },
    explanation: 'Every calorie here is straight sugar — soda is basically flavored sugar water.',
    gotcha: 'This is a real 1 can (12 fl oz) serving — USDA measured survey data, not a recipe blog\'s guess.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2710541/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central',
    servingSize: { amount: 372, unit: 'g' },
    ingredients: ['Carbonated Water', 'Sugar'],
  },
  {
    id: 'usda-2709186-glass',
    name: 'Orange Juice (1 Glass)',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Orange_juice_1_edit1.jpg/960px-Orange_juice_1_edit1.jpg',
    cuisine: 'Drink',
    macros: { calories: 117, protein: 2, carbs: 25, fat: 0 },
    explanation: 'It\'s "just juice," but a full glass has almost as much sugar as a can of soda — it\'s just naturally occurring.',
    gotcha: 'Zero fat, but the carbs add up fast for something that feels healthy.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2709186/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central, scaled up from a small juice-box serving to match the full glass shown',
    servingSize: { amount: 248, unit: 'g' },
    ingredients: ['Orange Juice'],
  },
  {
    id: 'usda-2705661',
    name: 'Ice Cream Sundae (Hot Fudge)',
    imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/Ben_and_Jerry%27s_Hot_Fudge_Sundae_%2819384608984%29.jpg/960px-Ben_and_Jerry%27s_Hot_Fudge_Sundae_%2819384608984%29.jpg',
    cuisine: 'Dessert',
    macros: { calories: 437, protein: 7, carbs: 57, fat: 20 },
    explanation: 'Most of the calories come from the ice cream and fudge sauce together — the whipped cream on top is a smaller share than it looks.',
    gotcha: 'This is a real 1 sundae serving — USDA measured survey data, not a recipe blog\'s guess.',
    tags: [],
    recipeUrl: 'https://fdc.nal.usda.gov/food-details/2705661/nutrients',
    sourceCredit: 'Nutrition data via USDA FoodData Central',
    servingSize: { amount: 180, unit: 'g' },
    ingredients: ['Ice Cream', 'Hot Fudge Syrup', 'Whipped Cream'],
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
