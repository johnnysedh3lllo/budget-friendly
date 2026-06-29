"use client";

import { useEffect, useRef, useState } from "react";
import {
  useBudget,
  selectUnallocated,
  selectAllocated,
  parseBucketText,
} from "@/lib/store";
import { partitionColor, PALETTE_SIZE } from "@/lib/colors";
import { formatPercent, roundPercent, currencyOf } from "@/lib/format";

/** Pick the label ink per palette colour from its OKLCH lightness. */
function usePaletteInk(): string[] {
  const theme = useBudget((s) => s.theme);
  const [inks, setInks] = useState<string[]>(() => Array(8).fill("#ffffff"));
  useEffect(() => {
    // Mono-inverse's grey ramp reads best with plain black labels throughout.
    if (theme === "mono-inverse") {
      setInks(Array(PALETTE_SIZE).fill("oklch(0.2 0 0)"));
      return;
    }
    const cs = getComputedStyle(document.documentElement);
    const out: string[] = [];
    for (let i = 1; i <= PALETTE_SIZE; i++) {
      const v = cs.getPropertyValue(`--p${i}`).trim();
      const m = v.match(/oklch\(\s*([\d.]+%?)/i);
      let L = 0.6;
      if (m) {
        L = parseFloat(m[1]);
        if (m[1].includes("%")) L /= 100;
      }
      out.push(L > 0.65 ? "oklch(0.2 0 0)" : "#ffffff");
    }
    setInks(out);
  }, [theme]);
  return inks;
}

export default function BucketBar() {
  const partitions = useBudget((s) => s.partitions);
  const setPercent = useBudget((s) => s.setPercent);
  const adjustPair = useBudget((s) => s.adjustPair);
  const addPartition = useBudget((s) => s.addPartition);
  const lastAddedId = useBudget((s) => s.lastAddedId);
  const clearLastAdded = useBudget((s) => s.clearLastAdded);
  const selectedId = useBudget((s) => s.selectedId);
  const setSelected = useBudget((s) => s.setSelected);

  const inks = usePaletteInk();
  const barRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<number | null>(null);
  // Which knob is actively held — keeps its grip enlarged for the whole drag.
  const [activeKnob, setActiveKnob] = useState<number | null>(null);

  const unallocated = selectUnallocated(partitions);
  const allocated = selectAllocated(partitions);

  // Drop the selection if its bucket no longer exists (e.g. after a template).
  useEffect(() => {
    if (selectedId && !partitions.some((p) => p.id === selectedId)) {
      setSelected(null);
    }
  }, [partitions, selectedId, setSelected]);

  let acc = 0;
  const segs = partitions.map((p) => {
    const start = acc;
    acc += p.percent;
    return { ...p, start, end: acc };
  });

  function pctFromEvent(clientX: number): number {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return ((clientX - rect.left) / rect.width) * 100;
  }

  function onHandleDown(e: React.PointerEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = index;
    setActiveKnob(index);
    (e.target as Element).setPointerCapture(e.pointerId);
  }
  function onHandleMove(e: React.PointerEvent) {
    const index = draggingRef.current;
    if (index == null) return;
    const start = partitions
      .slice(0, index)
      .reduce((t, p) => t + p.percent, 0);
    const target = pctFromEvent(e.clientX) - start;
    if (index < partitions.length - 1) {
      // boundary between two buckets → trade between them
      adjustPair(index, target);
    } else {
      // last bucket's edge → grow/shrink into the unallocated space
      setPercent(partitions[index].id, target);
    }
  }
  function onHandleUp(e: React.PointerEvent) {
    draggingRef.current = null;
    setActiveKnob(null);
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {}
  }
  function onHandleKey(e: React.KeyboardEvent, index: number) {
    const p = partitions[index];
    // Shift = coarse (5), Alt = fine (0.1), otherwise 1.
    const step = e.shiftKey ? 5 : e.altKey ? 0.1 : 1;
    let dir = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") dir = 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") dir = -1;
    if (!dir) return;
    e.preventDefault();
    if (index < partitions.length - 1) {
      adjustPair(index, p.percent + dir * step);
    } else {
      setPercent(p.id, p.percent + dir * step);
    }
  }

  const dragging = draggingRef.current != null;

  return (
    <div className="flex flex-col gap-3">
      {/* Editor form on top */}
      <BucketForm
        selectedId={selectedId}
        onAdd={addPartition}
        autoFocus={lastAddedId != null && lastAddedId === selectedId}
        onAutoFocused={clearLastAdded}
      />

      {/* The split bar below */}
      <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-ink-muted">
          How your 100% is split
        </span>
        <span className="num text-sm font-semibold text-ink-muted">
          {roundPercent(allocated)}
          <span className="text-ink-subtle">/100</span>
        </span>
      </div>

      <div
        ref={barRef}
        className="relative overflow-hidden"
        style={{
          borderRadius: "var(--radius-md)",
          // Border lives on the clipping element so segments are clipped inside
          // it and can't leak past the rounded corners.
          border: "var(--border-width) solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <div className="flex h-16 w-full p-0">
          {segs.map((p, i) => {
            const r = "var(--radius-md)";
            const isFirst = i === 0;
            const isLast = i === segs.length - 1 && unallocated <= 0;
            return (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              aria-label={`Edit ${p.name || "bucket"}, ${formatPercent(p.percent)}`}
              className="flex h-full min-w-0 items-center overflow-hidden text-left"
              style={{
                width: `${p.percent}%`,
                background: partitionColor(p.colorIndex),
                transition: dragging ? "none" : "width 160ms var(--ease)",
                outline:
                  selectedId === p.id ? "2px solid var(--ink)" : "none",
                outlineOffset: "-2px",
                borderTopLeftRadius: isFirst ? r : 0,
                borderBottomLeftRadius: isFirst ? r : 0,
                borderTopRightRadius: isLast ? r : 0,
                borderBottomRightRadius: isLast ? r : 0,
              }}
            >
              {p.percent >= 7 && (
                <span
                  className="num truncate px-2.5 text-xs font-bold sm:text-sm lg:text-base"
                  style={{ color: inks[p.colorIndex] }}
                >
                  {p.percent >= 12 && p.name ? `${p.name} · ` : ""}
                  {formatPercent(p.percent)}
                </span>
              )}
            </button>
            );
          })}

          {unallocated > 0 && (
            <button
              type="button"
              onClick={() => addPartition()}
              aria-label="Add a bucket using the unallocated space"
              title="Add a bucket"
              className="bf-hatch group flex h-full cursor-pointer items-center justify-center hover:brightness-95"
              style={{
                width: `${unallocated}%`,
                transition: dragging ? "none" : "width 160ms var(--ease)",
                borderTopRightRadius: "var(--radius-md)",
                borderBottomRightRadius: "var(--radius-md)",
                borderTopLeftRadius: segs.length === 0 ? "var(--radius-md)" : 0,
                borderBottomLeftRadius: segs.length === 0 ? "var(--radius-md)" : 0,
              }}
            >
              {partitions.length === 0 ? (
                <span className="px-2 text-center text-xs font-semibold text-ink-muted">
                  No buckets yet — tap to add one
                </span>
              ) : unallocated >= 12 ? (
                <span className="num truncate px-2 text-xs font-bold text-ink-muted">
                  + Add bucket
                </span>
              ) : unallocated >= 5 ? (
                <span className="text-sm font-bold text-ink-muted">+</span>
              ) : null}
            </button>
          )}
        </div>

        {/* Knobs: a thin full-height divider sitting on each boundary seam, so
            it reads as part of the bar (not a floating pill) and stays compact
            even when buckets are small. Each resizes the bucket on its left. */}
        <div className="pointer-events-none absolute inset-0">
          {segs.map((p, i) => (
            <div
              key={p.id}
              role="slider"
              tabIndex={0}
              aria-label={`Resize ${p.name || "bucket"}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={roundPercent(p.percent)}
              aria-valuetext={formatPercent(p.percent)}
              onPointerDown={(e) => onHandleDown(e, i)}
              onPointerMove={onHandleMove}
              onPointerUp={onHandleUp}
              onKeyDown={(e) => onHandleKey(e, i)}
              data-active={activeKnob === i ? "true" : undefined}
              className="bf-knob pointer-events-auto absolute top-0 h-full w-3.5 -translate-x-1/2 cursor-ew-resize touch-none focus-visible:outline-none"
              style={{ left: `${p.end}%` }}
            >
              <span className="bf-knob-line" />
            </div>
          ))}
        </div>

      </div>
      </div>
    </div>
  );
}

function BucketForm({
  selectedId,
  onAdd,
  autoFocus,
  onAutoFocused,
}: {
  selectedId: string | null;
  onAdd: () => void;
  autoFocus: boolean;
  onAutoFocused: () => void;
}) {
  const partitions = useBudget((s) => s.partitions);
  const amount = useBudget((s) => s.amount);
  const currency = useBudget((s) => s.currency);
  const renamePartition = useBudget((s) => s.renamePartition);
  const recolorPartition = useBudget((s) => s.recolorPartition);
  const removePartition = useBudget((s) => s.removePartition);
  const setPercent = useBudget((s) => s.setPercent);
  const setPartitionAmount = useBudget((s) => s.setPartitionAmount);
  const addFromText = useBudget((s) => s.addPartitionsFromText);
  const setSelected = useBudget((s) => s.setSelected);
  const nameRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLInputElement>(null);

  // "single" edits/adds one bucket; "list" pastes several as text at once.
  const [mode, setMode] = useState<"single" | "list">("single");
  const [text, setText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const isList = mode === "list";

  const p = partitions.find((x) => x.id === selectedId) ?? null;
  // The edit controls below apply to a single selected bucket only.
  const disabled = !p || isList;
  // No room left → can't carve out a new bucket.
  const full = selectUnallocated(partitions) <= 0;

  useEffect(() => {
    if (autoFocus && p && nameRef.current) {
      nameRef.current.focus();
      nameRef.current.select();
      onAutoFocused();
    }
  }, [autoFocus, p, onAutoFocused]);

  const sliceAmount = p ? amount * (p.percent / 100) : 0;

  function enterListMode() {
    setSelected(null); // so the edit row below disables, as when nothing's picked
    setNote(null);
    setMode("list");
    requestAnimationFrame(() => listRef.current?.focus());
  }

  function submitList() {
    const parsed = parseBucketText(text);
    if (parsed.length === 0) return;
    const room = selectUnallocated(partitions);
    const requested = parsed.reduce((t, x) => t + x.percent, 0);
    addFromText(text);
    setText("");
    const count = parsed.length;
    const noun = count === 1 ? "bucket" : "buckets";
    setNote(
      requested > room
        ? `Added ${count} ${noun} — trimmed to fit the ${room}% you had left.`
        : `Added ${count} ${noun}.`,
    );
    listRef.current?.focus();
  }

  return (
    <div className="surface flex flex-col gap-3 p-3">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        {isList ? (
          <input
            ref={listRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitList();
              }
            }}
            placeholder="Name then %, comma-separated — e.g. Rent 35, School 20"
            aria-label="Add several buckets from a list"
            className="min-h-6 min-w-[9rem] flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-subtle"
          />
        ) : p ? (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <span
                aria-hidden
                className="size-4 shrink-0 rounded-full"
                style={{ background: partitionColor(p.colorIndex) }}
              />
              <input
                ref={nameRef}
                value={p.name}
                onChange={(e) => renamePartition(p.id, e.target.value)}
                placeholder="Name this bucket"
                maxLength={28}
                className="min-w-0 flex-1 bg-transparent text-base font-semibold text-ink outline-none placeholder:text-ink-subtle"
              />
            </div>
            <BucketAmountField
              value={sliceAmount}
              currency={currency}
              disabled={amount <= 0}
              onChange={(v) => setPartitionAmount(p.id, v)}
            />
          </>
        ) : (
          <span className="flex min-h-6 min-w-[9rem] flex-1 items-center text-base text-ink-subtle">
            Click a block on the bar to edit it — or add a new bucket.
          </span>
        )}

        <button
          type="button"
          onClick={() => (isList ? setMode("single") : enterListMode())}
          aria-pressed={isList}
          title={
            isList ? "Back to adding one bucket" : "Add several buckets from a list"
          }
          className="btn btn-ghost shrink-0 gap-1.5 text-sm"
          style={
            isList
              ? {
                  background: "var(--surface-2)",
                  outline: "1px solid var(--border)",
                }
              : undefined
          }
        >
          <ListIcon />
          List
        </button>

        <button
          onClick={isList ? submitList : onAdd}
          disabled={full || (isList && !text.trim())}
          title={
            full ? "You've allocated 100% — lower a bucket to make room" : undefined
          }
          className="btn btn-primary w-full shrink-0 text-sm sm:w-auto"
        >
          {isList ? "+ Add buckets" : "+ Add bucket"}
        </button>
      </div>

      <div className="flex flex-col items-start gap-3 border-t pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Colour">
          {Array.from({ length: PALETTE_SIZE }).map((_, i) => (
            <button
              key={i}
              aria-label={`Colour ${i + 1}`}
              aria-pressed={p ? i === p.colorIndex : false}
              disabled={disabled}
              onClick={() => p && recolorPartition(p.id, i)}
              className="size-6 rounded-full disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: partitionColor(i),
                outline:
                  p && i === p.colorIndex
                    ? "2px solid var(--ink)"
                    : "1px solid var(--border)",
                outlineOffset: "2px",
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <PercentField
            percent={p ? p.percent : null}
            disabled={disabled}
            onChange={(v) => p && setPercent(p.id, v)}
          />
          <span className="num text-sm text-ink-muted">%</span>
          <button
            onClick={() => p && removePartition(p.id)}
            disabled={disabled}
            aria-label={p ? `Remove ${p.name}` : "Remove bucket"}
            className="btn btn-ghost !px-2 !py-2"
            title="Remove bucket"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {isList && note && (
        <p className="text-xs text-ink-subtle">{note}</p>
      )}
    </div>
  );
}

// Editable percent. Shows the value rounded for reading, but while focused it
// holds a free-text draft so typing "12.345" isn't snapped back mid-keystroke
// by the rounded display. Commits the raw number on each change.
function PercentField({
  percent,
  disabled,
  onChange,
}: {
  percent: number | null;
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  const rounded = percent == null ? "" : String(roundPercent(percent));
  const shown = focused ? draft : rounded;

  return (
    <input
      type="text"
      inputMode="decimal"
      value={shown}
      disabled={disabled}
      onFocus={() => {
        setFocused(true);
        setDraft(rounded);
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9.]/g, "");
        setDraft(raw);
        const v = parseFloat(raw);
        onChange(Number.isNaN(v) ? 0 : v);
      }}
      aria-label="Percent"
      className="field num w-16 px-2 py-1 text-right text-sm font-semibold text-ink disabled:opacity-50"
    />
  );
}

// Editable currency figure for a bucket — type "50000" and the percent is
// back-derived so the amount lands exactly. Same focus/draft trick as above so
// the recomputed value doesn't overwrite what's being typed.
function BucketAmountField({
  value,
  currency,
  disabled,
  onChange,
}: {
  value: number;
  currency: string;
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  const decimals = currencyOf(currency).decimals ?? 2;
  const symbol = currencyOf(currency).symbol;
  const formatted = value.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  });
  const shown = focused ? draft : formatted;

  return (
    <div className="field flex shrink-0 items-center gap-1 px-2 py-1">
      <span aria-hidden className="num text-sm text-ink-muted">
        {symbol}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={shown}
        disabled={disabled}
        onFocus={() => {
          setFocused(true);
          // Seed the draft with the un-grouped number so it's easy to edit.
          setDraft(value ? String(Number(value.toFixed(decimals))) : "");
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9.]/g, "");
          setDraft(raw);
          const v = parseFloat(raw);
          onChange(Number.isNaN(v) ? 0 : v);
        }}
        aria-label="Amount for this bucket"
        className="num w-28 bg-transparent text-right text-sm font-semibold text-ink outline-none disabled:opacity-50"
      />
    </div>
  );
}

function ListIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
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
