# Handoff 2 — Showcase video + app loading screen (2026-06-27)

Continues `2026-06-27-handoff.md`. That doc covers the MVP build/deploy, PWA,
currency detection, per-theme fonts, accessibility sweep, the Aperture logo, and
the first Remotion video. **This doc** covers the later work: finishing the
Twitter showcase video and starting the app loading screen.

## Immediate next task — APP LOADING SCREEN (in progress, NOT committed)

A file exists but the feature is unfinished: `components/LoadingScreen.tsx`.

**What the user wants (exact words distilled):**
- A loading screen that is **the exact same as the way the video intro starts**:
  the three aperture arcs **grow in simultaneously, clockwise, with rounded caps**
  (the logo look), same smooth ease-out (`cubic-bezier(0.22, 1, 0.36, 1)`),
  ~0.7s draw. Reference: the `Intro`/`GrowRing` in `temp/video/src/Showcase.tsx`
  (clockwise = `strokeDashoffset: 100 - 100*prog` with `pathLength=100`).
- **Theme-aware**: the veil uses **whatever theme is set** — default theme on a
  first visit, the user's saved theme when returning. The no-flash script in
  `app/layout.tsx` already sets `data-theme` before paint, so `var(--bg)` /
  `var(--ink)` / `var(--primary)` are correct at first paint. Use `var(--bg)` for
  the veil background. **Open decision:** arc colour — the video used white (the
  "ink" on its dark bg), so `var(--ink)` is the faithful mapping; `var(--primary)`
  is more branded. Pick `var(--ink)` to match "exact same as the video" unless the
  user prefers brand colour. (Current draft uses `--primary` — reconsider.)
- After the draw, **the veil fades out and the app fades in with a light stagger**;
  the **app fade-in must not exceed 250–300ms** total (including the stagger).

**What `LoadingScreen.tsx` already does:** renders a fixed `.bf-loading` veil with
three `<path className="bf-loading-arc" pathLength={100}>` arcs; waits for
`useBudget.getState().hasHydrated` AND a min ~820ms, then sets
`document.documentElement.dataset.loaded = "true"`, adds `.is-done` (fade), and
unmounts after 360ms. Has a 2.5s hard-cap fallback so it never sticks.

**Still TODO to finish it:**
1. **CSS in `app/globals.css`:**
   - `.bf-loading { position:fixed; inset:0; z-index:100; display:flex; align/justify center; background:var(--bg); transition:opacity .32s ease } .bf-loading.is-done { opacity:0; pointer-events:none }`
   - `.bf-loading-mark { width:116px; height:116px }`
   - `.bf-loading-arc { fill:none; stroke:var(--ink) /*or --primary*/; stroke-width:9; stroke-linecap:round; stroke-dasharray:100; stroke-dashoffset:100; animation:bf-arc-draw .7s cubic-bezier(.22,1,.36,1) forwards }`
     `@keyframes bf-arc-draw { to { stroke-dashoffset:0 } }` (all 3 share one
     animation → simultaneous; clockwise because the arc paths run a1→a2 with
     `pathLength=100` and offset animates 100→0).
   - Stagger reveal: `.bf-reveal { opacity:0; transform:translateY(10px) }` and
     `html[data-loaded="true"] .bf-reveal { opacity:1; transform:none; transition:opacity .2s ease, transform .2s ease; transition-delay:var(--reveal-d, 0s) }`
   - Reduced motion: in the existing `prefers-reduced-motion` block add
     `.bf-loading-arc{animation:none;stroke-dashoffset:0} .bf-reveal{opacity:1;transform:none}`.
2. **Wire `<LoadingScreen />`** into `app/page.tsx` (it's a client component; it
   SSRs the veil so the logo shows immediately, then hydrates). Put it at the end
   of the page shell so it overlays everything (header + workspace).
3. **Add stagger classes** `bf-reveal` + inline `style={{ "--reveal-d": "0s" }}`
   (cast `as React.CSSProperties`) to the **header** (delay 0), **editor pane**
   (delay ~.05s), **summary pane** (delay ~.1s). Header is in `page.tsx`; the two
   panes are in `components/Calculator.tsx`. Keep max delay + .2s fade ≤ .3s.
4. Note: `Calculator` already gates on `hasHydrated` (skeleton until hydrated).
   Because `data-loaded` is set only after `hasHydrated`, the real panes are
   mounted (hidden via `.bf-reveal`) before the veil lifts — no skeleton flash.
5. Build, eyeball each theme (esp. light themes like brutalist/candy where
   `--ink` arcs must be visible on `--bg`), then **commit + push** (auto-deploys).

The arc geometry helper is already in `LoadingScreen.tsx` (same as the video):
`arc(-90 + i*120 + 12, -90 + i*120 + 108)` for i in 0..2, r=44 in a 120 viewBox.

## Showcase video — DONE (lives in `temp/`, which is gitignored)

- **Final render:** `temp/video/out/showcase.mp4` — 1440p (2560×1440), ~16.9s,
  30fps, ~7.4MB. Small file is fine: static scenes + hard cuts compress tiny even
  at CRF 1. **It is gitignored** — copy it out before clearing `temp/` (offered to
  the user; not yet done).
- **Render:** `( cd temp/video && npx remotion render Showcase out/showcase.mp4 --scale 2 --crf 1 --log=error )`
- **Studio (live scrub):** `( cd temp/video && npm run dev )`
- **Inspect mp4 / extract a frame** (Remotion bundles ffmpeg):
  `npx remotion ffmpeg -ss <sec> -i out/showcase.mp4 -frames:v 1 -y out/_x.png`

### Composition (`temp/video/src/Showcase.tsx`) — timeline `S` object, 506 frames
1. **Intro** — 3 aperture arcs grow **simultaneously, clockwise, rounded caps**,
   slightly slow, **no name**. `GrowRing` takes `dir: "cw"|"ccw"` and uses
   `strokeLinecap="round"`. (User flip-flopped: butt-caps "no dots" looked wrong,
   round caps restored — the rounded ends ARE the logo.)
2. **CurrencyScene** — amount with the symbol/code flipping through **7 distinct
   currencies** (₦ $ € £ ₹ ¥ R$), `each = 10` frames. (Bug fixed: only 5 before, so
   `Math.min` clamp held INR ~3× — added JPY/BRL.) No zoom. Caption "115+ currencies".
3. **SplitResizeScene** — bar fills, then a faux cursor **drags the knob**; cursor
   is positioned by **percentage** (`left:${knobPct}%`) so it sits ON the knob
   (earlier px math drifted off). Snappy: quick drag, no dead hold. Donut mirrors.
4. **TemplateScene** — 50/30/20 chips, one selected, bar morphs.
5. **ThemeTitle** — dedicated full-screen **off-white card (`#f3f2ef`)**, big dark
   "14 themes" + muted "switch your whole look, live" (drag-to-rebalance style,
   centered). **Replaced** the old "amateur" peel-pill banner that floated over the
   screens.
6. **RealScreens** — **10 real app screenshots, full-screen, hard cuts** (no fades,
   no card, no rounded corners), `each = 10` (same pace as the currency flip, per
   user). Order: brutalist, midnight, candy, mocha, terminal, mono, mono-inverse,
   sunset, forest, aurora.
7. **Outro** — arcs grow **anti-clockwise** (rounded caps), then "Budget Friendly"
   and "your 100%" **fade in** (only the text fades; the ring grows).

- **No Ken-Burns zoom anywhere** (user disliked it; `SceneShell` drift removed).
- `SceneShell` has `fadeIn` flag (intro/outro/themeTitle manage their own entrance).
- `temp/video/src/theme.ts` = THEMES (brutalist/midnight/candy/mocha/terminal) + FONTS.

### Screenshots (`temp/video/public/screens/*.png`)
- 10 themes, captured at **deviceScaleFactor 3** (4320×2430) for crispness (user
  said quality felt dropped), **full viewport to the footer**, **Next dev "N" badge
  removed** (`document.querySelectorAll('nextjs-portal').forEach(e=>e.remove())`).
- Rich split so the app isn't sparse: Rent 28, Food 15, Transport 10, Savings 18,
  Fun 12, Health 9, Misc 8 — NGN 8,500 (7 buckets).
- Capture used `puppeteer-core` (installed ad hoc, **removed after each run**),
  Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`, headless, set
  `localStorage` `bf-store` + `bf-theme`, cycled themes via the theme menu, hid the
  dev portal, screenshot clip `{0,0,1440,810}`. Re-capture if app visuals change.

## App changes made this session (committed + pushed → auto-deploys on Vercel)

All in `components/BucketBar.tsx` — the **bucket-bar segment labels**:
- `97659bd` — **reverted** `usePaletteInk` to the original per-colour OKLCH-lightness
  pick (`L > 0.65 → oklch(0.2 0 0)` dark, else `#ffffff`), **removed the halo**. The
  earlier AA "one ink per theme + halo" looked worse; user chose looks over strict AA.
- `173f5e0` — **mono-inverse labels forced black** (`oklch(0.2 0 0)`) — white was
  unreadable on its light-grey ramp.
- `7e4b5cc` — **labels scale up on desktop**: `text-xs sm:text-sm lg:text-base`.

## Still pending / open

- **Loading screen** — finish per the section above (the active task).
- **"Other parts to slow down"** in the video — user said they'd point out which
  scenes; none specified yet beyond the intro (already slowed).
- **Color picker for the swatches** — long-queued, NOT done: replace the 8 preset
  colour swatches in the editor with a real colour picker.
- **Copy `showcase.mp4` out of `temp/`** (gitignored) to somewhere permanent for
  the user; offer again.

## Gotchas / environment

- **Turbopack dev CSS staleness**: after CSS/token edits, `rm -rf .next` + restart
  `npm run dev` or you'll verify against stale styles (burned us repeatedly).
- **Dynamic favicon is JS-owned** (no-flash script in `layout.tsx` + `applyThemeToDom`
  in `lib/store.ts`); `app/icon.svg` was deleted so React can't re-add a competing
  link. Don't reintroduce `app/icon.svg`.
- **`getComputedStyle().getPropertyValue('--pN')`** can serialise as `lab()` not
  `oklch()` — the reverted label code tolerates that (defaults to white when the
  oklch regex misses). If you ever need true luminance, rasterise on a 1px canvas.
- `temp/` is gitignored (and excluded from `tsconfig`); Remotion/puppeteer files
  there don't affect `tsc`/`build`.
- Commands: `npm run dev|build|lint`, `npx tsc --noEmit`. No test runner.
- Co-author trailer on commits: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
