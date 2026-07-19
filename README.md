# Worder

A Wordle-style word guessing game — single-page, no build step, no dependencies.

**Play it live: [worder.shadoll.com](https://worder.shadoll.com)**

## Features

- Guess a hidden 5-letter word in 6 tries, with green/yellow/gray tile feedback
- On-screen and physical keyboard input
- Click any tile in the active row to fix a single letter without retyping the rest
- Win/loss animations (tile bounce, message pulse)
- Session statistics: games played, win %, streak, guess distribution, solved word history — all in `localStorage`
- Progress persists across page reloads
- Light/dark theme support (follows system preference)
- 500+ curated answer words, 8,000+ accepted guesses

## Running locally

No build tools or dependencies required — it's plain HTML/CSS/JS.

```bash
python3 -m http.server 8971
```

Then open [http://localhost:8971](http://localhost:8971).

> `words.json` is loaded via `fetch()`, so the game must be served over HTTP — opening `index.html` directly as a `file://` URL won't work.

## Project structure

| File          | Purpose                                              |
| ------------- | ----------------------------------------------------- |
| `index.html`  | Page markup: board, keyboard, modals, footer          |
| `style.css`   | All styling, including light/dark theme variables     |
| `script.js`   | Game logic: input handling, scoring, stats, persistence |
| `words.json`  | Word lists — `answers` (possible secrets) and `valid` (accepted guesses) |
| `CNAME`       | Custom domain for GitHub Pages                        |

## Deployment

Pushing to `main` triggers `.github/workflows/pages.yml`, which publishes the site to GitHub Pages at the custom domain configured in `CNAME`.

## License

No license specified.
