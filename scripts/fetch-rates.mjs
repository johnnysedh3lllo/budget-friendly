// Refreshes lib/rates-snapshot.json — the build-time FX baseline that ships in
// the bundle so conversion works even on a first-ever offline visit (layer 1 of
// the rate strategy; localStorage cache + live fetch are layers 2–3 at runtime).
//
// Source: Fawaz Ahmed's free currency-api (no key, CDN, CORS-friendly). It lists
// every fiat code plus crypto + dead codes, so we filter to the app's CURRENCIES.
// Network failure is non-fatal: we keep the existing snapshot and exit 0 so an
// offline build still succeeds.
//
//   npm run rates   # refresh on demand
//   (also runs automatically via the "prebuild" hook)

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = resolve(here, "../lib/rates-snapshot.json");
const CURRENCIES_PATH = resolve(here, "../lib/currencies.ts");

const ENDPOINTS = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json",
  "https://latest.currency-api.pages.dev/v1/currencies/usd.min.json",
];

// Pull the code list straight from currencies.ts so the snapshot can never
// drift from the picker — no second hand-maintained list.
async function codesFromSource() {
  const src = await readFile(CURRENCIES_PATH, "utf8");
  const codes = new Set();
  for (const m of src.matchAll(/code:\s*"([A-Z]{3})"/g)) codes.add(m[1]);
  return [...codes];
}

async function fetchTable() {
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      if (json?.usd) return json;
    } catch (err) {
      console.warn(`  ↳ ${url} failed: ${err.message}`);
    }
  }
  return null;
}

async function main() {
  const codes = await codesFromSource();
  const table = await fetchTable();

  if (!table) {
    console.warn(
      "[rates] Could not reach any rate source — keeping existing snapshot.",
    );
    return; // exit 0: offline builds still succeed on the bundled baseline.
  }

  const rates = { USD: 1 };
  const missing = [];
  for (const code of codes) {
    const v = table.usd[code.toLowerCase()];
    if (typeof v === "number") rates[code] = v;
    else if (code !== "USD") missing.push(code);
  }

  const snapshot = { base: "USD", date: table.date, rates };
  await writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + "\n");

  console.log(
    `[rates] Snapshot written: ${Object.keys(rates).length} currencies, dated ${table.date}.`,
  );
  if (missing.length) {
    console.warn(`[rates] No rate for: ${missing.join(", ")}`);
  }
}

main().catch((err) => {
  // Never fail the build over rates; the bundled snapshot is the fallback.
  console.warn(`[rates] Unexpected error, keeping existing snapshot: ${err.message}`);
});
