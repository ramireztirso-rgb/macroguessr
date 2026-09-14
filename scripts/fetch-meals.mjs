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

const NUTRIENT_MAP = {
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbohydrates',
  fat: 'Fat',
  fiber: 'Fiber',
}

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(text, max) {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}

function findNutrient(nutrients, name) {
  const match = nutrients.find((n) => n.name === name)
  return match ? Math.round(match.amount) : 0
}

async function fetchRecipes() {
  const url = new URL('https://api.spoonacular.com/recipes/complexSearch')
  url.searchParams.set('apiKey', apiKey)
  url.searchParams.set('number', String(MEAL_COUNT))
  url.searchParams.set('addRecipeInformation', 'true')
  url.searchParams.set('addRecipeNutrition', 'true')
  url.searchParams.set('instructionsRequired', 'true')
  url.searchParams.set('fillIngredients', 'false')
  url.searchParams.set('sort', 'random')

  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Spoonacular request failed: ${res.status} ${res.statusText}\n${body}`)
  }
  const data = await res.json()
  return data.results ?? []
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

  const rawDescription = recipe.summary ? stripHtml(recipe.summary) : ''
  const description = rawDescription
    ? truncate(rawDescription, 160)
    : `A ${(recipe.cuisines?.[0] || recipe.dishTypes?.[0] || 'tasty').toLowerCase()} dish.`

  const cuisine = recipe.cuisines?.[0] || recipe.dishTypes?.[0] || 'Meal'

  return {
    id: `spoon-${recipe.id}`,
    name: recipe.title,
    description,
    cuisine,
    macros,
    recipeQuery: `${recipe.title} recipe`,
    imageUrl: recipe.image,
    recipeUrl: recipe.sourceUrl || `https://spoonacular.com/recipes/${recipe.id}`,
    sourceCredit: 'Recipe via Spoonacular',
  }
}

async function main() {
  console.log(`Fetching ${MEAL_COUNT} recipes from Spoonacular...`)
  const recipes = await fetchRecipes()

  const meals = recipes
    .filter((r) => r.image && r.nutrition?.nutrients?.length)
    .map(toMeal)
    // Drop anything with obviously broken/zeroed nutrition data.
    .filter((m) => m.macros.calories > 0)

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
