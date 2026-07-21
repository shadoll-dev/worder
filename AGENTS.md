# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this is

Worder — a Wordle clone with English/Ukrainian support and a difficulty filter. Plain HTML/CSS/JS single-page app, no framework, no build step, no package manager. Everything runs directly in the browser.

## Running & verifying changes

There is no build step. Serve the directory over HTTP and load it in a browser:

```bash
python3 -m http.server 8971
```

Port 8971 is this game's fixed dev-server port, tracked in the root [`AGENTS.md`](../AGENTS.md#local-dev-server-ports) alongside every other game's — don't change it or reuse it for another game in this repo.

`script.js` fetches `words.en.json` / `words.uk.json` at startup (whichever is active), so the app must be served over HTTP(S) — it will not work opened as a `file://` URL.

After editing `script.js`, sanity-check syntax before assuming it works:

```bash
node --check script.js
```

There are no automated tests. Verify behavior by loading the page in a browser (or headlessly via `jsdom`, which this project's history has used for exactly this) and playing through the affected flow: type a guess, submit, check tile colors, check keyboard colors, open the "⋮" menu, switch language, switch difficulty, check the stats modal.

## Architecture

- **`index.html`** — static markup only: header (title + difficulty badge + the "⋮" menu with Stats/Difficulty/Language), the board grid, on-screen keyboard container, and three modals (`help-modal`, `stats-modal`, `confirm-modal`). All modals share the `.modal` / `.modal-content` CSS classes and the same open/close pattern (toggle `.hidden`). User-facing text carries `data-i18n="key"` (sets `textContent`) or `data-i18n-title="key"` (sets `title` + `aria-label`) — `applyStaticTranslations()` in `script.js` walks these on load and on language switch. Adding new UI text means adding both the attribute here and the key in `i18n.js` for every language.
- **`style.css`** — all styling. Theme colors are CSS custom properties on `:root`, overridden in `@media (prefers-color-scheme: dark)`, including `--hard` for the difficulty-badge red. Don't hardcode colors in new components — add/reuse a variable.
- **`i18n.js`** — `const I18N = { en: {...}, uk: {...} }`, loaded before `script.js`. Most values are strings; a few (`theWordWas`, `wordCount`) are functions taking args, and `winMessages` is a per-guess-count array. `script.js`'s `t(key, ...args)` helper reads from whichever language is active. Keep both language objects in sync — a key present in one but not the other renders `undefined` for the missing language (there's no fallback).
- **`script.js`** — a single IIFE, no modules/bundler. Key state: `currentLang` (`"en"`/`"uk"`), `wordLevel` (`"all"`/`"easy"`/`"moderate"`/`"hard"`), `answer`, `guessLetters` (array of per-cell letters, not a plain string — supports clicking a tile to edit one letter in place), `cursor`, `guesses`/`results`, `gameOver`, `statsRecorded` (guards against double-counting stats on reload), `keyStatus` (per-letter best-known status, drives both keyboard coloring and the live "wasted letter" dot), `alphabetSet` (current language's valid letter keys, rebuilt in `buildKeyboard()` — validates both on-screen and physical keyboard input), `DIFFICULTY_LEVELS`/`WORD_LEVEL_MAP` (loaded per language, used to pick from a filtered pool and to render the header badge / colored Solved Words pills). `KEY_ROWS_BY_LANG` holds the on-screen keyboard layout per language (Ukrainian uses the standard ЙЦУКЕН layout, including ґ). `pendingConfirmAction` + `requestFreshGame()` is the shared guard used by both "New Game" and difficulty changes: if a game is in progress it shows the confirm modal and defers the action, otherwise it runs immediately.
- **`words.en.json`** / **`words.uk.json`** — `{ "answers": [...], "valid": [...], "difficultyLevels": { "easy": [...], "moderate": [...], "hard": [...] } }`, one file per language, loaded via `fetch("words.${currentLang}.json")`. `answers` is the full pool secrets are picked from (curated common words); `valid` is the accepted-guess set (superset of `answers`, currently sourced from a real dictionary — the system's English `/usr/share/dict/words` and a Ukrainian Hunspell `.dic` — filtered to lowercase 5-letter entries); `difficultyLevels` partitions `answers` into three tiers of equal size, computed from a letter-rarity score (frequency-table rank per letter) plus a flat penalty per repeated letter, bucketed by percentile — see the difficulty section below. If regenerating any of this, keep every entry lowercase and exactly 5 letters (5 code points — use `Array.from(word).length`, not `.length`, in case a language ever needs it) and keep `difficultyLevels`' union exactly equal to `answers` — `node --check`-style validation won't catch a broken word list or partition, so verify programmatically before writing.

## Difficulty scoring (important limitation)

The easy/moderate/hard split is a **letter-obscurity proxy**, not real word-frequency data — there's no usage-frequency corpus wired in for either language. A word scores higher (harder) if it uses statistically rarer letters and/or has repeated letters (objectively trickier to solve in a Wordle-style game). This means a very common word can land in "hard" if it happens to have a repeated letter (e.g. English "apple") or a letter that's rare in that language. If asked to make difficulty "more accurate," that requires sourcing and vetting a real frequency corpus per language — flag that tradeoff rather than silently reshuffling the buckets with more letter-heuristics.

## State & persistence

`localStorage` keys — most namespaced by language, plus two global preferences:

- `worder-lang` — the active language (`"en"`/`"uk"`). Read once on load via `detectInitialLang()`: stored value wins if present, otherwise falls back to `navigator.language` (Ukrainian browsers default to `uk`, everyone else to `en`).
- `worder-level` — the active difficulty filter (`"all"`/`"easy"`/`"moderate"`/`"hard"`), global (not per-language). Read via `detectInitialLevel()`, defaults to `"all"`.
- `worder-state-${lang}` — current game in progress for that language (`answer`, `guesses`, `results`, `gameOver`, `keyStatus`, `statsRecorded`). Restored on load via `loadState()` + `replayState()`. Keyed per language so switching languages mid-game doesn't clobber either game's progress.
- `worder-stats-${lang}` — cross-game statistics for that language (`played`, `wins`, `currentStreak`, `maxStreak`, `guessDistribution`, `solvedWords`, `wastedLetters`). `recordGameResult()` runs once per finished game, guarded by `statsRecorded`. `recordWastedLetters()` runs on every submitted guess that reuses an already-known-wrong letter, independent of game completion — it is not guarded by `statsRecorded` because it isn't an end-of-game event. Stats are intentionally per-language, not merged.

If you add new persisted fields, update both the save and load functions, and give `loadState`/`loadStats` a sane default so old saved data (missing the new field) doesn't break.

## Conventions

- No comments explaining *what* code does — only *why*, when non-obvious (see existing sparse comments as the bar).
- No build tooling, no dependencies. Keep it that way unless explicitly asked to add a bundler/framework.
- Animations are done via CSS classes toggled with `setTimeout` cleanup (see `bounceRow`, `shakeRow`) — follow the same pattern rather than introducing an animation library.
- Native browser dialogs (`confirm()`, `alert()`) are intentionally avoided in favor of the styled `.modal` pattern — don't reintroduce them.
- Overflow actions live in the "⋮" menu (`#menu-panel`), not as standalone header buttons — if adding a new global setting, prefer a new section there (see how Difficulty was added alongside Language) over growing the header's button row.
- Native `<select>` was tried for the language/difficulty pickers and deliberately replaced with button lists (`.lang-option` / `.level-option`, both sharing the same CSS) — reuse that pattern instead of reintroducing a `<select>` for choice lists in the menu.

## Deployment

`.github/workflows/pages.yml` deploys `main` to GitHub Pages on every push, serving at the custom domain in `CNAME` (`worder.shadoll.com`). The workflow copies an explicit file list into a `dist/` folder before publishing — if you add new site assets (a new language's word file, a new icon size, etc.), add them to that `cp` list too or they won't ship.
