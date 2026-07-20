# CLAUDE.md

See [AGENTS.md](./AGENTS.md) — it contains the full guidance for AI coding agents working in this repository (architecture, state/persistence, conventions, deployment).

## Quick description

Worder is a Wordle-style word-guessing game: guess a hidden 5-letter word in 6 tries with green/yellow/gray feedback. Plain HTML/CSS/JS, no framework or build step. Supports English and Ukrainian (auto-detected, switchable), a precomputed difficulty filter (easy/moderate/hard), and per-language session statistics — all persisted in `localStorage`. Live at [worder.shadoll.com](https://worder.shadoll.com).
