#!/usr/bin/env node
// Fetches a curated, cuisine/archetype-diverse pool of real dishes from
// Spoonacular (photo + real ingredient list + computed nutrition + real
// recipe link) and writes them to src/data/generatedDishes.json, with an
// auto-assigned difficulty tier (1-5) and an auto-generated "why" +
// "gotcha" explanation grounded in the dish's real ingredients/macros.
//
// This is a one-time/occasional dev step, not a runtime call — no API key
// ships in the client bundle, no per-player quota is spent.
//
// Usage:
//   SPOONACULAR_API_KEY=your_key_here node scripts/fetch-dishes.mjs

import { writeFile, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const apiKey = process.env.SPOONACULAR_API_KEY
if (!apiKey) {
  console.error('Missing SPOONACULAR_API_KEY. Get a free key at https://spoonacular.com/food-api and run:')
  console.error('  SPOONACULAR_API_KEY=your_key_here node scripts/fetch-dishes.mjs')
  process.exit(1)
}

// One search per query, each hand-picked to cover the requested cuisines
// and "gotcha" archetypes (healthy-looking-but-not, indulgent-but-honest,
// high-protein-surprise, huge-portion, etc.) rather than a blind random pull.
const QUERIES = [
  { q: 'cheeseburger', cuisine: 'American' },
  { q: 'buffalo wings', cuisine: 'American' },
  { q: 'mac and cheese', cuisine: 'American' },
  { q: 'philly cheesesteak', cuisine: 'American' },
  { q: 'cobb salad', cuisine: 'American' },
  { q: 'chicken burrito bowl', cuisine: 'Mexican' },
  { q: 'carne asada tacos', cuisine: 'Mexican' },
  { q: 'nachos', cuisine: 'Mexican' },
  { q: 'chicken quesadilla', cuisine: 'Mexican' },
  { q: 'chicken katsu curry', cuisine: 'Japanese' },
  { q: 'salmon sushi roll', cuisine: 'Japanese' },
  { q: 'ramen', cuisine: 'Japanese' },
  { q: 'tempura udon', cuisine: 'Japanese' },
  { q: 'bibimbap', cuisine: 'Korean' },
  { q: 'korean fried chicken', cuisine: 'Korean' },
  { q: 'bulgogi', cuisine: 'Korean' },
  { q: 'kung pao chicken', cuisine: 'Chinese' },
  { q: 'fried rice', cuisine: 'Chinese' },
  { q: 'orange chicken', cuisine: 'Chinese' },
  { q: 'pad thai', cuisine: 'Thai' },
  { q: 'green curry', cuisine: 'Thai' },
  { q: 'thai basil chicken', cuisine: 'Thai' },
  { q: 'butter chicken', cuisine: 'Indian' },
  { q: 'chicken tikka masala', cuisine: 'Indian' },
  { q: 'saag paneer', cuisine: 'Indian' },
  { q: 'fettuccine alfredo', cuisine: 'Italian' },
  { q: 'margherita pizza', cuisine: 'Italian' },
  { q: 'lasagna', cuisine: 'Italian' },
  { q: 'tiramisu', cuisine: 'Italian' },
  { q: 'falafel wrap', cuisine: 'Mediterranean' },
  { q: 'chicken gyro', cuisine: 'Mediterranean' },
  { q: 'greek salad', cuisine: 'Mediterranean' },
  { q: 'hummus platter', cuisine: 'Mediterranean' },
  { q: 'cheesecake', cuisine: 'Dessert' },
  { q: 'chocolate lava cake', cuisine: 'Dessert' },
  { q: 'donut', cuisine: 'Dessert' },
  { q: 'brownie', cuisine: 'Dessert' },
  { q: 'acai bowl', cuisine: 'Breakfast' },
  { q: 'avocado toast', cuisine: 'Breakfast' },
  { q: 'pancakes', cuisine: 'Breakfast' },
  { q: 'breakfast burrito', cuisine: 'Breakfast' },
  { q: 'granola parfait', cuisine: 'Breakfast' },
  { q: 'smoothie bowl', cuisine: 'Snack' },
  { q: 'protein shake', cuisine: 'Snack' },
  { q: 'caramel frappuccino', cuisine: 'Drink' },
  { q: 'trail mix', cuisine: 'Snack' },
]

const NUTRIENT_MAP = { calories: 'Calories', protein: 'Protein', carbs: 'Carbohydrates', fat: 'Fat' }

const HIDDEN_CALORIE_WORDS = [
  'oil', 'butter', 'mayonnaise', 'mayo', 'dressing', 'cheese', 'cream', 'sugar',
  'fried', 'batter', 'breaded', 'syrup', 'nuts', 'peanut', 'almond', 'cashew',
  'coconut', 'bacon', 'sauce', 'chocolate', 'caramel', 'frosting', 'icing', 'honey',
]
const PROTEIN_WORDS = [
  'chicken', 'beef', 'pork', 'turkey', 'tofu', 'egg', 'shrimp', 'salmon', 'tuna',
  'fish', 'bean', 'lentil', 'yogurt', 'protein', 'steak', 'sausage', 'lamb', 'duck', 'paneer',
]
const HEALTHY_WORDS = ['salad', 'bowl', 'wrap', 'smoothie', 'avocado', 'veggie', 'grilled', 'fresh', 'parfait', 'toast']
const INDULGENT_WORDS = [
  'cheeseburger', 'fries', 'fried', 'milkshake', 'pizza', 'burger', 'wings', 'nachos',
  'cake', 'donut', 'lava', 'cheesecake', 'brownie', 'frappuccino',
]

function findNutrient(nutrients, name) {
  const match = nutrients.find((n) => n.name === name)
  return match ? Math.round(match.amount) : 0
}

function titleCase(word) {
  return word.replace(/\b\w/g, (c) => c.toUpperCase())
}

async function fetchDish({ q, cuisine }) {
  const url = new URL('https://api.spoonacular.com/recipes/complexSearch')
  url.searchParams.set('apiKey', apiKey)
  url.searchParams.set('query', q)
  url.searchParams.set('number', '1')
  url.searchParams.set('addRecipeInformation', 'true')
  url.searchParams.set('addRecipeNutrition', 'true')
  url.searchParams.set('fillIngredients', 'true')
  url.searchParams.set('instructionsRequired', 'true')
  url.searchParams.set('sort', 'popularity')

  const res = await fetch(url)
  if (res.status === 402) {
    console.warn(`  quota exhausted at "${q}" — stopping this run, will retry it next time.`)
    return 'quota-exhausted'
  }
  if (!res.ok) {
    console.warn(`  skip "${q}": ${res.status} ${res.statusText}`)
    return null
  }
  const data = await res.json()
  const recipe = data.results?.[0]
  if (!recipe) {
    console.warn(`  skip "${q}": no results`)
    return null
  }
  return { recipe, cuisine, query: q }
}

// Condiments/rubs/marinades can contain a protein word as a substring
// (e.g. "steak sauce", "pork rub") without actually being a protein source.
const NON_PROTEIN_CONTAINERS = ['sauce', 'rub', 'seasoning', 'marinade', 'dressing', 'glaze']

function extractIngredientHits(recipe, wordList, { excludeNonProteinContainers = false } = {}) {
  const ingredients = recipe.nutrition?.ingredients ?? []
  const names = ingredients.map((i) => i.name?.toLowerCase() ?? '')
  const hits = new Set()
  for (const name of names) {
    if (excludeNonProteinContainers && NON_PROTEIN_CONTAINERS.some((w) => name.includes(w))) continue
    for (const word of wordList) {
      if (name.includes(word)) hits.add(name)
    }
  }
  return [...hits].slice(0, 3).map(titleCase)
}

function buildExplanation(recipe, macros) {
  const calorieSources = extractIngredientHits(recipe, HIDDEN_CALORIE_WORDS)
  const proteinSources = extractIngredientHits(recipe, PROTEIN_WORDS, { excludeNonProteinContainers: true })

  const calorieLine = calorieSources.length
    ? `Most of the calories come from the ${calorieSources.join(', ')}.`
    : `Most of the calories come from the carbs and fat in this dish.`
  const proteinLine = proteinSources.length
    ? `Protein here mostly comes from the ${proteinSources[0]}.`
    : macros.protein > 15
      ? `The protein adds up across several ingredients.`
      : `This dish is fairly light on protein.`

  return `${calorieLine} ${proteinLine}`
}

function buildGotcha({ recipe, macros, looksHealthy, looksIndulgent, proteinDensity, fatPct }) {
  if (looksHealthy && macros.calories >= 600) {
    return `This "healthy" dish clocks in at ${macros.calories} calories — more than a lot of indulgent options.`
  }
  if (looksIndulgent && macros.calories < 450) {
    return `Despite how indulgent this looks, it's actually a fairly moderate ${macros.calories} calories.`
  }
  if (proteinDensity >= 9) {
    return `Surprisingly protein-dense: ${macros.protein}g of protein for just ${macros.calories} calories.`
  }
  if (proteinDensity <= 2 && macros.protein < 10) {
    return `Don't let the plate size fool you — this dish is very light on protein (${macros.protein}g).`
  }
  if (fatPct >= 55) {
    return `Over half the calories here come from fat alone.`
  }
  return `Servings like this (${recipe.servings ?? 1}) can pack more calories than they look.`
}

// Ranks every candidate by a "trickiness" score and splits into 5 equal
// tiers, so difficulty comes from how deceptive the dish actually is rather
// than a fixed threshold that might leave a tier empty.
const MIN_PLAUSIBLE_CALORIES = 120 // below this, it's almost certainly a scraping/serving-size glitch, not a real dish.

const NAME_FLUFF = [
  /^how to make( the)?\s+/i,
  /^(excellent|amazing|lick-your-plate|great|easy|quick|simple|best|ultimate|perfect|classic|homemade|delicious|no fail and easy)\s+/i,
]

function cleanName(name) {
  let cleaned = name
  let changed = true
  while (changed) {
    changed = false
    for (const re of NAME_FLUFF) {
      if (re.test(cleaned)) {
        cleaned = cleaned.replace(re, '')
        changed = true
      }
    }
  }
  return cleaned.trim()
}

// Difficulty is recomputed from plain Dish fields (works for both
// newly-fetched and already-saved dishes) so growing the pool incrementally
// across multiple days re-ranks everyone together instead of drifting.
function trickinessScoreFromDish(dish) {
  const nameLower = dish.name.toLowerCase()
  const looksHealthy = HEALTHY_WORDS.some((w) => nameLower.includes(w))
  const looksIndulgent = INDULGENT_WORDS.some((w) => nameLower.includes(w))
  const proteinDensity = dish.macros.protein / Math.max(dish.macros.calories / 100, 1)
  const fatPct = (dish.macros.fat * 9 * 100) / Math.max(dish.macros.calories, 1)
  const hiddenKeywordCount = dish.tags.includes('hidden-calories') ? 2 : 0

  let score = 0
  if (looksHealthy) score += dish.macros.calories / 40 + hiddenKeywordCount * 8
  if (looksIndulgent) score -= 15
  score += Math.abs(fatPct - 30) * 0.4
  if (proteinDensity >= 9) score += 12
  if (proteinDensity <= 2) score += 8
  return score
}

const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'generatedDishes.json')
// Local-only cursor so incremental daily runs (free-tier quota) move through
// the query list instead of re-spending points on dishes already fetched.
const progressPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '.fetch-dishes-progress.json')

async function loadJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

async function main() {
  const existingDishes = await loadJson(outPath, [])
  const progress = await loadJson(progressPath, { attemptedQueries: [] })
  const attempted = new Set(progress.attemptedQueries)
  const existingIds = new Set(existingDishes.map((d) => d.id))

  const remainingQueries = QUERIES.filter((q) => !attempted.has(q.q))
  const batchSize = Number(process.env.QUERY_COUNT || 20)
  const batch = remainingQueries.slice(0, batchSize)

  if (batch.length === 0) {
    console.log('All queries have already been attempted. Delete scripts/.fetch-dishes-progress.json to start over.')
    return
  }

  console.log(`Fetching ${batch.length} dishes from Spoonacular (${remainingQueries.length} queries left in the list)...`)
  const fetched = []
  for (const entry of batch) {
    const result = await fetchDish(entry)
    if (result === 'quota-exhausted') break
    // Only mark "attempted" on a real response (incl. empty results) — a
    // 402 (quota exhausted) means we never really tried, so retry it next run.
    attempted.add(entry.q)
    if (result) fetched.push(result)
  }
  await writeFile(progressPath, JSON.stringify({ attemptedQueries: [...attempted] }, null, 2))

  const newDishes = fetched
    .filter(({ recipe }) => recipe.image && recipe.nutrition?.nutrients?.length)
    .map(({ recipe, cuisine }) => {
      const nutrients = recipe.nutrition.nutrients
      const macros = {
        calories: findNutrient(nutrients, NUTRIENT_MAP.calories),
        protein: findNutrient(nutrients, NUTRIENT_MAP.protein),
        carbs: findNutrient(nutrients, NUTRIENT_MAP.carbs),
        fat: findNutrient(nutrients, NUTRIENT_MAP.fat),
      }
      if (macros.calories < MIN_PLAUSIBLE_CALORIES) return null

      const nameLower = recipe.title.toLowerCase()
      const looksHealthy = HEALTHY_WORDS.some((w) => nameLower.includes(w))
      const looksIndulgent = INDULGENT_WORDS.some((w) => nameLower.includes(w))
      const hiddenKeywordCount = extractIngredientHits(recipe, HIDDEN_CALORIE_WORDS).length
      const proteinDensity = macros.protein / Math.max(macros.calories / 100, 1)
      const fatPct = recipe.nutrition.caloricBreakdown?.percentFat ?? (macros.fat * 9 * 100) / Math.max(macros.calories, 1)

      const tags = []
      if (looksHealthy && macros.calories >= 600) tags.push('deceptive-healthy')
      if (hiddenKeywordCount > 0) tags.push('hidden-calories')
      if (proteinDensity >= 9) tags.push('high-protein')
      if (proteinDensity <= 2) tags.push('low-protein')
      if ((recipe.servings ?? 1) >= 4) tags.push('restaurant-portion')
      if (fatPct >= 50) tags.push('high-fat')

      return {
        id: `spoon-${recipe.id}`,
        name: cleanName(recipe.title),
        imageUrl: recipe.image,
        cuisine,
        macros,
        explanation: buildExplanation(recipe, macros),
        gotcha: buildGotcha({ recipe, macros, looksHealthy, looksIndulgent, proteinDensity, fatPct }),
        tags,
        recipeUrl: recipe.sourceUrl || `https://spoonacular.com/recipes/${recipe.id}`,
        sourceCredit: 'Recipe via Spoonacular',
      }
    })
    .filter(Boolean)
    .filter((d) => !existingIds.has(d.id))

  const merged = [...existingDishes, ...newDishes]

  // Rank the WHOLE pool by trickiness together and split into 5 tiers, so
  // difficulty stays consistent as the pool grows across multiple runs.
  const ranked = [...merged].sort((a, b) => trickinessScoreFromDish(a) - trickinessScoreFromDish(b))
  const tierSize = Math.ceil(ranked.length / 5)
  const dishes = ranked.map((d, i) => ({ ...d, difficulty: Math.min(5, Math.floor(i / tierSize) + 1) }))

  if (dishes.length === 0) {
    throw new Error('No usable dishes yet — check the API key and try again.')
  }

  await writeFile(outPath, JSON.stringify(dishes, null, 2) + '\n')

  const tierCounts = [1, 2, 3, 4, 5].map((t) => dishes.filter((d) => d.difficulty === t).length)
  console.log(`Added ${newDishes.length} new dishes (${dishes.length} total) to ${path.relative(process.cwd(), outPath)}`)
  console.log(`Difficulty tier counts (1-5): ${tierCounts.join(', ')}`)
  if (remainingQueries.length > batch.length) {
    console.log(`${remainingQueries.length - batch.length} queries left — run again (tomorrow, if quota is spent) to keep growing the pool.`)
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
