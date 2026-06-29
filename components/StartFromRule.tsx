"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useBudget } from "@/lib/store";
import { TEMPLATES } from "@/lib/templates";
import type { Template } from "@/lib/types";
import { MiniBucketBar } from "./BucketsLibrary";

// "Start from rule" — a button (beside Clear / Even split) that opens a modal of
// the built-in starting rules with a search box. The list shows ~5 at a time and
// scrolls, so the modal stays compact. Picking one loads it and closes.
export default function StartFromRule() {
  const applyTemplate = useBudget((s) => s.applyTemplate);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TEMPLATES;
    return TEMPLATES.filter((t) => {
      const hay = `${t.name} ${t.tagline} ${t.splits
        .map((s) => s.name)
        .join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  function pick(t: Template) {
    applyTemplate(t);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ghost gap-1.5 text-sm"
      >
        <RuleIcon />
        Start from rule
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-black/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Start from a rule"
              className="surface-raised relative z-10 flex w-full max-w-sm flex-col gap-3 p-4"
              style={{ borderRadius: "var(--radius-lg)" }}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter" && filtered.length > 0) {
                  e.preventDefault();
                  pick(filtered[0]);
                }
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-ink">
                  Start from a rule
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="btn btn-ghost !px-2 !py-2"
                >
                  <CloseIcon />
                </button>
              </div>

              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search rules…"
                aria-label="Search rules"
                className="field w-full px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-subtle"
              />

              {filtered.length === 0 ? (
                <p className="px-1 py-6 text-center text-sm text-ink-subtle">
                  No rules match “{query}”.
                </p>
              ) : (
                <ul className="bf-scroll -mx-1 flex max-h-[19rem] flex-col gap-0.5 overflow-y-auto px-1">
                  {filtered.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => pick(t)}
                        className="flex w-full flex-col gap-1.5 rounded-[var(--radius-md)] px-2 py-2 text-left transition-colors hover:bg-surface-2"
                      >
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate font-semibold text-ink">
                            {t.name}
                          </span>
                          <span className="shrink-0 text-xs text-ink-subtle">
                            {t.splits.length} splits
                          </span>
                        </span>
                        <MiniBucketBar
                          splits={t.splits.map((s, i) => ({
                            percent: s.percent,
                            colorIndex: i % 8,
                          }))}
                        />
                        <span className="truncate text-xs text-ink-subtle">
                          {t.tagline}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function RuleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
