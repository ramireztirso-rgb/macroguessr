#!/usr/bin/env node
// Pulls real composite-dish nutrition (USDA FoodData Central, FNDDS survey
// data) + a real serving-size gram weight + a real ingredient breakdown, and
// candidate photos (Wikimedia Commons, no key needed). USDA has no photos,
// so this writes an INTERMEDIATE file with a few candidate photo URLs per
// dish for manual visual review (does the photo actually show the whole
// dish, matching the serving size?) before anything is merged into
// generatedDishes.json — see scripts/finalize-usda-dishes.mjs.
//
// Usage:
//   USDA_API_KEY=your_key_here node scripts/fetch-usda-dishes.mjs

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const apiKey = process.env.USDA_API_KEY
if (!apiKey) {
  console.error('Missing USDA_API_KEY. Get a free instant key at https://fdc.nal.usda.gov/api-key-signup and run:')
  console.error('  USDA_API_KEY=your_key_here node scripts/fetch-usda-dishes.mjs')
  process.exit(1)
}

const QUERIES = [
  // Desserts
  { q: 'donut', cuisine: 'Dessert', fdcId: 2708064 }, // Doughnut, chocolate
  { q: 'chocolate chip cookie', cuisine: 'Dessert' },
  { q: 'brownie', cuisine: 'Dessert' },
  { q: 'apple pie', cuisine: 'Dessert' },
  { q: 'ice cream sundae', cuisine: 'Dessert' },
  { q: 'cinnamon roll', cuisine: 'Dessert' },
  { q: 'chocolate cake', cuisine: 'Dessert', fdcId: 2707866 }, // Cake or cupcake, chocolate with chocolate icing, bakery
  // Drinks
  { q: 'milkshake', cuisine: 'Drink', fdcId: 2705508 }, // Milk shake, fast food, chocolate
  { q: 'latte', cuisine: 'Drink' },
  { q: 'hot chocolate with whipped cream', cuisine: 'Drink' },
  { q: 'smoothie', cuisine: 'Drink' },
  { q: 'cola', cuisine: 'Drink', fdcId: 2710541 }, // Soft drink, cola (non-alcoholic)
  { q: 'orange juice', cuisine: 'Drink' },
]

const NUTRIENT_NUMBERS = { calories: '208', protein: '203', fat: '204', carbs: '205' }

const HIDDEN_CALORIE_WORDS = [
  'oil', 'butter', 'mayonnaise', 'mayo', 'dressing', 'cheese', 'cream', 'sugar',
  'fried', 'batter', 'breaded', 'syrup', 'nuts', 'peanut', 'almond', 'cashew',
  'coconut', 'bacon', 'sauce', 'chocolate', 'caramel', 'frosting', 'icing', 'honey',
]
const PROTEIN_WORDS = [
  'chicken', 'beef', 'pork', 'turkey', 'tofu', 'egg', 'shrimp', 'salmon', 'tuna',
  'fish', 'bean', 'lentil', 'yogurt', 'steak', 'sausage', 'lamb', 'duck', 'paneer',
]

function titleCase(str) {
  // USDA descriptions are verbose ("Chicken, NS as to part, rotisserie, skin
  // not eaten") — keep just the leading, human-readable part.
  const short = str.split(',')[0]
  return short.replace(/\b\w/g, (c) => c.toUpperCase())
}

// Node's URLSearchParams encodes spaces as "+", which USDA's API server
// (nginx) rejects with a bare 400 for this endpoint — has to be %20.
function fixedUrl(url) {
  return url.toString().replace(/\+/g, '%20')
}

// Transient/flaky: the same exact request intermittently 400s (~40% of the
// time, observed empirically) then succeeds on retry — a network/proxy
// hiccup, not a real error. Retry a few times before giving up.
async function fetchWithRetry(url, options, retries = 4) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options)
    if (res.ok || res.status === 429 || res.status === 403) return res
    if (attempt < retries) await sleep(300 + attempt * 200)
  }
  return fetch(url, options) // final attempt, return whatever it is
}

const STOPWORDS = new Set(['with', 'and', 'a', 'the', 'of', 'in'])

// The search endpoint's relevance ranking can return a plainly wrong food
// (e.g. "chicken tikka masala" -> "Chicken, chicken roll, roasted") when
// there's no good FNDDS match — accept a result only if its description
// actually contains the query's significant words, rather than trusting
// whatever ranked #1.
function isPlausibleMatch(query, description) {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  const descLower = description.toLowerCase()
  return words.every((w) => descLower.includes(w))
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function searchFood(query) {
  const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search')
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('query', query)
  url.searchParams.set('dataType', 'Survey (FNDDS)')
  url.searchParams.set('pageSize', '10')
  const res = await fetchWithRetry(fixedUrl(url))
  if (res.status === 429 || res.status === 403) return 'quota-exhausted'
  if (!res.ok) {
    console.warn(`  ! search request failed for "${query}": ${res.status} ${res.statusText}`)
    return null
  }
  const data = await res.json()
  const candidates = data.foods ?? []
  return candidates.find((f) => isPlausibleMatch(query, f.description)) ?? null
}

async function fetchFoodDetail(fdcId) {
  const url = new URL(`https://api.nal.usda.gov/fdc/v1/food/${fdcId}`)
  url.searchParams.set('api_key', apiKey)
  const res = await fetchWithRetry(fixedUrl(url))
  if (res.status === 429 || res.status === 403) return 'quota-exhausted'
  if (!res.ok) {
    console.warn(`  ! detail request failed for fdcId=${fdcId}: ${res.status} ${res.statusText}`)
    return null
  }
  return res.json()
}

async function searchCommonsPhotos(query, limit = 4) {
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('format', 'json')
  url.searchParams.set('generator', 'search')
  url.searchParams.set('gsrsearch', `${query} dish food filetype:bitmap`)
  url.searchParams.set('gsrnamespace', '6')
  url.searchParams.set('gsrlimit', String(limit))
  url.searchParams.set('prop', 'imageinfo')
  url.searchParams.set('iiprop', 'url|mime')
  url.searchParams.set('iiurlwidth', '800')
  const res = await fetchWithRetry(fixedUrl(url), { headers: { 'User-Agent': 'MacroGuessDishFetcher/1.0 (educational game project)' } })
  if (!res.ok) return []
  const data = await res.json()
  const pages = Object.values(data.query?.pages ?? {})
  return pages
    .map((p) => p.imageinfo?.[0])
    .filter((info) => info && info.mime?.startsWith('image/') && info.mime !== 'image/svg+xml')
    .map((info) => info.thumburl || info.url)
}

function findNutrientPer100g(foodNutrients, number) {
  const match = foodNutrients.find((n) => n.nutrient?.number === number)
  return match ? match.amount : 0
}

// Prefer whichever named portion is closest to a normal single-sitting
// serving (~150g) instead of just taking the first one FNDDS lists — that
// first entry is sometimes a whole pie (2000g) or a 1-cubic-inch sample
// (7g), neither of which anyone would photograph as "the dish".
const TYPICAL_SERVING_G = 150
function bestPortion(foodPortions) {
  if (!foodPortions?.length) return null
  const named = foodPortions.filter((p) => p.portionDescription && p.portionDescription !== 'Quantity not specified')
  const pool = named.length > 0 ? named : foodPortions
  const pick = [...pool].sort(
    (a, b) => Math.abs(a.gramWeight - TYPICAL_SERVING_G) - Math.abs(b.gramWeight - TYPICAL_SERVING_G),
  )[0]
  return { amount: Math.round(pick.gramWeight), unit: 'g', description: pick.portionDescription }
}

function extractIngredients(inputFoods, max = 7) {
  if (!inputFoods?.length) return []
  const sorted = [...inputFoods].sort((a, b) => (b.ingredientWeight ?? 0) - (a.ingredientWeight ?? 0))
  const seen = new Set()
  const out = []
  for (const f of sorted) {
    const name = titleCase(f.ingredientDescription || f.foodDescription || '')
    if (!name || seen.has(name)) continue
    seen.add(name)
    out.push(name)
    if (out.length >= max) break
  }
  return out
}

function buildExplanation(ingredients, macros) {
  const nameLower = ingredients.map((i) => i.toLowerCase())
  const calorieSources = ingredients.filter((_, i) => HIDDEN_CALORIE_WORDS.some((w) => nameLower[i].includes(w))).slice(0, 3)
  const proteinSources = ingredients.filter((_, i) => PROTEIN_WORDS.some((w) => nameLower[i].includes(w))).slice(0, 1)

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

function buildGotcha(macros, servingSize) {
  const proteinDensity = macros.protein / Math.max(macros.calories / 100, 1)
  const fatPct = (macros.fat * 9 * 100) / Math.max(macros.calories, 1)
  if (proteinDensity >= 9) return `Surprisingly protein-dense: ${macros.protein}g of protein for just ${macros.calories} calories.`
  if (proteinDensity <= 2 && macros.protein < 10) return `Light on protein here — only ${macros.protein}g despite the plate size.`
  if (fatPct >= 50) return `Over half the calories here come from fat alone.`
  if (servingSize) return `This is a real ${servingSize.description} serving — USDA's own measured survey data, not a recipe blog's guess.`
  return `Based on real USDA dietary survey data for this exact dish.`
}

async function main() {
  const results = []
  for (const { q, cuisine, fdcId: forcedFdcId } of QUERIES) {
    await sleep(350) // avoid USDA's burst rate limit (separate from the documented hourly quota)
    let fdcId = forcedFdcId
    if (!fdcId) {
      console.log(`Searching USDA: "${q}"...`)
      const food = await searchFood(q)
      if (food === 'quota-exhausted') {
        console.warn('  USDA quota/rate limit hit — stopping.')
        break
      }
      if (!food) {
        console.warn(`  skip "${q}": no USDA match`)
        continue
      }
      fdcId = food.fdcId
    } else {
      console.log(`Fetching USDA fdcId=${fdcId} for "${q}" (manual override)...`)
    }

    await sleep(350)
    const detail = await fetchFoodDetail(fdcId)
    if (detail === 'quota-exhausted') {
      console.warn('  USDA quota/rate limit hit — stopping.')
      break
    }
    if (!detail) {
      console.warn(`  skip "${q}": detail fetch failed`)
      continue
    }

    const per100 = {
      calories: findNutrientPer100g(detail.foodNutrients, NUTRIENT_NUMBERS.calories),
      protein: findNutrientPer100g(detail.foodNutrients, NUTRIENT_NUMBERS.protein),
      fat: findNutrientPer100g(detail.foodNutrients, NUTRIENT_NUMBERS.fat),
      carbs: findNutrientPer100g(detail.foodNutrients, NUTRIENT_NUMBERS.carbs),
    }
    const servingSize = bestPortion(detail.foodPortions)
    if (!servingSize || per100.calories <= 0) {
      console.warn(`  skip "${q}": no usable portion/nutrition data`)
      continue
    }
    const scale = servingSize.amount / 100
    const macros = {
      calories: Math.round(per100.calories * scale),
      protein: Math.round(per100.protein * scale),
      carbs: Math.round(per100.carbs * scale),
      fat: Math.round(per100.fat * scale),
    }
    const ingredients = extractIngredients(detail.inputFoods)

    console.log(`  found: ${detail.description} — ${macros.calories}kcal/${macros.protein}g (serving: ${servingSize.description}, ${servingSize.amount}g)`)
    const photoCandidates = await searchCommonsPhotos(q)

    results.push({
      id: `usda-${detail.fdcId}`,
      name: detail.description,
      cuisine,
      macros,
      servingSize: { amount: servingSize.amount, unit: servingSize.unit },
      ingredients,
      explanation: buildExplanation(ingredients, macros),
      gotcha: buildGotcha(macros, servingSize),
      tags: [],
      recipeUrl: `https://fdc.nal.usda.gov/food-details/${detail.fdcId}/nutrients`,
      sourceCredit: 'Nutrition data via USDA FoodData Central',
      photoCandidates,
      imageUrl: null, // filled in manually after visual review
      photoCredit: null,
    })
  }

  const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '.usda-candidates.json')
  await writeFile(outPath, JSON.stringify(results, null, 2) + '\n')
  console.log(`\nWrote ${results.length} candidate dishes (with photo options) to ${outPath}`)
  console.log('Next: review each dish\'s photoCandidates and finalize into generatedDishes.json.')
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
