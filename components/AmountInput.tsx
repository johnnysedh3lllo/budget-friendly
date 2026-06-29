"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import { CURRENCIES, currencyOf } from "@/lib/format";
import { convertAmount, useRates } from "@/lib/rates";
import Select from "./Select";
import ConvertButton from "./ConvertButton";

export default function AmountInput() {
  const amount = useBudget((s) => s.amount);
  const currency = useBudget((s) => s.currency);
  const setAmount = useBudget((s) => s.setAmount);
  const setCurrency = useBudget((s) => s.setCurrency);
  const [focused, setFocused] = useState(false);
  const { table, date, offline } = useRates();

  const symbol = currencyOf(currency).symbol;

  // Rewrite the amount into the target currency, then switch to it. Percentages
  // are unaffected, so every bucket's figure re-derives automatically.
  function handleConvert(target: string) {
    if (target === currency) return;
    const next = convertAmount(amount, currency, target, table);
    if (next == null) return; // no rate for this pair — leave things untouched
    setAmount(next);
    setCurrency(target);
  }

  const ratesDate = formatRatesDate(date);

  // While focused, show the raw editable number; otherwise show grouping.
  const display = focused
    ? amount === 0
      ? ""
      : String(amount)
    : amount.toLocaleString(undefined, { maximumFractionDigits: 2 });

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
            setAmount(Number.isNaN(parsed) ? 0 : parsed);
          }}
          className="num w-full min-w-0 bg-transparent text-2xl sm:text-3xl font-semibold text-ink outline-none placeholder:text-ink-subtle"
        />
        <Select
          value={currency}
          onChange={setCurrency}
          ariaLabel="Currency"
          className="shrink-0"
          menuClassName="right-0 w-64"
          searchable
          options={CURRENCIES.map((c) => ({
            value: c.code,
            label: c.code,
            hint: c.label,
            keywords: c.countries,
          }))}
        />
        <ConvertButton
          current={currency}
          table={table}
          onConvert={handleConvert}
        />
      </div>
      <p className="mt-1.5 text-xs text-ink-subtle">
        Convert to another currency with the{" "}
        <span aria-hidden>⇄</span> button — your split stays the same.
        {ratesDate && (
          <>
            {" "}
            <span className="text-ink-subtle/80">
              Rates {offline ? "saved" : "as of"} {ratesDate}
              {offline ? " · offline" : ""}.
            </span>
          </>
        )}
      </p>
    </div>
  );
}

/** "2026-06-28" → "28 Jun 2026"; empty string if unparseable. */
function formatRatesDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
