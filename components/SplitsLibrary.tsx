"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import { partitionColor } from "@/lib/colors";
import { roundPercent } from "@/lib/format";
import type { SavedSplit } from "@/lib/types";

/** Render slices as the multi-bucket paste text: "Savings 30, Rent 10". */
export function slicesToText(slices: { name: string; percent: number }[]): string {
  return slices
    .map((s) => `${s.name || "Bucket"} ${roundPercent(s.percent)}`)
    .join(", ");
}

/** A thin stacked colour bar previewing a split (percent out of 100). */
export function MiniSplitBar({
  slices,
}: {
  slices: { percent: number; colorIndex: number }[];
}) {
  return (
    <div
      className="flex h-1.5 w-full overflow-hidden"
      style={{ borderRadius: "var(--radius-pill)", background: "var(--surface-2)" }}
    >
      {slices.map((s, i) => (
        <div
          key={i}
          style={{ width: `${s.percent}%`, background: partitionColor(s.colorIndex) }}
        />
      ))}
    </div>
  );
}

// The library of the user's saved splits (newest first). Borderless rows with
// hover affordances (like the summary list): click a row to load it, with copy
// and delete actions. A persisted list/grid switch and an internal scroll let
// it hold many entries while filling the space under the split bar.
export default function SplitsLibrary() {
  const savedSplits = useBudget((s) => s.savedSplits);
  const view = useBudget((s) => s.libraryView);
  const setView = useBudget((s) => s.setLibraryView);
  const applySavedSplit = useBudget((s) => s.applySavedSplit);
  const deleteSplit = useBudget((s) => s.deleteSplit);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function onCopy(split: SavedSplit) {
    navigator.clipboard
      ?.writeText(slicesToText(split.slices))
      .then(() => {
        setCopiedId(split.id);
        setTimeout(() => setCopiedId((c) => (c === split.id ? null : c)), 1200);
      })
      .catch(() => {});
  }

  return (
    <div className="flex flex-col lg:min-h-0 lg:flex-1">
      <div className="mb-2 flex items-center justify-between gap-2 lg:shrink-0">
        <h2 className="text-lg">Library</h2>
        {savedSplits.length > 0 && (
          <ViewSwitch view={view} onChange={setView} />
        )}
      </div>

      <div className="surface bf-scroll min-h-[7rem] overflow-y-auto p-1.5 lg:min-h-0 lg:flex-1">
        {savedSplits.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <BookmarkIcon />
            <p className="text-sm font-semibold text-ink-muted">
              No saved splits yet
            </p>
            <p className="max-w-[22rem] text-xs text-ink-subtle">
              Build a split, then hit{" "}
              <span className="font-semibold text-ink-muted">Save</span> to keep
              it here — or{" "}
              <span className="font-semibold text-ink-muted">
                Start from rule
              </span>{" "}
              above.
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
            {savedSplits.map((split) => (
              <li key={split.id} className="group">
                <div className="flex items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-2 transition-colors group-hover:bg-surface-2">
                  <button
                    type="button"
                    onClick={() => applySavedSplit(split)}
                    aria-label={`Load ${split.name} into the editor`}
                    className="flex min-w-0 flex-1 flex-col gap-1 text-left"
                  >
                    <span className="truncate font-semibold text-ink">
                      {split.name}
                    </span>
                    <span className="truncate text-xs text-ink-subtle">
                      {slicesToText(split.slices)}
                    </span>
                  </button>

                  <div className="hidden w-20 shrink-0 sm:block">
                    <MiniSplitBar slices={split.slices} />
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
                    <IconButton
                      label={
                        copiedId === split.id
                          ? `${split.name} copied`
                          : `Copy ${split.name} as text`
                      }
                      onClick={() => onCopy(split)}
                    >
                      {copiedId === split.id ? <CheckIcon /> : <CopyIcon />}
                    </IconButton>
                    <IconButton
                      label={`Delete ${split.name}`}
                      onClick={() => deleteSplit(split.id)}
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
