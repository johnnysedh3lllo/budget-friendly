"use client";

import { useEffect, useState } from "react";
import { useBudget } from "@/lib/store";
import { CURRENCIES, currencyOf } from "@/lib/format";
import { convertAmount, canConvert, useRates, type RateTable } from "@/lib/rates";
import Select from "./Select";

// Two currency selects sit beside the amount:
//   • left  = the currency the entered value is IN (the source/anchor)
//   • right = a currency to VIEW that value converted into.
// The source stays put, so flipping the right select shows the same value in any
// currency ($900 → in ₦, £, ₹ …). The right currency + its converted amount are
// the working values the rest of the app reads, so "you work in whatever you
// leave the right select on". Typing in the field re-anchors to the shown value.
export default function AmountInput() {
  const amount = useBudget((s) => s.amount); // working (converted) value
  const currency = useBudget((s) => s.currency); // working currency
  const srcAmount = useBudget((s) => s.srcAmount);
  const srcCurrency = useBudget((s) => s.srcCurrency);
  const viewCurrency = useBudget((s) => s.viewCurrency);
  const editAmount = useBudget((s) => s.editAmount);
  const setSourceCurrency = useBudget((s) => s.setSourceCurrency);
  const setViewCurrency = useBudget((s) => s.setViewCurrency);
  const clearView = useBudget((s) => s.clearView);
  const syncWorking = useBudget((s) => s.syncWorking);

  const [focused, setFocused] = useState(false);
  const { table, date, offline } = useRates();

  // Derive the working (amount, currency) from the anchor + view + live rates.
  function work(sa: number, sc: string, vc: string | null, t: RateTable) {
    const cur = vc ?? sc;
    const amt = vc ? convertAmount(sa, sc, vc, t) ?? sa : sa;
    return { amount: amt, currency: cur };
  }

  // When rates refresh under an active conversion, re-derive the working value.
  useEffect(() => {
    if (!viewCurrency) return;
    const w = work(srcAmount, srcCurrency, viewCurrency, table);
    if (w.amount !== amount || w.currency !== currency) {
      syncWorking(w.amount, w.currency);
    }
  }, [table, srcAmount, srcCurrency, viewCurrency, amount, currency, syncWorking]);

  const symbol = currencyOf(currency).symbol;
  const ratesDate = formatRatesDate(date);

  // Exchange rate for 1 unit of the source in the view currency (e.g. NGN/USD).
  const rate =
    viewCurrency &&
    table.rates[viewCurrency] != null &&
    table.rates[srcCurrency] != null &&
    table.rates[srcCurrency] !== 0
      ? table.rates[viewCurrency] / table.rates[srcCurrency]
      : null;
  const rateText = rate != null ? formatRate(rate) : null;

  // While focused, show the raw editable number; otherwise show grouping.
  const display = focused
    ? amount === 0
      ? ""
      : String(amount)
    : amount.toLocaleString(undefined, { maximumFractionDigits: 2 });

  function onPickSource(code: string) {
    const w = work(srcAmount, code, viewCurrency, table);
    setSourceCurrency(code, w.amount, w.currency);
  }
  function onPickView(code: string) {
    const w = work(srcAmount, srcCurrency, code, table);
    setViewCurrency(code, w.amount, w.currency);
  }

  const sourceOptions = CURRENCIES.map((c) => ({
    value: c.code,
    label: c.code,
    hint: c.label,
    keywords: c.countries,
  }));
  // Only offer view currencies we can actually convert the source into.
  const viewOptions = CURRENCIES.filter(
    (c) => c.code === srcCurrency || canConvert(table, srcCurrency, c.code),
  ).map((c) => ({
    value: c.code,
    label: c.code,
    hint: c.label,
    keywords: c.countries,
  }));

  const sourceLabel = currencyOf(srcCurrency).label;

  return (
    <div>
      <label htmlFor="amount" className="mb-2 block text-sm text-ink-muted">
        <span className="font-semibold">Amount to split</span>
        <span className="text-ink-subtle">
          {" "}
          — What you&apos;re working with; a paycheck, savings, anything.
        </span>
      </label>
      <div className="field flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-3">
        <span
          aria-hidden
          className="num text-2xl sm:text-3xl text-ink-muted shrink-0"
        >
          {symbol}
        </span>
        <input
          id="amount"
          inputMode="decimal"
          autoComplete="off"
          value={display}
          placeholder="0"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, "");
            const parsed = parseFloat(raw);
            editAmount(Number.isNaN(parsed) ? 0 : parsed);
          }}
          className="num w-full min-w-0 bg-transparent text-2xl sm:text-3xl font-semibold text-ink outline-none placeholder:text-ink-subtle"
        />
        {/* Left: the currency the entered value is in (source). */}
        <Select
          value={srcCurrency}
          onChange={onPickSource}
          ariaLabel="Amount currency"
          className="shrink-0"
          menuClassName="right-0 w-64"
          searchable
          options={sourceOptions}
        />
        {/* Right: convert-to / view-in currency. */}
        <Select
          value={viewCurrency ?? ""}
          onChange={onPickView}
          ariaLabel="Convert to currency"
          placeholder="to…"
          className="shrink-0"
          menuClassName="right-0 w-64"
          searchable
          options={viewOptions}
        />
        {viewCurrency && (
          <button
            type="button"
            onClick={clearView}
            aria-label="Clear conversion and edit the source value"
            title="Clear conversion"
            className="field flex shrink-0 cursor-pointer items-center justify-center px-2 py-2 text-ink-muted transition-colors hover:text-ink"
          >
            <ClearIcon />
          </button>
        )}
      </div>
      <p className="mt-1.5 text-xs text-ink-subtle">
        {viewCurrency && rateText ? (
          <>
            Showing{" "}
            {srcAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
            {srcCurrency} converted to {viewCurrency} at {rateText} {viewCurrency}/
            {srcCurrency}.
            {ratesDate && (
              <>
                {" "}
                Rates {offline ? "saved" : "as of"} {ratesDate}
                {offline ? " · offline" : ""}.
              </>
            )}
          </>
        ) : (
          <>
            Pick a second currency on the right to view this {sourceLabel} value
            converted.
            {ratesDate && (
              <span className="text-ink-subtle/80">
                {" "}
                Rates {offline ? "saved" : "as of"} {ratesDate}
                {offline ? " · offline" : ""}.
              </span>
            )}
          </>
        )}
      </p>
    </div>
  );
}

/** "2026-06-28" → "Jun 28, 2026"; empty string if unparseable. */
function formatRatesDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Exchange rate to a readable string: ≥1 keeps 2dp (1379.10), else 4 sig figs. */
function formatRate(rate: number): string {
  return rate >= 1 ? rate.toFixed(2) : Number(rate.toPrecision(4)).toString();
}

function ClearIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
