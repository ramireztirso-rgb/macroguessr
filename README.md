# MacroGuessr

A daily trivia game: guess the calories, protein, carbs, fat, and fiber of a
meal. The closer your guess, the higher your score. Get close enough (65+)
and the recipe unlocks; if you're way off, you get a lighthearted roast
instead of the recipe — never a real dunk.

Inspired by daily games like Wordle/Worldle: everyone who plays on a given
calendar day gets the same 5 meals, picked deterministically from a shared
pool so results are comparable and shareable.

## How it works

- `src/data/meals.ts` — the meal pool (name, description, macros, a recipe
  search query). Currently uses emoji placeholders instead of real photos —
  swap in real meal photography + verified nutrition data before shipping
  for real.
- `src/lib/daily.ts` — deterministically picks 5 meals per calendar day from
  the pool using a seeded shuffle, so the "daily puzzle" is shared across
  players without needing a backend.
- `src/lib/scoring.ts` — turns percent error into a 0–100 score per macro
  (within ~5% = ~perfect, decays to 0 by ~60% error), averages to a meal
  score, and picks a score-appropriate (never mean) message.
- `src/lib/storage.ts` — persists today's in-progress guesses and long-term
  stats (streak, best streak, average score, history) in `localStorage`.

## Running locally

```bash
npm install
npm run dev
```

## Ideas for next steps

- Replace emoji placeholders with real meal photos (and get real,
  verified nutrition data to match).
- Grow the meal pool — the daily picker reshuffles the whole pool per day,
  so more meals means less repetition.
- Link out to real, specific recipes instead of a search query, once a
  content source is picked.
- Move the daily meal selection to a small backend so the puzzle can be
  updated/curated without a redeploy, and so stats can sync across devices
  instead of living only in `localStorage`.
- Add a "how it's scored" info modal and an archive of past days.
