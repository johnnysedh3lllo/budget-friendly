"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useBudget, selectUnallocated } from "@/lib/store";
import { partitionColor } from "@/lib/colors";
import { formatMoney, formatMoneyCompact } from "@/lib/format";

export default function Summary({ onPick }: { onPick?: () => void } = {}) {
  const amount = useBudget((s) => s.amount);
  const currency = useBudget((s) => s.currency);
  const partitions = useBudget((s) => s.partitions);
  const selectedId = useBudget((s) => s.selectedId);
  const setSelected = useBudget((s) => s.setSelected);
  const removePartition = useBudget((s) => s.removePartition);
  const unallocated = selectUnallocated(partitions);
  const allocated = 100 - unallocated;

  const listRef = useRef<HTMLUListElement>(null);
  const [shadow, setShadow] = useState({ top: false, bottom: false });
  const updateShadow = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const top = el.scrollTop > 1;
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    setShadow((prev) =>
      prev.top === top && prev.bottom === bottom ? prev : { top, bottom },
    );
  }, []);
  useEffect(() => {
    updateShadow();
  }, [partitions, unallocated, updateShadow]);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateShadow);
    ro.observe(el);
    window.addEventListener("resize", updateShadow);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateShadow);
    };
  }, [updateShadow]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 sm:gap-5">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-lg">Your breakdown</h2>
        <StatusPill unallocated={unallocated} />
      </div>

      <div className="shrink-0">
        <Donut />
      </div>

      <div className="flex shrink-0 items-baseline justify-between gap-2 border-t pt-4">
        <span className="text-sm font-semibold text-ink-muted">Total</span>
        <span className="num text-xl font-bold text-ink sm:text-2xl">
          {formatMoney(amount, currency)}
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="bf-shadow-top" data-show={shadow.top} aria-hidden />
        <ul
          ref={listRef}
          onScroll={updateShadow}
          className="bf-scroll flex flex-1 flex-col gap-0.5 overflow-y-auto pr-1"
        >
          {partitions.map((p) => (
            <li key={p.id} className="group relative flex items-center">
              <button
                onClick={() => {
                  setSelected(p.id);
                  onPick?.();
                }}
                data-active={selectedId === p.id}
                aria-label={`Edit ${p.name || "Untitled"}`}
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[var(--radius-md)] py-2 pl-2 pr-10 text-left transition-colors group-hover:bg-surface-2 data-[active=true]:bg-surface-2"
              >
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full"
                  style={{ background: partitionColor(p.colorIndex) }}
                />
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">
                  {p.name || "Untitled"}
                </span>
                <span className="num shrink-0 text-sm text-ink-muted">
                  {p.percent}%
                </span>
                <span className="num shrink-0 text-right font-semibold text-ink">
                  {formatMoney(amount * (p.percent / 100), currency)}
                </span>
              </button>
              <button
                onClick={() => removePartition(p.id)}
                aria-label={`Remove ${p.name || "bucket"}`}
                title="Remove bucket"
                className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-ink-subtle opacity-60 transition-all hover:bg-[color-mix(in_oklch,var(--danger)_16%,transparent)] hover:text-[var(--danger)] hover:opacity-100 group-hover:opacity-100"
              >
                <TrashIcon />
              </button>
            </li>
          ))}

          {unallocated > 0 && (
            <li className="flex items-center gap-2.5 px-2 py-2 opacity-80">
              <span
                aria-hidden
                className="bf-hatch size-3 shrink-0 rounded-full"
              />
              <span className="min-w-0 flex-1 truncate font-semibold text-ink-muted">
                Unallocated
              </span>
              <span className="num shrink-0 text-sm text-ink-muted">
                {unallocated}%
              </span>
              <span className="num shrink-0 text-right font-semibold text-ink-muted">
                {formatMoney(amount * (unallocated / 100), currency)}
              </span>
            </li>
          )}
        </ul>
        <div className="bf-shadow-bottom" data-show={shadow.bottom} aria-hidden />
      </div>

      <p className="shrink-0 text-xs text-ink-subtle">
        {allocated === 100
          ? "Every part of your money has a job. Nice."
          : `${unallocated}% (${formatMoneyCompact(
              amount * (unallocated / 100),
              currency,
            )}) is still waiting for a home — drag a slider up or add a bucket.`}
      </p>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function StatusPill({ unallocated }: { unallocated: number }) {
  const done = unallocated === 0;
  return (
    <span
      className="num rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-bold"
      style={{
        background: done
          ? "color-mix(in oklch, var(--success) 18%, transparent)"
          : "var(--surface-2)",
        color: done ? "var(--success)" : "var(--ink-muted)",
      }}
    >
      {done ? "100% planned" : `${unallocated}% left`}
    </span>
  );
}

function Donut() {
  const amount = useBudget((s) => s.amount);
  const currency = useBudget((s) => s.currency);
  const partitions = useBudget((s) => s.partitions);
  const unallocated = selectUnallocated(partitions);

  const size = 180;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  let offset = 0;
  const segments = partitions
    .filter((p) => p.percent > 0)
    .map((p) => {
      const len = (p.percent / 100) * c;
      const seg = { id: p.id, color: partitionColor(p.colorIndex), len, offset };
      offset += len;
      return seg;
    });

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Donut chart, ${100 - unallocated}% allocated`}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        {segments.map((s) => (
          <motion.circle
            key={s.id}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeLinecap="butt"
            initial={false}
            animate={{
              strokeDasharray: `${s.len} ${c - s.len}`,
              strokeDashoffset: -s.offset,
            }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="num text-xl font-bold text-ink">
          {formatMoneyCompact(amount, currency)}
        </span>
        <span className="text-xs font-semibold text-ink-subtle">
          {100 - unallocated}% planned
        </span>
      </div>
    </div>
  );
}
