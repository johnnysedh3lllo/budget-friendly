"use client";

import { useState } from "react";
import { useBudget } from "@/lib/store";
import { TEMPLATES } from "@/lib/templates";
import { partitionColor } from "@/lib/colors";
import { roundPercent } from "@/lib/format";

type Slice = { name: string; percent: number; colorIndex: number };
type Item =
  | { kind: "saved"; id: string; name: string; slices: Slice[] }
  | { kind: "builtin"; id: string; name: string; tagline: string; slices: Slice[] };

/** Render slices as the multi-bucket paste text: "Savings 30, Rent 10". */
function slicesToText(slices: { name: string; percent: number }[]): string {
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
      className="flex h-2 w-full overflow-hidden"
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

// The library of starting splits: the user's saved splits first (newest at the
// top), then the built-in rules. Each row can be loaded into the editor, copied
// as paste-able text, or removed (saved → deleted, built-in → hidden).
export default function SplitsLibrary() {
  const savedSplits = useBudget((s) => s.savedSplits);
  const hiddenTemplateIds = useBudget((s) => s.hiddenTemplateIds);
  const applyTemplate = useBudget((s) => s.applyTemplate);
  const applySavedSplit = useBudget((s) => s.applySavedSplit);
  const deleteSplit = useBudget((s) => s.deleteSplit);
  const hideTemplate = useBudget((s) => s.hideTemplate);
  const restoreTemplates = useBudget((s) => s.restoreTemplates);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const items: Item[] = [
    ...savedSplits.map(
      (s): Item => ({ kind: "saved", id: s.id, name: s.name, slices: s.slices }),
    ),
    ...TEMPLATES.filter((t) => !hiddenTemplateIds.includes(t.id)).map(
      (t): Item => ({
        kind: "builtin",
        id: t.id,
        name: t.name,
        tagline: t.tagline,
        slices: t.slices.map((sl, i) => ({ ...sl, colorIndex: i % 8 })),
      }),
    ),
  ];

  function onLoad(item: Item) {
    if (item.kind === "saved") {
      applySavedSplit({ id: item.id, name: item.name, slices: item.slices });
    } else {
      const t = TEMPLATES.find((x) => x.id === item.id);
      if (t) applyTemplate(t);
    }
  }

  function onCopy(item: Item) {
    const text = slicesToText(item.slices);
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopiedId(item.id);
        setTimeout(
          () => setCopiedId((c) => (c === item.id ? null : c)),
          1200,
        );
      })
      .catch(() => {});
  }

  function onRemove(item: Item) {
    if (item.kind === "saved") deleteSplit(item.id);
    else hideTemplate(item.id);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-lg">Start from a split</h2>
        {hiddenTemplateIds.length > 0 && (
          <button
            onClick={restoreTemplates}
            className="text-xs font-semibold text-ink-subtle underline-offset-2 hover:text-ink-muted hover:underline"
          >
            Restore defaults
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="surface p-4 text-center text-sm text-ink-subtle">
          No splits here. Build a split above and hit{" "}
          <span className="font-semibold text-ink-muted">Save</span> to reuse it.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={`${item.kind}-${item.id}`}
              className="surface flex flex-col gap-2 p-2.5"
            >
              <MiniSplitBar slices={item.slices} />
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold text-ink">
                      {item.name}
                    </span>
                    {item.kind === "saved" && (
                      <span className="chip shrink-0 text-[10px] uppercase tracking-wide">
                        Saved
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-ink-subtle">
                    {item.kind === "builtin"
                      ? item.tagline
                      : slicesToText(item.slices)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <IconButton
                    label={`Load ${item.name} into the editor`}
                    onClick={() => onLoad(item)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    label={
                      copiedId === item.id
                        ? `${item.name} copied`
                        : `Copy ${item.name} as text`
                    }
                    onClick={() => onCopy(item)}
                  >
                    {copiedId === item.id ? <CheckIcon /> : <CopyIcon />}
                  </IconButton>
                  <IconButton
                    label={
                      item.kind === "saved"
                        ? `Delete ${item.name}`
                        : `Hide ${item.name}`
                    }
                    onClick={() => onRemove(item)}
                    danger
                  >
                    <TrashIcon />
                  </IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
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
