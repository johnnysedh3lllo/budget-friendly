# Design

Budget Friendly ships **four complete themes**, not four color swaps. Theming is
the product's signature feature, so *every* design decision is a token: color,
typography, spacing/density, radius, border weight, depth/shadow, and motion.
A theme is a full override of the token set on `:root` via a
`[data-theme="…"]` attribute on `<html>`. Components never hard-code a visual
value — they read tokens only.

## Token architecture

All tokens are CSS custom properties. Colors are authored in **OKLCH**.

### Color roles
`--bg` page canvas · `--surface` / `--surface-2` panels & insets ·
`--ink` / `--ink-muted` / `--ink-subtle` text ramp · `--primary` /
`--primary-ink` primary action · `--accent` secondary highlight ·
`--border` · `--ring` focus · `--success` / `--danger` semantic ·
`--p1…--p8` the split palette (8 distinguishable hues per theme) ·
`--p-unalloc` the neutral Unallocated split.

### Type roles
`--font-display` (headings), `--font-body` (UI + prose), `--font-numeric`
(money — always rendered with `tabular-nums` so digits don't jitter while
dragging). Plus `--display-tracking` and `--display-weight`.

### Shape / depth / density / motion
`--radius-sm|md|lg|pill` · `--border-width` · `--shadow-sm|md|lg`
(a theme can make these soft, subtle, or hard offset blocks) ·
`--density` padding multiplier · `--dur-fast|base|slow` and
`--ease`/`--ease-bounce` for motion personality.

## The four themes

| Theme | Mood (scene) | Color strategy | Type | Shape / depth | Motion |
|---|---|---|---|---|---|
| **candy** (default) | Arcade prize counter — gummy brights, glossy confidence | Committed: vivid grape primary, full-bright split palette, faint grape-tinted canvas | Fredoka (rounded display) + Nunito body | Heavy radius (22px), soft diffuse shadows | Bouncy, slight overshoot |
| **pastel** | Early light through linen — soft, unhurried, a deep breath | Restrained: muted low-chroma palette, airy whitespace, cool off-white | Fraunces (soft serif) + Nunito — serif/sans contrast | Gentle radius (18px), very soft shadow | Slow, calm, no overshoot |
| **geometric** | Risograph poster wall — flat ink blocks, hard edges | Full palette: saturated primary triad on pure white, true-black ink | Space Grotesk display + Geist body | Near-square (4px), hard offset solid shadows, 2px borders | Snappy, mechanical |
| **fintech** | Private-banking night desk — quiet trust, one confident blue | Restrained: cobalt primary (brand seed, hue ~248), subtle depth | Geist throughout | Medium radius (12px), subtle soft shadow | Smooth, restrained |

## Contrast & accessibility

Each theme's `--ink`/`--ink-muted` is checked against its own `--surface`
(body ≥ 4.5:1, large/UI ≥ 3:1) — not just the default. Splits are always
identified by **name + amount + position**, never color alone. Focus rings use
`--ring`. All motion has a `prefers-reduced-motion` fallback (crossfade /
instant). See [[product]] PRODUCT.md for the strategic principles these serve.

## Anti-slop guardrails (from Impeccable)

No gradient text, no side-stripe borders, no glassmorphism-by-default, no
hero-metric template, no identical icon-topped card grids, no uppercase tracked
eyebrow on every section. Candy's tint and pastel's off-white are deliberate
*theme statements*, not the AI cream default.
