"use client";

import { useEffect, useRef, useState } from "react";
import { useBudget } from "@/lib/store";
import { splitColor } from "@/lib/colors";
import { roundPercent } from "@/lib/format";
import type { SavedBucket } from "@/lib/types";

/** Render a bucket's splits as the multi-split paste text: "Savings 30, Rent 10". */
export function splitsToText(splits: { name: string; percent: number }[]): string {
  return splits
    .map((s) => `${s.name || "Split"} ${roundPercent(s.percent)}`)
    .join(", ");
}

/** A thin stacked colour bar previewing a bucket's splits (percent out of 100). */
export function MiniBucketBar({
  splits,
}: {
  splits: { percent: number; colorIndex: number }[];
}) {
  return (
    <span
      className="flex h-1.5 w-full overflow-hidden"
      style={{ borderRadius: "var(--radius-pill)", background: "var(--surface-2)" }}
    >
      {splits.map((s, i) => (
        <span
          key={i}
          style={{ width: `${s.percent}%`, background: splitColor(s.colorIndex) }}
        />
      ))}
    </span>
  );
}

// The library of the user's saved buckets (newest first). Borderless rows with
// hover affordances (like the summary list): click a row to load it, with copy
// and delete actions. A persisted list/grid switch and an internal scroll let
// it hold many entries while filling the space under the split bar.
export default function BucketsLibrary() {
  const savedBuckets = useBudget((s) => s.savedBuckets);
  const view = useBudget((s) => s.libraryView);
  const setView = useBudget((s) => s.setLibraryView);
  const applySavedBucket = useBudget((s) => s.applySavedBucket);
  const deleteBucket = useBudget((s) => s.deleteBucket);
  const renameBucket = useBudget((s) => s.renameBucket);
  const activeBucketId = useBudget((s) => s.activeBucketId);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editRef = useRef<HTMLSpanElement>(null);
  const seedRef = useRef("");

  function startRename(bucket: SavedBucket) {
    seedRef.current = bucket.name;
    setEditingId(bucket.id);
  }
  function commitRename() {
    if (!editingId) return;
    renameBucket(editingId, editRef.current?.textContent ?? "");
    setEditingId(null);
  }

  // On entering edit: seed the text, focus, and drop the caret at the end.
  useEffect(() => {
    if (!editingId) return;
    const el = editRef.current;
    if (!el) return;
    el.textContent = seedRef.current;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [editingId]);

  function onCopy(bucket: SavedBucket) {
    navigator.clipboard
      ?.writeText(splitsToText(bucket.splits))
      .then(() => {
        setCopiedId(bucket.id);
        setTimeout(() => setCopiedId((c) => (c === bucket.id ? null : c)), 1200);
      })
      .catch(() => {});
  }

  return (
    <div className="flex flex-col lg:min-h-0 lg:flex-1">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-lg">Library</h2>
        {savedBuckets.length > 0 && (
          <ViewSwitch view={view} onChange={setView} />
        )}
      </div>

      <div className="surface bf-scroll min-h-[15rem] overflow-y-auto p-1.5 lg:min-h-[7rem] lg:flex-1">
        {savedBuckets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <BookmarkIcon />
            <p className="text-sm font-semibold text-ink-muted">
              No saved buckets yet
            </p>
            <p className="max-w-[22rem] text-xs text-ink-subtle">
              Build a bucket and{" "}
              <span className="font-semibold text-ink-muted">Save</span> it here.
            </p>
          </div>
        ) : (
          <ul
            className={
              view === "grid"
                ? "grid gap-0.5 sm:grid-cols-2"
                : "flex flex-col gap-0.5"
            }
          >
            {savedBuckets.map((bucket) => (
              <li key={bucket.id} className="group">
                <div
                  data-active={bucket.id === activeBucketId}
                  className="relative flex items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-2 transition-colors group-hover:bg-surface-2 data-[active=true]:bg-surface-2 data-[active=true]:ring-1 data-[active=true]:ring-inset data-[active=true]:ring-[var(--primary)]"
                >
                  {/* Full-row load target behind the content; hidden while
                      renaming so a click doesn't load mid-edit. */}
                  {editingId !== bucket.id && (
                    <button
                      type="button"
                      onClick={() => applySavedBucket(bucket)}
                      aria-label={`Load ${bucket.name} into the editor`}
                      className="absolute inset-0 rounded-[var(--radius-md)]"
                    />
                  )}

                  <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex min-w-0 items-center gap-2">
                      {editingId === bucket.id ? (
                        <span
                          ref={editRef}
                          contentEditable
                          suppressContentEditableWarning
                          role="textbox"
                          aria-label={`Rename ${bucket.name}`}
                          spellCheck={false}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitRename();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              setEditingId(null);
                            }
                          }}
                          className="pointer-events-auto whitespace-pre font-semibold text-ink outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => startRename(bucket)}
                          title="Click to rename"
                          className="pointer-events-auto min-w-0 cursor-text truncate text-left font-semibold text-ink underline-offset-2 hover:underline"
                        >
                          {bucket.name}
                        </button>
                      )}
                      <span className="w-16 shrink-0">
                        <MiniBucketBar splits={bucket.splits} />
                      </span>
                    </span>
                    <span className="truncate text-xs text-ink-subtle">
                      {splitsToText(bucket.splits)}
                    </span>
                  </div>

                  <div className="relative z-10 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <IconButton
                      label={
                        copiedId === bucket.id
                          ? `${bucket.name} copied`
                          : `Copy ${bucket.name} as text`
                      }
                      onClick={() => onCopy(bucket)}
                    >
                      {copiedId === bucket.id ? <CheckIcon /> : <CopyIcon />}
                    </IconButton>
                    <IconButton
                      label={`Delete ${bucket.name}`}
                      onClick={() => deleteBucket(bucket.id)}
                      danger
                    >
                      <TrashIcon />
                    </IconButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ViewSwitch({
  view,
  onChange,
}: {
  view: "list" | "grid";
  onChange: (v: "list" | "grid") => void;
}) {
  return (
    <div
      role="group"
      aria-label="Library layout"
      className="flex items-center gap-0.5 rounded-[var(--radius-sm)] p-0.5"
      style={{ background: "var(--surface-2)" }}
    >
      <ViewButton
        active={view === "list"}
        label="List view"
        onClick={() => onChange("list")}
      >
        <ListIcon />
      </ViewButton>
      <ViewButton
        active={view === "grid"}
        label="Grid view"
        onClick={() => onChange("grid")}
      >
        <GridIcon />
      </ViewButton>
    </div>
  );
}

function ViewButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className="rounded-[var(--radius-sm)] p-1 text-ink-subtle transition-colors data-[on=true]:text-ink"
      data-on={active}
      style={active ? { background: "var(--surface)" } : undefined}
    >
      {children}
    </button>
  );
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-[var(--radius-sm)] p-1.5 text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink ${
        danger
          ? "hover:!bg-[color-mix(in_oklch,var(--danger)_16%,transparent)] hover:!text-[var(--danger)]"
          : ""
      }`}
    >
      {children}
    </button>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-ink-subtle">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
