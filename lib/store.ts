"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Split, SavedBucket, Template, ThemeName } from "./types";
import { THEMES } from "./types";
import { clamp } from "./format";
import { detectCurrency } from "./detect-currency";

let idCounter = 0;
function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  idCounter += 1;
  return `p-${idCounter}`;
}

function nextColorIndex(splits: Split[]): number {
  const used = new Set(splits.map((p) => p.colorIndex));
  for (let i = 0; i < 8; i++) if (!used.has(i)) return i;
  return splits.length % 8;
}

export type ParsedSplit = { name: string; percent: number };

/**
 * Parse "Rent 35, Food 15, Fun 5" into splits. Segments split on commas or
 * newlines; within a segment the LAST number is the percent (so multi-word
 * names like "Emergency fund 10" work), and a trailing "%" is optional.
 * A segment with no number becomes a 0% split.
 */
export function parseSplitText(text: string): ParsedSplit[] {
  return text
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((seg) => {
      const m = seg.match(/^(.*?)[\s:=-]*?(\d+(?:\.\d+)?)\s*%?$/);
      if (m) {
        const name = m[1].trim() || "Split";
        // Keep decimals — "Rent 12.5" is a valid 12.5% split.
        return { name, percent: Math.abs(Number(m[2])) };
      }
      return { name: seg, percent: 0 };
    });
}

let probeCtx: CanvasRenderingContext2D | null = null;
/** Resolve any CSS colour (lab/oklch/var) to an `rgb(...)` string via canvas. */
function colorToRgb(color: string): string | null {
  if (typeof document === "undefined") return null;
  if (!probeCtx) {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    probeCtx = c.getContext("2d", { willReadFrequently: true });
  }
  if (!probeCtx || !color) return null;
  probeCtx.fillStyle = "#000";
  probeCtx.fillStyle = color;
  probeCtx.fillRect(0, 0, 1, 1);
  const [r, g, b] = probeCtx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

export function applyThemeToDom(theme: ThemeName) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  const cs = getComputedStyle(document.documentElement);

  // Keep the PWA / browser title bar in sync with the theme's background.
  const meta = document.querySelector('meta[name="theme-color"]');
  const bg = colorToRgb(cs.getPropertyValue("--bg").trim());
  if (meta && bg) meta.setAttribute("content", bg);

  // Recolour the favicon (aperture ring) to the theme's primary colours.
  const primary = colorToRgb(cs.getPropertyValue("--primary").trim());
  const ink = colorToRgb(cs.getPropertyValue("--primary-ink").trim());
  if (primary && ink) {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
      `<rect width="32" height="32" rx="7" fill="${primary}"/>` +
      `<circle cx="16" cy="16" r="9.5" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-dasharray="14.3 5.6" transform="rotate(-90 16 16)"/>` +
      `</svg>`;
    // Drop the static /icon.svg link (and any prior dynamic one) and append a
    // fresh link — replacing the element forces the browser to re-read it.
    document.querySelectorAll('link[rel="icon"]').forEach((l) => l.remove());
    const link = document.createElement("link");
    link.id = "bf-favicon";
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = "data:image/svg+xml," + encodeURIComponent(svg);
    document.head.appendChild(link);
  }
}

const DEFAULT_SPLITS: Split[] = [
  { id: "seed-needs", name: "Needs", percent: 50, colorIndex: 0 },
  { id: "seed-wants", name: "Wants", percent: 30, colorIndex: 1 },
  { id: "seed-savings", name: "Savings", percent: 20, colorIndex: 3 },
];

type StoredSplit = { name: string; percent: number; colorIndex: number };

/** Strip the live splits down to their saveable form (no ids). */
function splitsOf(parts: Split[]): StoredSplit[] {
  return parts.map((p) => ({
    name: p.name,
    percent: p.percent,
    colorIndex: p.colorIndex,
  }));
}

/** A stable signature of a bucket's splits (ignores ids) — detects unsaved edits. */
function bucketSig(splits: StoredSplit[]): string {
  return JSON.stringify(splits.map((s) => [s.name, s.percent, s.colorIndex]));
}

type State = {
  /** Working value + currency the rest of the app reads. With no conversion
   *  active these equal the source; with one active they are the converted view. */
  amount: number;
  currency: string;
  /** The entered value and the currency it's in (left select) — the anchor the
   *  view conversion is always computed from, so it stays put while you compare. */
  srcAmount: number;
  srcCurrency: string;
  /** Convert-to currency (right select); null = view the source as-is. */
  viewCurrency: string | null;
  /** True once the user explicitly picks a currency — stops location auto-detect. */
  currencyPinned: boolean;
  /** The live splits that make up the current bucket. */
  splits: Split[];
  /** Buckets the user saved to reuse, newest first. */
  savedBuckets: SavedBucket[];
  /** The saved bucket currently loaded, if any — so Save updates it in place. */
  activeBucketId: string | null;
  /** The bucket's splits as of the last save/load — drives the dirty dot + Revert. */
  savedBaseline: StoredSplit[];
  /** Persisted library layout preference. */
  libraryView: "list" | "grid";
  theme: ThemeName;
  hasHydrated: boolean;
  /** Id of the most recently added split, so its row can grab focus. */
  lastAddedId: string | null;
  /** The split currently open in the editor form (shared across panels). */
  selectedId: string | null;
};

type Actions = {
  editAmount: (value: number) => void;
  setSourceCurrency: (code: string, amount: number, currency: string) => void;
  setViewCurrency: (code: string, amount: number, currency: string) => void;
  clearView: () => void;
  syncWorking: (amount: number, currency: string) => void;
  setCurrencyAuto: (code: string) => void;
  addSplit: () => void;
  addSplitsFromText: (text: string) => void;
  removeSplit: (id: string) => void;
  renameSplit: (id: string, name: string) => void;
  setPercent: (id: string, percent: number) => void;
  setSplitAmount: (id: string, value: number) => void;
  adjustPair: (index: number, leftPercent: number) => void;
  recolorSplit: (id: string, colorIndex: number) => void;
  clearSplits: () => void;
  newBucket: () => void;
  applyTemplate: (template: Template) => void;
  applySavedBucket: (bucket: SavedBucket) => void;
  saveBucket: (name: string) => void;
  updateBucket: (id: string) => void;
  renameBucket: (id: string, name: string) => void;
  deleteBucket: (id: string) => void;
  revertBucket: () => void;
  setLibraryView: (view: "list" | "grid") => void;
  distributeEvenly: () => void;
  fillUnallocated: (id: string) => void;
  reset: () => void;
  setTheme: (theme: ThemeName) => void;
  cycleTheme: (direction?: 1 | -1) => void;
  randomTheme: () => void;
  setHasHydrated: (v: boolean) => void;
  clearLastAdded: () => void;
  setSelected: (id: string | null) => void;
};

export const useBudget = create<State & Actions>()(
  persist(
    (set, get) => ({
      amount: 3200,
      currency: "USD",
      srcAmount: 3200,
      srcCurrency: "USD",
      viewCurrency: null,
      currencyPinned: false,
      splits: DEFAULT_SPLITS,
      savedBuckets: [],
      activeBucketId: null,
      savedBaseline: splitsOf(DEFAULT_SPLITS),
      libraryView: "list",
      theme: "brutalist",
      hasHydrated: false,
      lastAddedId: null,
      selectedId: null,

      // Typing a value re-anchors the budget: it becomes the new source, in the
      // currency currently on screen, and any active conversion is cleared.
      editAmount: (value) =>
        set((s) => {
          const v = Number.isFinite(value) ? Math.max(0, value) : 0;
          // Working currency stays = s.currency; with view cleared the source
          // currency becomes that too.
          return { srcAmount: v, srcCurrency: s.currency, viewCurrency: null, amount: v };
        }),

      // Left select — the currency the entered value is in. The caller has the
      // live rates, so it computes the resulting working amount/currency and
      // passes them in; picking a source currency pins against auto-detect.
      setSourceCurrency: (code, amount, currency) =>
        set({ srcCurrency: code, currencyPinned: true, amount, currency }),

      // Right select — convert-to currency. Working values computed by the caller.
      setViewCurrency: (code, amount, currency) =>
        set({ viewCurrency: code, amount, currency }),

      // Clear the conversion: working returns to the source, ready to edit.
      clearView: () =>
        set((s) => ({
          viewCurrency: null,
          amount: s.srcAmount,
          currency: s.srcCurrency,
        })),

      // Re-derive working values when rates refresh under an active conversion.
      syncWorking: (amount, currency) => set({ amount, currency }),

      // Location-detected currency → set the source (and the working currency
      // when nothing is being converted) without pinning.
      setCurrencyAuto: (code) =>
        set((s) => ({ srcCurrency: code, currency: s.viewCurrency ?? code })),

      addSplit: () =>
        set((s) => {
          const allocated = s.splits.reduce((t, p) => t + p.percent, 0);
          const room = 100 - allocated;
          // Nothing to carve out once the bucket is fully allocated.
          if (room <= 0) return s;
          const id = newId();
          return {
            // Append so the new split lands on the right, next to the
            // unallocated space it carves from.
            splits: [
              ...s.splits,
              {
                id,
                name: "New split",
                percent: Math.min(10, room),
                colorIndex: nextColorIndex(s.splits),
              },
            ],
            lastAddedId: id,
            selectedId: id,
          };
        }),

      // Append splits parsed from text. Each is clamped to the room left at the
      // moment it's added, honouring the "never exceed 100%" rule; once room runs
      // out, further splits land at 0% for the user to adjust.
      addSplitsFromText: (text) =>
        set((s) => {
          const parsed = parseSplitText(text);
          if (parsed.length === 0) return s;
          const newParts: Split[] = [];
          let running = s.splits.reduce((t, p) => t + p.percent, 0);
          for (const item of parsed) {
            const room = Math.max(0, 100 - running);
            const pct = Math.min(item.percent, room);
            running += pct;
            newParts.push({
              id: newId(),
              name: item.name.slice(0, 28),
              percent: pct,
              colorIndex: nextColorIndex([...s.splits, ...newParts]),
            });
          }
          return {
            splits: [...s.splits, ...newParts],
            lastAddedId: newParts[0]?.id ?? null,
            selectedId: newParts[0]?.id ?? null,
          };
        }),

      removeSplit: (id) =>
        set((s) => ({
          splits: s.splits.filter((p) => p.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),

      renameSplit: (id, name) =>
        set((s) => ({
          splits: s.splits.map((p) => (p.id === id ? { ...p, name } : p)),
        })),

      // Block-at-available-room: a split can grow only into the unallocated
      // space. Lowering one frees room; raising past the room is impossible,
      // which nudges the user to lower another split first. Percent is kept at
      // full precision (no rounding) so amounts can land exactly.
      setPercent: (id, percent) =>
        set((s) => {
          const others = s.splits
            .filter((p) => p.id !== id)
            .reduce((t, p) => t + p.percent, 0);
          const max = 100 - others;
          const v = Number.isFinite(percent) ? percent : 0;
          const next = clamp(v, 0, max);
          return {
            splits: s.splits.map((p) => (p.id === id ? { ...p, percent: next } : p)),
          };
        }),

      // Set a split by its currency figure: back-derive the percent so e.g.
      // "₦50,000" lands exactly, whatever the total. Clamped to available room.
      setSplitAmount: (id, value) =>
        set((s) => {
          if (!(s.amount > 0)) return s; // can't derive a percent from nothing
          const others = s.splits
            .filter((p) => p.id !== id)
            .reduce((t, p) => t + p.percent, 0);
          const max = 100 - others;
          const v = Number.isFinite(value) ? Math.max(0, value) : 0;
          const pct = clamp((v / s.amount) * 100, 0, max);
          return {
            splits: s.splits.map((p) => (p.id === id ? { ...p, percent: pct } : p)),
          };
        }),

      // Move the boundary between split `index` and its right neighbour, trading
      // percent between just those two (their combined share is fixed, so the
      // unallocated remainder doesn't change).
      adjustPair: (index, leftPercent) =>
        set((s) => {
          if (index < 0 || index >= s.splits.length - 1) return s;
          const parts = [...s.splits];
          const left = parts[index];
          const right = parts[index + 1];
          const sum = left.percent + right.percent;
          const v = Number.isFinite(leftPercent) ? leftPercent : 0;
          const newLeft = clamp(v, 0, sum);
          parts[index] = { ...left, percent: newLeft };
          parts[index + 1] = { ...right, percent: sum - newLeft };
          return { splits: parts };
        }),

      recolorSplit: (id, colorIndex) =>
        set((s) => ({
          splits: s.splits.map((p) => (p.id === id ? { ...p, colorIndex } : p)),
        })),

      clearSplits: () =>
        set({ splits: [], lastAddedId: null, selectedId: null }),

      // Start a brand-new blank bucket from scratch: empty splits, detached from
      // any saved bucket (so a later Save creates a new library entry) with the
      // baseline reset so it doesn't read as "unsaved edits" to a saved bucket.
      newBucket: () =>
        set({
          splits: [],
          savedBaseline: [],
          activeBucketId: null,
          lastAddedId: null,
          selectedId: null,
        }),

      // Load a built-in rule as a starting point — not a saved bucket, so a
      // later Save creates a new library entry (activeBucketId cleared).
      applyTemplate: (template) =>
        set(() => {
          const splits = template.splits.map((part, i) => ({
            id: newId(),
            name: part.name,
            percent: part.percent,
            colorIndex: i % 8,
          }));
          return { splits, savedBaseline: splitsOf(splits), activeBucketId: null };
        }),

      // Load a saved bucket back into the editor, keeping its colours, and mark
      // it active so edits + Save update this entry in place.
      applySavedBucket: (bucket) =>
        set(() => {
          const splits = bucket.splits.map((part) => ({
            id: newId(),
            name: part.name,
            percent: part.percent,
            colorIndex: part.colorIndex,
          }));
          return { splits, savedBaseline: splitsOf(splits), activeBucketId: bucket.id };
        }),

      // Save the current bucket as a NEW library entry (newest first) and make
      // it the active one so further edits update it.
      saveBucket: (name) =>
        set((s) => {
          const id = newId();
          return {
            savedBuckets: [
              {
                id,
                name: name.trim().slice(0, 40) || "My bucket",
                splits: splitsOf(s.splits),
              },
              ...s.savedBuckets,
            ],
            savedBaseline: splitsOf(s.splits),
            activeBucketId: id,
          };
        }),

      // Overwrite an existing saved bucket with the current edit (no rename).
      updateBucket: (id) =>
        set((s) => ({
          savedBuckets: s.savedBuckets.map((x) =>
            x.id === id ? { ...x, splits: splitsOf(s.splits) } : x,
          ),
          savedBaseline: splitsOf(s.splits),
          activeBucketId: id,
        })),

      // Rename a saved bucket in place (ignores empty names).
      renameBucket: (id, name) =>
        set((s) => {
          const trimmed = name.trim().slice(0, 40);
          if (!trimmed) return s;
          return {
            savedBuckets: s.savedBuckets.map((x) =>
              x.id === id ? { ...x, name: trimmed } : x,
            ),
          };
        }),

      deleteBucket: (id) =>
        set((s) => ({
          savedBuckets: s.savedBuckets.filter((x) => x.id !== id),
          activeBucketId: s.activeBucketId === id ? null : s.activeBucketId,
        })),

      // Discard unsaved edits — restore the bucket to its last saved/loaded state.
      revertBucket: () =>
        set((s) => ({
          splits: (Array.isArray(s.savedBaseline) ? s.savedBaseline : []).map(
            (part) => ({
              id: newId(),
              name: part.name,
              percent: part.percent,
              colorIndex: part.colorIndex,
            }),
          ),
        })),

      setLibraryView: (view) => set({ libraryView: view }),

      distributeEvenly: () =>
        set((s) => {
          const n = s.splits.length;
          if (n === 0) return s;
          const base = Math.floor(100 / n);
          let remainder = 100 - base * n;
          return {
            splits: s.splits.map((p) => {
              const extra = remainder > 0 ? 1 : 0;
              remainder -= extra;
              return { ...p, percent: base + extra };
            }),
          };
        }),

      // Pour all remaining unallocated room into one split.
      fillUnallocated: (id) =>
        set((s) => {
          const allocated = s.splits.reduce((t, p) => t + p.percent, 0);
          const room = 100 - allocated;
          if (room <= 0) return s;
          return {
            splits: s.splits.map((p) =>
              p.id === id ? { ...p, percent: p.percent + room } : p,
            ),
          };
        }),

      reset: () =>
        set((s) => ({
          amount: 3200,
          srcAmount: 3200,
          viewCurrency: null,
          currency: s.srcCurrency,
          splits: DEFAULT_SPLITS,
          savedBaseline: splitsOf(DEFAULT_SPLITS),
          activeBucketId: null,
        })),

      setTheme: (theme) => {
        applyThemeToDom(theme);
        try {
          localStorage.setItem("bf-theme", theme);
        } catch {}
        set({ theme });
      },

      cycleTheme: (direction = 1) => {
        const order = THEMES.map((t) => t.id);
        const i = order.indexOf(get().theme);
        const next = order[(i + direction + order.length) % order.length];
        get().setTheme(next);
      },

      randomTheme: () => {
        const others = THEMES.map((t) => t.id).filter((t) => t !== get().theme);
        // No Math.random ban here (client action); index by current time-free entropy.
        const pick = others[Math.floor(Math.random() * others.length)];
        get().setTheme(pick);
      },

      setHasHydrated: (v) => set({ hasHydrated: v }),

      clearLastAdded: () => set({ lastAddedId: null }),

      setSelected: (id) => set({ selectedId: id }),
    }),
    {
      name: "bf-store",
      version: 3,
      // v1 stored savedBaseline as a signature string; v2 used the old
      // partition/split vocabulary. Carry both onto the current shape so saved
      // data survives the rename.
      migrate: (persisted) => {
        const p = persisted as Record<string, unknown> | undefined;
        if (!p) return p as unknown as State & Actions;
        // Old field names → new: partitions→splits, savedSplits→savedBuckets
        // (each entry's slices→splits), activeSplitId→activeBucketId.
        if (p.partitions && !p.splits) p.splits = p.partitions;
        if (Array.isArray(p.savedSplits) && !p.savedBuckets) {
          p.savedBuckets = (p.savedSplits as Record<string, unknown>[]).map((b) => ({
            id: b.id,
            name: b.name,
            splits: b.splits ?? b.slices ?? [],
          }));
        }
        if (p.activeSplitId !== undefined && p.activeBucketId === undefined) {
          p.activeBucketId = p.activeSplitId;
        }
        // v1 savedBaseline was a string signature — rebuild it from the splits.
        if (!Array.isArray(p.savedBaseline)) {
          const src = Array.isArray(p.splits) ? (p.splits as StoredSplit[]) : [];
          p.savedBaseline = src.map((x) => ({
            name: x.name,
            percent: x.percent,
            colorIndex: x.colorIndex,
          }));
        }
        delete p.partitions;
        delete p.savedSplits;
        delete p.activeSplitId;
        return p as unknown as State & Actions;
      },
      partialize: (s) => ({
        amount: s.amount,
        currency: s.currency,
        srcAmount: s.srcAmount,
        srcCurrency: s.srcCurrency,
        viewCurrency: s.viewCurrency,
        currencyPinned: s.currencyPinned,
        splits: s.splits,
        savedBuckets: s.savedBuckets,
        activeBucketId: s.activeBucketId,
        savedBaseline: s.savedBaseline,
        libraryView: s.libraryView,
        theme: s.theme,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDom(state.theme);
          // Until the user picks one, default to their location's currency.
          if (!state.currencyPinned) state.setCurrencyAuto(detectCurrency());
          state.setHasHydrated(true);
        }
      },
    },
  ),
);

/* ---- Derived selectors (computed from splits) ---- */

export function selectAllocated(splits: Split[]): number {
  return splits.reduce((t, p) => t + p.percent, 0);
}

/** True when the current bucket differs from the last saved/loaded one. */
export function selectIsDirty(s: {
  splits: Split[];
  savedBaseline: StoredSplit[];
}): boolean {
  const base = Array.isArray(s.savedBaseline) ? s.savedBaseline : [];
  return bucketSig(splitsOf(s.splits)) !== bucketSig(base);
}

export function selectUnallocated(splits: Split[]): number {
  // Swallow floating-point dust (e.g. 1e-13) so a fully-split bar reads as 0,
  // while a real remainder of any size is preserved.
  const u = 100 - selectAllocated(splits);
  return u <= 1e-9 ? 0 : u;
}
