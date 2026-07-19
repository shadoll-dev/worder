# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this is

Worder — a Wordle clone. Plain HTML/CSS/JS single-page app, no framework, no build step, no package manager. Everything runs directly in the browser.

## Running & verifying changes

There is no build step. Serve the directory over HTTP and load it in a browser:

```bash
python3 -m http.server 8971
```

`script.js` fetches `words.en.json` / `words.uk.json` at startup (whichever is active), so the app must be served over HTTP(S) — it will not work opened as a `file://` URL.

After editing `script.js`, sanity-check syntax before assuming it works:

```bash
node --check script.js
```

There are no automated tests. Verify behavior by loading the page in a browser and playing through the affected flow (type a guess, submit, check tile colors, check keyboard colors, check stats modal, etc.).

## Architecture

- **`index.html`** — static markup only: the board grid, on-screen keyboard container, and three modals (`help-modal`, `stats-modal`, `confirm-modal`). All modals share the `.modal` / `.modal-content` CSS classes and the same open/close pattern (toggle `.hidden`). User-facing text carries `data-i18n="key"` (sets `textContent`) or `data-i18n-title="key"` (sets `title` + `aria-label`) — `applyStaticTranslations()` in `script.js` walks these on load and on language switch. Adding new UI text means adding both the attribute here and the key in `i18n.js` for every language.
- **`style.css`** — all styling. Theme colors are CSS custom properties on `:root`, overridden in `@media (prefers-color-scheme: dark)`. Don't hardcode colors in new components — add/reuse a variable.
- **`i18n.js`** — `const I18N = { en: {...}, uk: {...} }`, loaded before `script.js`. Most values are strings; a few (`theWordWas`, `wordCount`) are functions taking args, and `winMessages` is a per-guess-count array. `script.js`'s `t(key, ...args)` helper reads from whichever language is active. Keep both language objects in sync — a key present in one but not the other will render `undefined` for the missing language (there's no fallback).
- **`script.js`** — a single IIFE, no modules/bundler. Key state variables at the top: `currentLang` (`"en"` or `"uk"`), `answer`, `guessLetters` (array of per-cell letters, not a plain string — supports clicking a tile to edit one letter in place), `cursor` (active tile index), `guesses`/`results` (submitted history), `gameOver`, `statsRecorded` (guards against double-counting stats on reload), `alphabetSet` (the current language's valid letter keys, rebuilt in `buildKeyboard()` — used to validate both on-screen and physical keyboard input, since English and Ukrainian use different alphabets). `KEY_ROWS_BY_LANG` holds the on-screen keyboard layout per language (Ukrainian uses the standard ЙЦУКЕН layout); `KEY_ROWS` is reassigned to the active one on init and on language switch.
- **`words.en.json`** / **`words.uk.json`** — `{ "answers": [...], "valid": [...] }`, one file per language, loaded via `fetch("words.${currentLang}.json")`. `answers` is the pool secrets are picked from (curated common words); `valid` is the accepted-guess set (superset of `answers`). If regenerating either file, keep every entry lowercase and exactly 5 letters (5 code points — use `Array.from(word).length`, not `.length`, if a language ever needs it, though it's a non-issue for plain Ukrainian Cyrillic) — `node --check`-style validation won't catch a bad word list, so verify lengths programmatically before writing.

## State & persistence

`localStorage` keys, all namespaced by language except the language preference itself:

- `worder-lang` — the active language (`"en"` or `"uk"`). Read once on load via `detectInitialLang()`: stored value wins if present, otherwise falls back to `navigator.language` (Ukrainian browsers default to `uk`, everyone else to `en`).
- `worder-state-${lang}` — current game in progress for that language (`answer`, `guesses`, `results`, `gameOver`, `keyStatus`, `statsRecorded`). Restored on load via `loadState()` + `replayState()`. Keyed per language so switching languages mid-game doesn't clobber either game's progress.
- `worder-stats-${lang}` — cross-game statistics for that language (`played`, `wins`, `currentStreak`, `maxStreak`, `guessDistribution`, `solvedWords`). Updated once per finished game in `recordGameResult()`, guarded by `statsRecorded` so a page refresh after game-over doesn't double-count. Stats are intentionally per-language, not merged — a player's English and Ukrainian stats are tracked independently.

If you add new persisted fields, update both the save and load functions, and give `loadState`/`loadStats` a sane default so old saved data (missing the new field) doesn't break.

## Conventions

- No comments explaining *what* code does — only *why*, when non-obvious (see existing sparse comments as the bar).
- No build tooling, no dependencies. Keep it that way unless explicitly asked to add a bundler/framework.
- Animations are done via CSS classes toggled with `setTimeout` cleanup (see `bounceRow`, `shakeRow`) — follow the same pattern rather than introducing an animation library.
- Native browser dialogs (`confirm()`, `alert()`) are intentionally avoided in favor of the styled `.modal` pattern — don't reintroduce them.

## Deployment

`.github/workflows/pages.yml` deploys `main` to GitHub Pages on every push, serving at the custom domain in `CNAME` (`worder.shadoll.com`). The workflow copies only `index.html`, `style.css`, `script.js`, `i18n.js`, `words.en.json`, `words.uk.json`, and `CNAME` into a `dist/` folder before publishing — if you add new site assets (or a new language's word file), add them to that copy step too or they won't ship.
