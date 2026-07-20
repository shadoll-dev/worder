# Worder

A Wordle-style word guessing game — single-page, no build step, no dependencies.

**Play it live: [worder.shadoll.com](https://worder.shadoll.com)**

## Features

- Guess a hidden 5-letter word in 6 tries, with green/yellow/gray tile feedback
- On-screen and physical keyboard input, with a layout matching the active language (Ukrainian uses the standard ЙЦУКЕН layout)
- Click any tile in the active row to fix a single letter without retyping the rest
- A live dot badge appears on any tile whose letter you've already learned is wrong, before you even submit the guess
- Win/loss animations (tile bounce, message pulse)
- **English and Ukrainian**, auto-detected from the browser's language and switchable from the "⋮" menu; the choice is remembered in `localStorage`
- **Difficulty filter** — All words / Easy / Moderate / Hard, also in the "⋮" menu. Difficulty is precomputed per word from letter rarity and repeated letters, split into three even tiers. The current word's tier is shown as a colored badge next to the title
- **Session statistics** — games played, win %, streak, guess distribution, wasted-letter count, and solved-word history (colored by difficulty tier) — tracked separately per language, all in `localStorage`
- Progress persists across page reloads (per language)
- Light/dark theme support (follows system preference)
- App icon designed for Apple's Liquid Glass treatment on "Add to Home Screen" (full-bleed square, no baked-in corners/shadow), plus a `manifest.json` for standalone launch
- 500+ curated English answer words with 8,000+ accepted guesses; ~250 curated Ukrainian answer words with 5,000+ accepted guesses (sourced from a real Ukrainian Hunspell dictionary)

## Running locally

No build tools or dependencies required — it's plain HTML/CSS/JS.

```bash
python3 -m http.server 8971
```

Then open [http://localhost:8971](http://localhost:8971).

> Word lists are loaded via `fetch()`, so the game must be served over HTTP — opening `index.html` directly as a `file://` URL won't work.

## Project structure

| File                  | Purpose                                                        |
| --------------------- | --------------------------------------------------------------- |
| `index.html`          | Page markup: header (title, difficulty badge, menu), board, keyboard, modals, footer |
| `style.css`           | All styling, including light/dark theme variables               |
| `script.js`           | Game logic: input handling, scoring, stats, persistence, language/difficulty switching |
| `i18n.js`             | UI text for each supported language (`en`, `uk`)                 |
| `words.en.json`       | English word data — `answers`, `valid` (accepted guesses), `difficultyLevels` |
| `words.uk.json`       | Ukrainian word data, same shape                                  |
| `icon.svg`            | Master app icon (scalable, also used as the browser favicon)     |
| `apple-touch-icon.png`, `favicon-32.png`, `favicon-16.png`, `icon-512.png` | Rasterized icon sizes |
| `manifest.json`       | PWA metadata for "Add to Home Screen"                            |
| `CNAME`                | Custom domain for GitHub Pages                                   |

## Deployment

Pushing to `main` triggers `.github/workflows/pages.yml`, which publishes the site to GitHub Pages at the custom domain configured in `CNAME`.

## License

No license specified.
