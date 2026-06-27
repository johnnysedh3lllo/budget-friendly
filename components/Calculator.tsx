"use client";

import { useState, type CSSProperties } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useBudget, selectUnallocated } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import AmountInput from "./AmountInput";
import TemplatePicker from "./TemplatePicker";
import BucketBar from "./BucketBar";
import Summary from "./Summary";

export default function Calculator() {
  const hasHydrated = useBudget((s) => s.hasHydrated);
  const amount = useBudget((s) => s.amount);
  const currency = useBudget((s) => s.currency);
  const partitions = useBudget((s) => s.partitions);
  const distributeEvenly = useBudget((s) => s.distributeEvenly);
  const clearPartitions = useBudget((s) => s.clearPartitions);
  const reset = useBudget((s) => s.reset);
  const [sheetOpen, setSheetOpen] = useState(false);

  const unallocated = selectUnallocated(partitions);
  const allocated = 100 - unallocated;

  if (!hasHydrated) {
    return <div className="flex-1 animate-pulse bg-surface-2/40" aria-busy />;
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-0 w-full flex-1 flex-col lg:flex-row">
        {/* Editor pane */}
        <section
          className="bf-reveal bf-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-24 pt-4 sm:gap-5 sm:px-6 sm:pt-6 lg:flex-[1.4] lg:pb-6"
          style={{ "--reveal-d": "0.05s" } as CSSProperties}
        >
          <div className="flex flex-col gap-4 sm:gap-5">
            <AmountInput />
            <TemplatePicker />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg">Where your money goes</h2>
              <div className="flex gap-2">
                <button
                  onClick={clearPartitions}
                  disabled={partitions.length === 0}
                  className="btn btn-ghost text-sm"
                >
                  Clear
                </button>
                <button
                  onClick={distributeEvenly}
                  disabled={partitions.length === 0}
                  className="btn btn-ghost text-sm"
                >
                  Even split
                </button>
              </div>
            </div>

            <BucketBar />
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              onClick={reset}
              className="text-xs font-semibold text-ink-subtle underline-offset-2 hover:text-ink-muted hover:underline"
            >
              Reset to the 50 / 30 / 20 starting point
            </button>
            <span className="text-xs text-ink-subtle">
              Saved on this device — no account, no tracking.
            </span>
          </div>
        </section>

        {/* Summary pane — desktop only */}
        <aside
          className="bf-reveal bf-scroll hidden min-h-0 border-l px-6 py-6 lg:flex lg:flex-1 lg:flex-col lg:overflow-y-auto"
          style={{ "--reveal-d": "0.1s" } as CSSProperties}
        >
          <Summary />
        </aside>
      </div>

      {/* Mobile: bottom bar that opens the breakdown sheet */}
      <button
        onClick={() => setSheetOpen(true)}
        aria-label="Show your breakdown"
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t bg-surface px-4 py-2.5 text-left lg:hidden"
      >
        <span className="flex min-w-0 flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
            Total
          </span>
          <span className="num truncate text-lg font-bold text-ink">
            {formatMoney(amount, currency)}
          </span>
        </span>
        <span className="btn btn-primary shrink-0 text-sm">
          Breakdown
          <span className="num opacity-80">· {allocated}%</span>
          <ChevronUp />
        </span>
      </button>

      {/* Mobile: breakdown sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Your breakdown"
              className="surface-raised absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col gap-4 p-4 pt-2.5"
              style={{
                borderTopLeftRadius: "var(--radius-lg)",
                borderTopRightRadius: "var(--radius-lg)",
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <div className="relative flex h-7 shrink-0 items-center justify-center">
                <span
                  aria-hidden
                  className="h-1.5 w-10 rounded-full"
                  style={{ background: "var(--border)" }}
                />
                <button
                  onClick={() => setSheetOpen(false)}
                  aria-label="Close breakdown"
                  className="btn btn-ghost absolute right-0 top-1/2 -translate-y-1/2 !px-2 !py-2"
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col">
                <Summary onPick={() => setSheetOpen(false)} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

function ChevronUp() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
