"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useBudget } from "@/lib/store";
import { partitionColor } from "@/lib/colors";
import { formatMoney, roundPercent } from "@/lib/format";
import { MiniSplitBar } from "./SplitsLibrary";

// "Save" button beside the split heading. Opens a modal that previews the
// current breakdown and asks for a name before saving it to the library.
export default function SaveSplit() {
  const partitions = useBudget((s) => s.partitions);
  const amount = useBudget((s) => s.amount);
  const currency = useBudget((s) => s.currency);
  const saveSplit = useBudget((s) => s.saveSplit);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const canSave = partitions.length > 0;

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  function submit() {
    if (!name.trim()) return;
    saveSplit(name);
    setName("");
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!canSave}
        title="Save this split to your library"
        className="btn btn-ghost gap-1.5 text-sm"
      >
        <SaveIcon />
        Save
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
              aria-label="Save this split"
              className="surface-raised relative z-10 flex w-full max-w-sm flex-col gap-4 p-4"
              style={{ borderRadius: "var(--radius-lg)" }}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-ink">
                  Save this split
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

              {/* Preview of what's being saved. */}
              <div className="surface flex flex-col gap-2.5 p-3">
                <MiniSplitBar slices={partitions} />
                <ul className="flex flex-col gap-1.5">
                  {partitions.map((p) => (
                    <li key={p.id} className="flex items-center gap-2 text-sm">
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: partitionColor(p.colorIndex) }}
                      />
                      <span className="min-w-0 flex-1 truncate text-ink">
                        {p.name || "Untitled"}
                      </span>
                      <span className="num shrink-0 text-ink-muted">
                        {roundPercent(p.percent)}%
                      </span>
                      <span className="num shrink-0 text-ink-subtle">
                        {formatMoney(amount * (p.percent / 100), currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                placeholder="Name this split — e.g. My paycheck"
                aria-label="Split name"
                className="field w-full px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-subtle"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn btn-ghost text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={!name.trim()}
                  className="btn btn-primary text-sm"
                >
                  Save split
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function SaveIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
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
