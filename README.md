# MacroGuess

A daily trivia game: everyone gets the same 5 real dishes each day, and guesses
calories + protein for each one. Score is based on percent accuracy (closer
guess = more points), with a deliberate 5-round difficulty curve — warm-up →
moderate → tricky → deceptive/"gotcha" → boss round. The goal is to build
"nutrition intuition" through play, not to feel like a calorie tracker.

## How it works

- `src/data/dish.ts` — the `Dish` type (photo, cuisine, macros, difficulty
  1-5, a short "why" explanation, a "gotcha" one-liner, tags) plus a small
  hand-written placeholder pool used only until real data is loaded.
- `src/data/dishPool.ts` — picks `generatedDishes.json` when it's populated,
  falling back to the placeholder pool otherwise.
- `scripts/fetch-dishes.mjs` — pulls real dishes from Spoonacular across ~45
  hand-picked queries spanning the requested cuisines/archetypes (not a blind
  random sample), auto-generates the explanation/gotcha copy from each dish's
  *real* ingredient list and caloric breakdown, and auto-assigns a difficulty
  tier by ranking every dish's "trickiness" (calorie density vs. how
  healthy/indulgent it looks, hidden-ingredient density, protein-density
  surprise) into quintiles. Run-time app never calls Spoonacular — no API key
  ships in the client bundle, no per-player quota spent.
- `src/lib/scoring.ts` — the percent-error → points curve
  (0%→100, 5%→95, 10%→85, 20%→65, 30%→40, 50%→10, →0), applied
  separately to calories and protein, averaged into a 100-pt round score.
  5 rounds → 500 max.
- `src/lib/daily.ts` — every day draws exactly one dish per difficulty tier
  (1→5), via a stable seeded shuffle per tier (Wordle-style — no repeats
  until a tier's pool cycles), so every player gets the same 5 dishes with a
  real difficulty arc.
- `src/lib/storage.ts` — streak (doesn't require a good score, just playing),
  history, and derived stats: avg calorie/protein accuracy, per-cuisine
  performance, and a real computed over/underestimate bias insight from the
  player's own guess history (not scripted copy).

## Loading real dish data

Spoonacular's free tier is 150 points/day, which isn't enough to fetch the
whole query list in one run. The script is resumable:

```bash
SPOONACULAR_API_KEY=your_key_here node scripts/fetch-dishes.mjs
```

It fetches a batch (default 20 queries, `QUERY_COUNT=N` to change), merges
new dishes into the existing pool, re-ranks the *whole* pool's difficulty
together, and remembers which queries it already tried in
`scripts/.fetch-dishes-progress.json` (gitignored, local only) — so if you
hit the daily quota, just run it again the next day and it picks up where it
left off. Delete that file to start the query list over.

Commit `src/data/generatedDishes.json` after each run — it's just URLs and
numbers, no secrets or binary images.

## Deliberate MVP scope / tradeoffs

- **No backend or accounts yet.** The results-screen "leaderboard" is
  therefore a clearly-labeled *preview*: a percentile estimate against an
  assumed score distribution, not real friend data. Building a real friends
  leaderboard needs shared daily puzzle state, accounts, and a friend graph
  — a real next step, not faked here.
- **Everything is local** (`localStorage`) — streaks/stats live per-browser,
  not synced across devices.
- Dish pool is currently ~17 real dishes (growing via the resumable fetch
  script above); difficulty tiers will even out further as it grows.

## Running locally

```bash
npm install
npm run dev
```

## Ideas for next steps

- Real accounts + backend: shared daily puzzle source of truth, real friends
  leaderboard, cross-device stats sync.
- Grow the dish pool (keep running `fetch-dishes.mjs`, or add more queries).
- An animated point count-up on the reveal screen for extra juice.
- A "how scoring works" info modal.
- Push notifications / reminder for the daily streak.
