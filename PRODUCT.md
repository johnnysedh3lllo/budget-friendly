# Product

## Register

product

## Users

People who manage their own money and have found fixed budgeting rules (50/30/20,
60/20/20, 50/40/10) too rigid for how their lives actually work. They are
financially curious but not necessarily financial experts. Their context is a
quiet moment of planning — deciding how a paycheck, a windfall, or a monthly
income should be split — usually on a phone or laptop, not under time pressure.
The job to be done: *"Take whatever money I'm putting in and divide it across the
splits that matter to me, in whatever proportions fit my life, and show me the
real amounts."*

## Product Purpose

Budget Friendly is a flexible percentage budget calculator. Instead of forcing a
named rule, the user starts with 100% and carves it into any number of named
splits (down to 1% each). Whatever is left over lives in an explicit
**Unallocated** split. Enter an amount and every split shows its real
currency figure plus the running total. The existing budgeting rules become
*starting templates*, not constraints. A whole set of splits is a "bucket" the
user can save and reuse.

Success looks like: a first-time user reaches a personally meaningful bucket in
under a minute, trusts the math, and comes back because adjusting it feels good
rather than like a chore.

Long-term vision (NOT in the MVP, recorded for direction): connect a bank,
auto-route incoming money to accounts behind each label, sub-labels within
labels, lockable splits, and an embeddable view inside existing banking apps.
The MVP is built so this can grow without re-platforming.

## Brand Personality

Playful, encouraging, honest. Three words: **friendly, deft, clear.** Money is
stressful; the interface should feel like a calm, slightly joyful tool that is on
the user's side — never preachy, never gamified into noise. The voice is plain
and warm: it names things the way a person would ("Wants", "Savings",
"Unallocated"), explains the rare friction moment instead of scolding, and
celebrates a balanced budget with restraint.

## Anti-references

- Spreadsheet-grey enterprise finance tools (Mint-era density, joyless tables).
- Crypto/neon "to the moon" hype dashboards.
- Over-gamified savings apps that bury the numbers under confetti and mascots.
- Generic AI-SaaS look: Inter-on-white, purple→blue gradients, identical
  icon-topped feature cards, tiny uppercase tracked eyebrows over every section.

## Design Principles

1. **The number is the hero.** Every interaction exists to make the real money
   amounts legible and trustworthy. Decoration never competes with figures.
2. **Constraints are conversations, not walls.** When the user hits 100%, the app
   explains the room they have and points at where to find more — it never
   silently clamps or scolds.
3. **Personality lives in theme, restraint lives in interaction.** Standard,
   familiar affordances (sliders, inputs, steppers) carry the task; the four
   themes carry the fun. We never reinvent a control for flavor.
4. **Everything is a token.** Color, type, spacing, radius, shadow, motion and
   density are all theme-swappable. No hard-coded visual value escapes the system.
5. **Joy is earned at moments.** Delight appears at meaningful beats (a balanced
   budget, a value landing) — not as ambient animation on every element.

## Accessibility & Inclusion

- Target **WCAG 2.2 AA**. Body text ≥ 4.5:1, large/UI text ≥ 3:1, verified per
  theme (each theme's palette is contrast-checked, not just the default).
- Every split is identifiable without relying on color alone (name + amount
  + position, not just its color swatch) — works for color-blind users.
- All controls keyboard-operable with visible focus rings; sliders are real
  range inputs with ARIA value text announcing percent and amount.
- `prefers-reduced-motion` respected everywhere: bouncy/spring motion degrades to
  a quick crossfade or instant state change.
- Money figures use tabular (monospaced) numerals so digits don't jitter while
  dragging.
