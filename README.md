# MacroGuessr

A daily trivia game: guess the calories, protein, carbs, fat, and fiber of a
meal. The closer your guess, the higher your score. Get close enough (65+)
and the recipe unlocks; if you're way off, you get a lighthearted roast
instead of the recipe — never a real dunk.

Inspired by daily games like Wordle/Worldle: everyone who plays on a given
calendar day gets the same 5 meals, picked deterministically from a shared
pool so results are comparable and shareable.

## How it works

- `src/data/meals.ts` — the meal pool. Uses `src/data/generatedMeals.json`
  (real recipe photos + computed nutrition + real recipe links, fetched from
  Spoonacular — see below) when it's populated, and otherwise falls back to
  a small illustrated placeholder pool with approximate macros.
- `scripts/fetch-meals.mjs` — a one-time/occasional build step that calls the
  Spoonacular API to fetch a curated pool of real recipes and writes them to
  `src/data/generatedMeals.json`. The app itself never calls Spoonacular at
  runtime — no API key ships in the client bundle, and no per-player quota
  is spent.
- `src/lib/daily.ts` — deterministically picks 5 meals per calendar day from
  the pool using a seeded shuffle, so the "daily puzzle" is shared across
  players without needing a backend.
- `src/lib/scoring.ts` — turns percent error into a 0–100 score per macro
  (within ~5% = ~perfect, decays to 0 by ~60% error), averages to a meal
  score, and picks a score-appropriate (never mean) message.
- `src/lib/storage.ts` — persists today's in-progress guesses and long-term
  stats (streak, best streak, average score, history) in `localStorage`.

## Loading real meal data

1. Get a free API key at [spoonacular.com/food-api](https://spoonacular.com/food-api)
   (free tier: 150 requests/day, plenty for a one-time fetch).
2. Run:
   ```bash
   SPOONACULAR_API_KEY=your_key_here node scripts/fetch-meals.mjs
   ```
   This writes ~45 real recipes (photo, computed nutrition, real recipe
   link) to `src/data/generatedMeals.json`. Commit that file — it's just
   URLs + numbers, no binary images or secrets.
3. Re-run it any time (optionally with `MEAL_COUNT=80` etc.) to refresh or
   grow the pool. The app automatically prefers this real data over the
   placeholder pool whenever the file is non-empty.

Until step 2 has been run, the app shows a small in-app notice that it's
running on illustrated placeholder data.

## Running locally

```bash
npm install
npm run dev
```

## Ideas for next steps

- Grow the meal pool — the daily picker reshuffles the whole pool per day,
  so more meals means less repetition.
- Move the daily meal selection to a small backend so the puzzle can be
  updated/curated without a redeploy, and so stats can sync across devices
  instead of living only in `localStorage`.
- Add a "how it's scored" info modal and an archive of past days.
- Consider filtering/curating the fetched pool (cuisine variety, excluding
  extreme outlier recipes) rather than taking Spoonacular's random sample
  as-is.
