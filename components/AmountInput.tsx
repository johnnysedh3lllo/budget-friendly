"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import { CURRENCIES, currencyOf } from "@/lib/format";
import Select from "./Select";

export default function AmountInput() {
  const amount = useBudget((s) => s.amount);
  const currency = useBudget((s) => s.currency);
  const setAmount = useBudget((s) => s.setAmount);
  const setCurrency = useBudget((s) => s.setCurrency);
  const [focused, setFocused] = useState(false);

  const symbol = currencyOf(currency).symbol;

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
          menuClassName="right-0 w-48"
          options={CURRENCIES.map((c) => ({
            value: c.code,
            label: c.code,
            hint: c.label,
          }))}
        />
      </div>
    </div>
  );
}
