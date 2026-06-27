export type Currency = { code: string; symbol: string; label: string };

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "NGN", symbol: "₦", label: "Nigerian Naira" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "CAD", symbol: "$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "$", label: "Australian Dollar" },
];

export function currencyOf(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

/** Whole-unit currencies (e.g. JPY) shouldn't show decimals. */
function fractionDigits(code: string): number {
  return code === "JPY" ? 0 : 2;
}

export function formatMoney(amount: number, code: string): string {
  const digits = fractionDigits(code);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    const c = currencyOf(code);
    return `${c.symbol}${amount.toFixed(digits)}`;
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
