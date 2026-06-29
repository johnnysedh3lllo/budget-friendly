"use client";

import { CURRENCIES } from "@/lib/format";
import { canConvert, type RateTable } from "@/lib/rates";
import Select from "./Select";

// A compact icon trigger beside the currency picker: pick a target currency and
// the amount is rewritten to its equivalent (the currency switches with it).
// Targets without a rate in the active table are hidden so every pick converts.
export default function ConvertButton({
  current,
  table,
  onConvert,
}: {
  current: string;
  table: RateTable;
  onConvert: (target: string) => void;
}) {
  const options = CURRENCIES.filter(
    (c) => c.code === current || canConvert(table, current, c.code),
  ).map((c) => ({
    value: c.code,
    label: c.code,
    hint: c.label,
    keywords: c.countries,
  }));

  return (
    <Select
      value={current}
      onChange={onConvert}
      ariaLabel="Convert amount to another currency"
      className="shrink-0"
      menuClassName="right-0 w-64"
      searchable
      options={options}
      triggerClassName="field flex h-full cursor-pointer items-center justify-center px-2.5 text-ink-muted transition-colors hover:text-ink"
      triggerChildren={<ConvertIcon />}
    />
  );
}

// Two arrows trading places — the universal "convert / swap" glyph.
function ConvertIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 3l4 4-4 4" />
      <path d="M20 7H4" />
      <path d="M8 21l-4-4 4-4" />
      <path d="M4 17h16" />
    </svg>
  );
}
