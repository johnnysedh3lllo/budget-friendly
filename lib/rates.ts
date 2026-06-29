"use client";

// Offline-first FX rates. Conversion is pure arithmetic — only the rate numbers
// need the network — so we layer three sources, strongest fallback last:
//   1. a build-time snapshot bundled in the app (works on a first-ever offline
//      visit),  2. a localStorage cache of the last live fetch,  3. a background
//      refresh when online and the cache is stale.
// The UI never waits on the network: it converts against the best rates already
// on disk and quietly updates them for next time.

import { useEffect, useState } from "react";
import snapshot from "./rates-snapshot.json";
import { currencyOf } from "./currencies";

export type RateTable = {
  /** Base currency every rate is expressed against (rate = 1 base → N units). */
  base: string;
  /** ISO date the rates are dated (from the source). */
  date: string;
  rates: Record<string, number>;
};

type CachedTable = RateTable & { fetchedAt: number };

const CACHE_KEY = "bf-rates";
const TTL_MS = 12 * 60 * 60 * 1000; // refresh at most ~twice a day
const ENDPOINTS = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json",
  "https://latest.currency-api.pages.dev/v1/currencies/usd.min.json",
];

const SNAPSHOT = snapshot as RateTable;

/** True when both codes have a rate, so a conversion is actually possible. */
export function canConvert(table: RateTable, from: string, to: string): boolean {
  return table.rates[from] != null && table.rates[to] != null;
}

/**
 * Convert `amount` between currencies using a base-anchored table (rate =
 * units per 1 base). Returns the amount rounded to the target's minor units, or
 * null if either side has no rate. Same currency is a no-op.
 */
export function convertAmount(
  amount: number,
  from: string,
  to: string,
  table: RateTable,
): number | null {
  if (from === to) return amount;
  const rFrom = table.rates[from];
  const rTo = table.rates[to];
  if (rFrom == null || rTo == null || rFrom === 0) return null;
  const converted = (amount / rFrom) * rTo;
  const decimals = currencyOf(to).decimals ?? 2;
  const factor = 10 ** decimals;
  return Math.round(converted * factor) / factor;
}

function readCache(): CachedTable | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedTable;
    if (parsed?.rates && parsed.base) return parsed;
  } catch {}
  return null;
}

async function fetchLive(): Promise<RateTable | null> {
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = (await res.json()) as { date: string; usd: Record<string, number> };
      if (!json?.usd) continue;
      const rates: Record<string, number> = { USD: 1 };
      // Keep only codes the app already knows; the source lists crypto + more.
      for (const code of Object.keys(SNAPSHOT.rates)) {
        const v = json.usd[code.toLowerCase()];
        if (typeof v === "number") rates[code] = v;
      }
      return { base: "USD", date: json.date, rates };
    } catch {}
  }
  return null;
}

export type RatesState = {
  table: RateTable;
  /** ISO date the active rates are dated. */
  date: string;
  /** "snapshot" until a live/cached table loads, then "live". */
  source: "snapshot" | "live";
  /** True while the browser reports itself offline. */
  offline: boolean;
};

/**
 * Best rates available right now, refreshing in the background when stale and
 * online. Starts from the bundled snapshot so the very first render can already
 * convert, then upgrades to cached/live rates without blocking.
 */
export function useRates(): RatesState {
  const [state, setState] = useState<RatesState>({
    table: SNAPSHOT,
    date: SNAPSHOT.date,
    source: "snapshot",
    offline: false,
  });

  useEffect(() => {
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    const cached = readCache();
    if (cached) {
      setState({ table: cached, date: cached.date, source: "live", offline });
    } else {
      setState((s) => ({ ...s, offline }));
    }

    const age = cached ? Date.now() - cached.fetchedAt : Infinity;
    if (age > TTL_MS && !offline) {
      fetchLive().then((fresh) => {
        if (!fresh) return;
        const stamped: CachedTable = { ...fresh, fetchedAt: Date.now() };
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(stamped));
        } catch {}
        setState({ table: fresh, date: fresh.date, source: "live", offline: false });
      });
    }

    const sync = () =>
      setState((s) => ({ ...s, offline: !navigator.onLine }));
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return state;
}
