"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Partition, Template, ThemeName } from "./types";
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

function nextColorIndex(partitions: Partition[]): number {
  const used = new Set(partitions.map((p) => p.colorIndex));
  for (let i = 0; i < 8; i++) if (!used.has(i)) return i;
  return partitions.length % 8;
}

export type ParsedBucket = { name: string; percent: number };

/**
 * Parse "Rent 35, Food 15, Fun 5" into buckets. Segments split on commas or
 * newlines; within a segment the LAST number is the percent (so multi-word
 * names like "Emergency fund 10" work), and a trailing "%" is optional.
 * A segment with no number becomes a 0% bucket.
 */
export function parseBucketText(text: string): ParsedBucket[] {
  return text
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((seg) => {
      const m = seg.match(/^(.*?)[\s:=-]*?(\d+(?:\.\d+)?)\s*%?$/);
      if (m) {
        const name = m[1].trim() || "Bucket";
        return { name, percent: Math.round(Math.abs(Number(m[2]))) };
      }
      return { name: seg, percent: 0 };
    });
}

export function applyThemeToDom(theme: ThemeName) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
  }
}

const DEFAULT_PARTITIONS: Partition[] = [
  { id: "seed-needs", name: "Needs", percent: 50, colorIndex: 0 },
  { id: "seed-wants", name: "Wants", percent: 30, colorIndex: 1 },
  { id: "seed-savings", name: "Savings", percent: 20, colorIndex: 3 },
];

type State = {
  amount: number;
  currency: string;
  /** True once the user explicitly picks a currency — stops location auto-detect. */
  currencyPinned: boolean;
  partitions: Partition[];
  theme: ThemeName;
  hasHydrated: boolean;
  /** Id of the most recently added bucket, so its row can grab focus. */
  lastAddedId: string | null;
  /** The bucket currently open in the editor form (shared across panels). */
  selectedId: string | null;
};

type Actions = {
  setAmount: (amount: number) => void;
  setCurrency: (code: string) => void;
  setCurrencyAuto: (code: string) => void;
  addPartition: () => void;
  addPartitionsFromText: (text: string) => void;
  removePartition: (id: string) => void;
  renamePartition: (id: string, name: string) => void;
  setPercent: (id: string, percent: number) => void;
  adjustPair: (index: number, leftPercent: number) => void;
  recolorPartition: (id: string, colorIndex: number) => void;
  clearPartitions: () => void;
  applyTemplate: (template: Template) => void;
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
      currencyPinned: false,
      partitions: DEFAULT_PARTITIONS,
      theme: "brutalist",
      hasHydrated: false,
      lastAddedId: null,
      selectedId: null,

      setAmount: (amount) =>
        set({ amount: Number.isFinite(amount) ? Math.max(0, amount) : 0 }),

      // User picks a currency → pin it so auto-detect won't override later.
      setCurrency: (currency) => set({ currency, currencyPinned: true }),
      // Location-detected currency → set without pinning.
      setCurrencyAuto: (currency) => set({ currency }),

      addPartition: () =>
        set((s) => {
          const allocated = s.partitions.reduce((t, p) => t + p.percent, 0);
          const room = 100 - allocated;
          // Nothing to carve out once the split is fully allocated.
          if (room <= 0) return s;
          const id = newId();
          return {
            // Append so the new bucket lands on the right, next to the
            // unallocated space it carves from.
            partitions: [
              ...s.partitions,
              {
                id,
                name: "New bucket",
                percent: Math.min(10, room),
                colorIndex: nextColorIndex(s.partitions),
              },
            ],
            lastAddedId: id,
            selectedId: id,
          };
        }),

      // Append buckets parsed from text. Each is clamped to the room left at the
      // moment it's added, honouring the "never exceed 100%" rule; once room runs
      // out, further buckets land at 0% for the user to adjust.
      addPartitionsFromText: (text) =>
        set((s) => {
          const parsed = parseBucketText(text);
          if (parsed.length === 0) return s;
          const newParts: Partition[] = [];
          let running = s.partitions.reduce((t, p) => t + p.percent, 0);
          for (const item of parsed) {
            const room = Math.max(0, 100 - running);
            const pct = Math.min(item.percent, room);
            running += pct;
            newParts.push({
              id: newId(),
              name: item.name.slice(0, 28),
              percent: pct,
              colorIndex: nextColorIndex([...s.partitions, ...newParts]),
            });
          }
          return {
            partitions: [...s.partitions, ...newParts],
            lastAddedId: newParts[0]?.id ?? null,
            selectedId: newParts[0]?.id ?? null,
          };
        }),

      removePartition: (id) =>
        set((s) => ({
          partitions: s.partitions.filter((p) => p.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),

      renamePartition: (id, name) =>
        set((s) => ({
          partitions: s.partitions.map((p) =>
            p.id === id ? { ...p, name } : p,
          ),
        })),

      // Block-at-available-room: a slice can grow only into the unallocated
      // space. Lowering one frees room; raising past the room is impossible,
      // which nudges the user to lower another slice first.
      setPercent: (id, percent) =>
        set((s) => {
          const others = s.partitions
            .filter((p) => p.id !== id)
            .reduce((t, p) => t + p.percent, 0);
          const max = 100 - others;
          const next = clamp(Math.round(percent), 0, max);
          return {
            partitions: s.partitions.map((p) =>
              p.id === id ? { ...p, percent: next } : p,
            ),
          };
        }),

      // Move the boundary between bucket `index` and its right neighbour,
      // trading percent between just those two (their combined share is fixed,
      // so the unallocated remainder doesn't change).
      adjustPair: (index, leftPercent) =>
        set((s) => {
          if (index < 0 || index >= s.partitions.length - 1) return s;
          const parts = [...s.partitions];
          const left = parts[index];
          const right = parts[index + 1];
          const sum = left.percent + right.percent;
          const newLeft = clamp(Math.round(leftPercent), 0, sum);
          parts[index] = { ...left, percent: newLeft };
          parts[index + 1] = { ...right, percent: sum - newLeft };
          return { partitions: parts };
        }),

      recolorPartition: (id, colorIndex) =>
        set((s) => ({
          partitions: s.partitions.map((p) =>
            p.id === id ? { ...p, colorIndex } : p,
          ),
        })),

      clearPartitions: () =>
        set({ partitions: [], lastAddedId: null, selectedId: null }),

      applyTemplate: (template) =>
        set(() => ({
          partitions: template.slices.map((slice, i) => ({
            id: newId(),
            name: slice.name,
            percent: slice.percent,
            colorIndex: i % 8,
          })),
        })),

      distributeEvenly: () =>
        set((s) => {
          const n = s.partitions.length;
          if (n === 0) return s;
          const base = Math.floor(100 / n);
          let remainder = 100 - base * n;
          return {
            partitions: s.partitions.map((p) => {
              const extra = remainder > 0 ? 1 : 0;
              remainder -= extra;
              return { ...p, percent: base + extra };
            }),
          };
        }),

      // Pour all remaining unallocated room into one slice.
      fillUnallocated: (id) =>
        set((s) => {
          const allocated = s.partitions.reduce((t, p) => t + p.percent, 0);
          const room = 100 - allocated;
          if (room <= 0) return s;
          return {
            partitions: s.partitions.map((p) =>
              p.id === id ? { ...p, percent: p.percent + room } : p,
            ),
          };
        }),

      reset: () => set({ amount: 3200, partitions: DEFAULT_PARTITIONS }),

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
      version: 1,
      partialize: (s) => ({
        amount: s.amount,
        currency: s.currency,
        currencyPinned: s.currencyPinned,
        partitions: s.partitions,
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

/* ---- Derived selectors (computed from partitions) ---- */

export function selectAllocated(partitions: Partition[]): number {
  return partitions.reduce((t, p) => t + p.percent, 0);
}

export function selectUnallocated(partitions: Partition[]): number {
  return Math.max(0, 100 - selectAllocated(partitions));
}
