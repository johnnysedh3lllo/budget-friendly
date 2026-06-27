"use client";

import { useEffect, useRef, useState } from "react";
import { MotionConfig } from "motion/react";
import { useBudget } from "@/lib/store";
import AmountInput from "./AmountInput";
import TemplatePicker from "./TemplatePicker";
import BucketTextAdd from "./BucketTextAdd";
import BucketBar from "./BucketBar";
import Summary from "./Summary";

export default function Calculator() {
  const hasHydrated = useBudget((s) => s.hasHydrated);
  const partitions = useBudget((s) => s.partitions);
  const distributeEvenly = useBudget((s) => s.distributeEvenly);
  const clearPartitions = useBudget((s) => s.clearPartitions);
  const reset = useBudget((s) => s.reset);

  // Measure the editor so the summary can match its height (desktop only).
  const editorRef = useRef<HTMLElement>(null);
  const [editorH, setEditorH] = useState(0);
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setEditorH(Math.round(el.getBoundingClientRect().height)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasHydrated]);

  if (!hasHydrated) {
    return (
      <div
        className="surface-raised min-h-[50vh] w-full animate-pulse p-6"
        aria-busy="true"
        aria-label="Loading your budget"
      />
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex w-full flex-col gap-5 lg:flex-row lg:items-start lg:justify-center">
        {/* Editor */}
        <section
          ref={editorRef}
          className="bf-scroll surface-raised flex flex-col gap-4 p-4 sm:gap-5 sm:p-6 lg:max-h-[min(54rem,calc(100dvh_-_7rem))] lg:min-w-0 lg:flex-[1.4] lg:overflow-y-auto"
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

            <BucketTextAdd />
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

        {/* Summary — matches the editor's height on desktop */}
        <aside
          className="bf-match-editor lg:flex lg:min-w-0 lg:flex-1 lg:flex-col"
          style={{ ["--editor-h" as string]: editorH ? `${editorH}px` : "auto" }}
        >
          <Summary />
        </aside>
      </div>
    </MotionConfig>
  );
}
