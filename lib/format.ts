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

export function formatPercent(percent: number): string {
  return `${percent}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
