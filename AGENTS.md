# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this is

Worder — a Wordle clone. Plain HTML/CSS/JS single-page app, no framework, no build step, no package manager. Everything runs directly in the browser.

## Running & verifying changes

There is no build step. Serve the directory over HTTP and load it in a browser:

```bash
python3 -m http.server 8971
```

`script.js` fetches `words.json` at startup, so the app must be served over HTTP(S) — it will not work opened as a `file://` URL.

After editing `script.js`, sanity-check syntax before assuming it works:

```bash
node --check script.js
```

There are no automated tests. Verify behavior by loading the page in a browser and playing through the affected flow (type a guess, submit, check tile colors, check keyboard colors, check stats modal, etc.).

## Architecture

- **`index.html`** — static markup only: the board grid, on-screen keyboard container, and three modals (`help-modal`, `stats-modal`, `confirm-modal`). All modals share the `.modal` / `.modal-content` CSS classes and the same open/close pattern (toggle `.hidden`).
- **`style.css`** — all styling. Theme colors are CSS custom properties on `:root`, overridden in `@media (prefers-color-scheme: dark)`. Don't hardcode colors in new components — add/reuse a variable.
- **`script.js`** — a single IIFE, no modules/bundler. Key state variables at the top: `answer`, `guessLetters` (array of per-cell letters, not a plain string — supports clicking a tile to edit one letter in place), `cursor` (active tile index), `guesses`/`results` (submitted history), `gameOver`, `statsRecorded` (guards against double-counting stats on reload).
- **`words.json`** — `{ "answers": [...], "valid": [...] }`. `answers` is the pool secrets are picked from (curated common words); `valid` is the full accepted-guess set (superset, derived from the system dictionary). If regenerating this file, keep every entry lowercase and exactly 5 letters — `node --check`-style validation won't catch a bad word list, so verify lengths programmatically before writing.

## State & persistence

Two independent `localStorage` keys:

- `worder-state` — current game in progress (`answer`, `guesses`, `results`, `gameOver`, `keyStatus`, `statsRecorded`). Restored on load via `loadState()` + `replayState()`.
- `worder-stats` — cross-game statistics (`played`, `wins`, `currentStreak`, `maxStreak`, `guessDistribution`, `solvedWords`). Updated once per finished game in `recordGameResult()`, guarded by `statsRecorded` so a page refresh after game-over doesn't double-count.

If you add new persisted fields, update both the save and load functions, and give `loadState`/`loadStats` a sane default so old saved data (missing the new field) doesn't break.

## Conventions

- No comments explaining *what* code does — only *why*, when non-obvious (see existing sparse comments as the bar).
- No build tooling, no dependencies. Keep it that way unless explicitly asked to add a bundler/framework.
- Animations are done via CSS classes toggled with `setTimeout` cleanup (see `bounceRow`, `shakeRow`) — follow the same pattern rather than introducing an animation library.
- Native browser dialogs (`confirm()`, `alert()`) are intentionally avoided in favor of the styled `.modal` pattern — don't reintroduce them.

## Deployment

`.github/workflows/pages.yml` deploys `main` to GitHub Pages on every push, serving at the custom domain in `CNAME` (`worder.shadoll.com`). The workflow copies only `index.html`, `style.css`, `script.js`, `words.json`, and `CNAME` into a `dist/` folder before publishing — if you add new site assets, add them to that copy step too or they won't ship.
