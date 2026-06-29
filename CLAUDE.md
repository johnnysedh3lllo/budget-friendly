@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Budget Friendly** — a flexible percentage budget calculator. The user starts at
100% and carves it into any number of named "splits" (down to 1% each); leftover
lives in an explicit **Unallocated** split. The whole set of splits is a
"bucket", which can be saved and reused. Enter an amount and every split shows
its real currency figure. The classic rules (50/30/20, etc.)
are *starting templates*, not constraints.

Strategy lives in `PRODUCT.md`; the visual system lives in `DESIGN.md`. Read both
before design work — they are the Impeccable design-skill context for this repo.

## Commands

```bash
npm run dev      # Next.js dev server (Turbopack) at http://localhost:3000
npm run build    # production build (app is fully static / prerendered)
npm run start    # serve the production build
npm run lint     # eslint (next/core-web-vitals + typescript)
npx tsc --noEmit # typecheck only
```

There is no test runner yet. UI is verified manually; a Playwright-based
screenshot/interaction harness was used ad hoc during the build (Chromium is
installed under `~/.ms-playwright`).

## Architecture

Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + TypeScript. The MVP is
**pure client-side**: state persists to `localStorage`, no backend, no database.
Next.js was chosen over a lighter SPA specifically so the future vision (accounts,
bank connection, server-held financial tokens) can be added in-place — see the
roadmap note in `PRODUCT.md`.

- **State** — one Zustand store, `lib/store.ts`, with `persist` (key `bf-store`).
  Holds `amount`, `currency`, `splits`, saved `buckets`, and `theme`. The
  allocation rule lives here: `setPercent` clamps a split to `100 − (sum of other
  splits)`, i.e. a split can only grow into unallocated room ("block at available
  room"). `selectAllocated`
  / `selectUnallocated` are derived selectors. `hasHydrated` gates the UI to avoid
  SSR/localStorage hydration mismatch.

- **Theming is the headline feature, and everything is a token.** Four complete
  themes (`candy`, `pastel`, `geometric`, `fintech`) — not color swaps. Each is a
  full override of CSS custom properties (color, type *family*, radius, border
  width, shadow style, density, motion timing/easing) under a
  `[data-theme="…"]` block in `app/globals.css`. Components read tokens only and
  never hard-code a visual value. Add a theme = add one `[data-theme]` block + an
  entry in `THEMES` (`lib/types.ts`); no component changes needed.
  - Theme is applied to `<html data-theme>` by `applyThemeToDom` and mirrored to a
    separate `bf-theme` localStorage key, read by an inline no-flash script in
    `app/layout.tsx` before paint. `setTheme` keeps `bf-theme` and the persisted
    store in sync — change both together or themes desync on reload.
  - Fonts are loaded once via `next/font` in `layout.tsx` and selected per theme
    through `--font-display` / `--font-body` / `--font-numeric`.

- **Split colors** map by index to the active theme's `--p1…--p8` palette via
  `splitColor()` in `lib/colors.ts`. Splits are always identified by name +
  amount + position, never color alone (color-blind safety).

- **Components** (`components/`, all client) compose under `Calculator.tsx`:
  `AmountInput`, `BucketBar` (the stacked 100% split bar + `SplitForm` editor),
  `BucketsLibrary` (saved buckets) with `SaveBucket`, `StartFromRule`, `Summary`
  (SVG donut + list), `ThemeSwitcher`. `app/page.tsx` is the server shell.

- **Motion** uses the `motion` package (`motion/react`). All motion has a
  `prefers-reduced-motion` fallback (see the media query in `globals.css`).

## Rules

- When reporting information to me, be extremely concise and sacrifice grammar for the sake of concision.

### Instructions

- **The user's instructions are not optional.** Do what is asked. If you have a
  concern, risk, suggestion, or a better idea, raise it — clearly and up front —
  but never silently disregard, skip, water down, or treat an instruction as
  optional. If something blocks carrying it out, say so and ask; do not just
  substitute your own judgment for the instruction.

### Workflow

- **Queue new tasks.** If a new task arrives while you're already working on one,
  finish the current task first, then pick up the new one — don't drop the
  in-progress work to start the new thing. **Exception:** if the task is flagged
  urgent (e.g. "urgent", "red alert", "now", "drop everything"), handle it
  immediately, then return to the queued work. When you queue a task, say so.

### Commits

- **One commit per self-contained change.** Each commit should be a single
  feature, fix, bug, or docs change that can be reviewed on its own — never bundle
  multiple features (or a feature + an unrelated fix + docs) into one commit. When
  a feature is done, commit it as its own unit so the whole thing is reviewable in
  isolation. If a file holds changes for more than one logical change, split them
  across commits (stage selectively or reconstruct) rather than committing them
  together.

### Temporary files

- **Keep scratch out of the repo root.** One-off scripts, screenshots, render
  probes and any other throwaway files go in a top-level `temp/` directory (it's
  gitignored and safe to delete in bulk) — never leave `_*`-style scratch files
  loose in the project root.

## Conventions

- Money/percent figures get the `.num` class (tabular numerals, theme numeric
  font) so digits don't jitter while dragging.
- Prefer the semantic component classes in `globals.css`'s `@layer components`
  (`.surface`, `.btn`, `.chip`, `.field`, `.bf-range`) over re-deriving styles, so
  theming stays centralized and CSS specificity stays flat.
- Colors are authored in OKLCH throughout.
