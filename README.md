# Budget Friendly

A flexible **percentage budget calculator**. Start at 100%, carve it into the
buckets that fit *your* life — down to a single percent — and watch the real
amounts land. The classic rules (50/30/20, 60/20/20, …) are just starting
templates, not constraints.

> The 50/30/20 rule is a starting line, not a cage.

## Features

- **Drag-to-split bar** — buckets are segments of one bar; drag a divider to
  trade percent between two neighbours, or grow the last one into the
  unallocated space.
- **Name, recolor, delete** any bucket; add by text (`Rent 35, Food 15, Fun 5`).
- **Live breakdown** — donut + per-bucket amounts for any input amount and
  currency.
- **9 fully-tokenized themes** (Candy, Pastel, Sunset, Fintech, Brutalist, and
  the dark Midnight / Noir / Terminal / Aurora) — every design decision is a
  token: color, type, spacing, radius, shadow, motion. Cycle, pick, or shuffle.
- **Accessible** (WCAG-AA contrast per theme, keyboard-operable, reduced-motion
  respected) and **responsive** down to 320px.
- Saves to your browser — no account, no tracking.

## Tech

[Next.js 16](https://nextjs.org) (App Router) · React 19 · Tailwind CSS v4 ·
[Zustand](https://github.com/pmndrs/zustand) · [Motion](https://motion.dev).
The MVP is pure client-side (localStorage); it's structured so a backend
(accounts, bank connections) can be added later without re-platforming.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (fully static)
npm run lint
```

Design context for AI/agents lives in `PRODUCT.md` (strategy) and `DESIGN.md`
(the token system); see `CLAUDE.md` for architecture notes.
