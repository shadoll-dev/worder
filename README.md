# Worder

A Wordle-style word guessing game — single-page, no build step, no dependencies.

**Play it live: [worder.shadoll.com](https://worder.shadoll.com)**

## Features

- Guess a hidden 5-letter word in 6 tries, with green/yellow/gray tile feedback
- On-screen and physical keyboard input, with a layout matching the active language
- Click any tile in the active row to fix a single letter without retyping the rest
- Win/loss animations (tile bounce, message pulse)
- English and Ukrainian, auto-detected from the browser's language and switchable via the header button; the choice is remembered in `localStorage`
- Session statistics — games played, win %, streak, guess distribution, solved word history — tracked separately per language, all in `localStorage`
- Progress persists across page reloads
- Light/dark theme support (follows system preference)
- 500+ curated English answer words with 8,000+ accepted guesses; a smaller curated Ukrainian list

## Running locally

No build tools or dependencies required — it's plain HTML/CSS/JS.

```bash
python3 -m http.server 8971
```

Then open [http://localhost:8971](http://localhost:8971).

> Word lists are loaded via `fetch()`, so the game must be served over HTTP — opening `index.html` directly as a `file://` URL won't work.

## Project structure

| File               | Purpose                                              |
| ------------------ | ----------------------------------------------------- |
| `index.html`       | Page markup: board, keyboard, modals, footer          |
| `style.css`        | All styling, including light/dark theme variables     |
| `script.js`        | Game logic: input handling, scoring, stats, persistence, language switching |
| `i18n.js`          | UI text for each supported language (`en`, `uk`)      |
| `words.en.json`    | English word lists — `answers` (possible secrets) and `valid` (accepted guesses) |
| `words.uk.json`    | Ukrainian word lists, same shape                      |
| `CNAME`            | Custom domain for GitHub Pages                        |

## Deployment

Pushing to `main` triggers `.github/workflows/pages.yml`, which publishes the site to GitHub Pages at the custom domain configured in `CNAME`.

## License

No license specified.
