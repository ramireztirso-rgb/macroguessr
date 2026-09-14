#!/usr/bin/env node
// Fetches a curated pool of real recipes (photo + computed nutrition + real
// recipe link) from Spoonacular and writes them to src/data/generatedMeals.json.
// This runs once (or whenever you want to refresh/grow the pool) as a build-time
// step — the app itself never calls Spoonacular at runtime, so no API key ships
// in the client bundle and no per-player quota is spent.
//
// Usage:
//   SPOONACULAR_API_KEY=your_key_here node scripts/fetch-meals.mjs
//
// Options (env vars):
//   MEAL_COUNT   how many recipes to fetch (default 45)

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const apiKey = process.env.SPOONACULAR_API_KEY
if (!apiKey) {
  console.error('Missing SPOONACULAR_API_KEY. Get a free key at https://spoonacular.com/food-api and run:')
  console.error('  SPOONACULAR_API_KEY=your_key_here node scripts/fetch-meals.mjs')
  process.exit(1)
}

const MEAL_COUNT = Number(process.env.MEAL_COUNT || 45)

// Only meal-shaped dish types — excludes "beverage"/"drink" (cocktails, etc.)
// and "sauce"/"marinade" which aren't something you'd guess whole-plate macros for.
const MEAL_TYPES = ['main course', 'breakfast', 'salad', 'soup', 'side dish']

const NUTRIENT_MAP = {
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbohydrates',
  fat: 'Fat',
  fiber: 'Fiber',
}

const CUISINE_LABELS = {
  'main course': 'Main Course',
  'side dish': 'Side Dish',
  'morning meal': 'Breakfast',
  breakfast: 'Breakfast',
  brunch: 'Brunch',
  antipasti: 'Appetizer',
  appetizer: 'Appetizer',
  salad: 'Salad',
  soup: 'Soup',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  fingerfood: 'Snack',
}

function findNutrient(nutrients, name) {
  const match = nutrients.find((n) => n.name === name)
  return match ? Math.round(match.amount) : 0
}

async function fetchRecipesByType(type, number) {
  const url = new URL('https://api.spoonacular.com/recipes/complexSearch')
  url.searchParams.set('apiKey', apiKey)
  url.searchParams.set('number', String(number))
  url.searchParams.set('type', type)
  url.searchParams.set('addRecipeInformation', 'true')
  url.searchParams.set('addRecipeNutrition', 'true')
  url.searchParams.set('instructionsRequired', 'true')
  url.searchParams.set('fillIngredients', 'false')
  url.searchParams.set('sort', 'random')

  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Spoonacular request failed for type="${type}": ${res.status} ${res.statusText}\n${body}`)
  }
  const data = await res.json()
  return data.results ?? []
}

function cuisineLabel(recipe) {
  const raw = recipe.cuisines?.[0] || recipe.dishTypes?.[0] || 'Meal'
  return CUISINE_LABELS[raw.toLowerCase()] || raw.replace(/\b\w/g, (c) => c.toUpperCase())
}

// Built from real structured fields (readyInMinutes, servings, cuisine/dish
// type) instead of Spoonacular's SEO-style `summary`, which is full of ad
// copy ("$X per serving", "covers N% of daily requirements") and gets
// awkwardly truncated mid-sentence at any reasonable length.
function buildDescription(recipe) {
  const cuisine = recipe.cuisines?.[0]
  const dishType = recipe.dishTypes?.[0]
  const kind = cuisine ? `${cuisine} ${dishType || 'dish'}` : dishType || 'dish'
  const time = recipe.readyInMinutes ? `Ready in about ${recipe.readyInMinutes} minutes.` : ''
  const servings = recipe.servings ? `Serves ${recipe.servings}.` : ''
  return [`A ${kind}.`, time, servings].filter(Boolean).join(' ')
}

function toMeal(recipe) {
  const nutrients = recipe.nutrition?.nutrients ?? []
  const macros = {
    calories: findNutrient(nutrients, NUTRIENT_MAP.calories),
    protein: findNutrient(nutrients, NUTRIENT_MAP.protein),
    carbs: findNutrient(nutrients, NUTRIENT_MAP.carbs),
    fat: findNutrient(nutrients, NUTRIENT_MAP.fat),
    fiber: findNutrient(nutrients, NUTRIENT_MAP.fiber),
  }

  return {
    id: `spoon-${recipe.id}`,
    name: recipe.title,
    description: buildDescription(recipe),
    cuisine: cuisineLabel(recipe),
    macros,
    recipeQuery: `${recipe.title} recipe`,
    imageUrl: recipe.image,
    recipeUrl: recipe.sourceUrl || `https://spoonacular.com/recipes/${recipe.id}`,
    sourceCredit: 'Recipe via Spoonacular',
  }
}

function isDrinkOrCocktail(recipe) {
  const dishTypes = (recipe.dishTypes || []).map((t) => t.toLowerCase())
  if (dishTypes.some((t) => t.includes('drink') || t.includes('beverage') || t.includes('cocktail'))) return true
  if ((recipe.sourceUrl || '').includes('cocktaildb.com')) return true
  return false
}

async function main() {
  console.log(`Fetching recipes from Spoonacular across ${MEAL_TYPES.length} meal types...`)
  const perType = Math.ceil(MEAL_COUNT / MEAL_TYPES.length) + 2 // small buffer for filtering/dedupe
  const batches = await Promise.all(MEAL_TYPES.map((type) => fetchRecipesByType(type, perType)))
  const byId = new Map()
  for (const recipe of batches.flat()) {
    if (!byId.has(recipe.id)) byId.set(recipe.id, recipe)
  }
  const recipes = [...byId.values()]

  const meals = recipes
    .filter((r) => r.image && r.nutrition?.nutrients?.length && !isDrinkOrCocktail(r))
    .map(toMeal)
    // Drop anything with obviously broken/zeroed nutrition data.
    .filter((m) => m.macros.calories > 0)
    .slice(0, MEAL_COUNT)

  if (meals.length === 0) {
    throw new Error('No usable recipes returned — check the API key and try again.')
  }

  const outPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'src',
    'data',
    'generatedMeals.json',
  )
  await writeFile(outPath, JSON.stringify(meals, null, 2) + '\n')
  console.log(`Wrote ${meals.length} real meals to ${path.relative(process.cwd(), outPath)}`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
