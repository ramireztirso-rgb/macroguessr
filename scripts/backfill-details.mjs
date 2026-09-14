#!/usr/bin/env node
// Backfills servingSize + ingredients onto dishes fetched before those
// fields existed. Cheaper than a full re-fetch: looks recipes up directly
// by ID (already known from generatedDishes.json) instead of re-searching.
//
// Usage:
//   SPOONACULAR_API_KEY=your_key_here node scripts/backfill-details.mjs

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const apiKey = process.env.SPOONACULAR_API_KEY
if (!apiKey) {
  console.error('Missing SPOONACULAR_API_KEY.')
  process.exit(1)
}

const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'generatedDishes.json')

function titleCase(word) {
  return word.replace(/\b\w/g, (c) => c.toUpperCase())
}

async function fetchRecipeInfo(numericId) {
  const url = new URL(`https://api.spoonacular.com/recipes/${numericId}/information`)
  url.searchParams.set('apiKey', apiKey)
  url.searchParams.set('includeNutrition', 'true')
  const res = await fetch(url)
  if (res.status === 402) return 'quota-exhausted'
  if (!res.ok) return null
  return res.json()
}

async function main() {
  const dishes = JSON.parse(await readFile(outPath, 'utf8'))
  const needsBackfill = dishes.filter((d) => !d.servingSize || !d.ingredients)

  if (needsBackfill.length === 0) {
    console.log('Nothing to backfill — every dish already has servingSize + ingredients.')
    return
  }

  console.log(`Backfilling ${needsBackfill.length} dishes...`)
  let updated = 0
  for (const dish of needsBackfill) {
    const numericId = dish.id.replace(/^spoon-/, '')
    const info = await fetchRecipeInfo(numericId)
    if (info === 'quota-exhausted') {
      console.log('Quota exhausted — stopping, will pick up remaining dishes next time.')
      break
    }
    if (!info) {
      console.warn(`  skip ${dish.name}: request failed`)
      continue
    }

    const weightPerServing = info.nutrition?.weightPerServing
    if (weightPerServing?.amount && weightPerServing?.unit) {
      dish.servingSize = { amount: Math.round(weightPerServing.amount), unit: weightPerServing.unit }
    }

    const ingredients = info.nutrition?.ingredients ?? []
    if (ingredients.length > 0) {
      dish.ingredients = ingredients
        .filter((i) => i.name)
        .map((i) => titleCase(i.name))
        .filter((name, i, arr) => arr.indexOf(name) === i)
        .slice(0, 7)
    }

    updated++
    console.log(`  ✓ ${dish.name}`)
  }

  await writeFile(outPath, JSON.stringify(dishes, null, 2) + '\n')
  console.log(`Updated ${updated}/${needsBackfill.length} dishes.`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
