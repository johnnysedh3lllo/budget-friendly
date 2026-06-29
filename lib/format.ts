import { CURRENCIES, currencyOf, type Currency } from "./currencies";

export { CURRENCIES, currencyOf };
export type { Currency };

/** Per-currency minor units (e.g. JPY 0, KWD 3); defaults to 2. */
function fractionDigits(code: string): number {
  return currencyOf(code).decimals ?? 2;
}

export function formatMoney(amount: number, code: string): string {
  try {
    // Intl knows each currency's own minor units — let it decide.
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
    }).format(amount);
  } catch {
    const c = currencyOf(code);
    return `${c.symbol}${amount.toFixed(fractionDigits(code))}`;
  }
}

/** Compact form for tight spaces — e.g. $1.2K, ₦3.4M. */
export function formatMoneyCompact(amount: number, code: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return formatMoney(amount, code);
  }
}

/**
 * Round a percent to a display precision (default 2dp), dropping trailing
 * zeros — 50 → 50, 29.75 → 29.75, 0.9765625 → 0.98. Percentages are stored at
 * full precision (so a typed amount stays exact); only the display is rounded.
 */
export function roundPercent(percent: number, maxDecimals = 2): number {
  return Number(percent.toFixed(maxDecimals));
}

export function formatPercent(percent: number, maxDecimals = 2): string {
  return `${roundPercent(percent, maxDecimals)}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
