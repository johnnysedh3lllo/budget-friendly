"use client";

import { useEffect, useRef, useState } from "react";
import {
  useBudget,
  selectUnallocated,
  selectAllocated,
  parseSplitText,
} from "@/lib/store";
import { splitColor, PALETTE_SIZE } from "@/lib/colors";
import { formatPercent, roundPercent, currencyOf } from "@/lib/format";
import SaveBucket from "./SaveBucket";

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
  const splits = useBudget((s) => s.splits);
  const setPercent = useBudget((s) => s.setPercent);
  const adjustPair = useBudget((s) => s.adjustPair);
  const addSplit = useBudget((s) => s.addSplit);
  const lastAddedId = useBudget((s) => s.lastAddedId);
  const clearLastAdded = useBudget((s) => s.clearLastAdded);
  const selectedId = useBudget((s) => s.selectedId);
  const setSelected = useBudget((s) => s.setSelected);
  const activeBucketId = useBudget((s) => s.activeBucketId);
  const savedBuckets = useBudget((s) => s.savedBuckets);

  const inks = usePaletteInk();
  const barRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<number | null>(null);
  // Which knob is actively held — keeps its grip enlarged for the whole drag.
  const [activeKnob, setActiveKnob] = useState<number | null>(null);

  const unallocated = selectUnallocated(splits);
  const allocated = selectAllocated(splits);
  // The saved bucket currently loaded (if any) — shown so the user knows what
  // they're editing and won't overwrite it by surprise.
  const activeBucket = savedBuckets.find((b) => b.id === activeBucketId) ?? null;

  // Drop the selection if its split no longer exists (e.g. after a template).
  useEffect(() => {
    if (selectedId && !splits.some((p) => p.id === selectedId)) {
      setSelected(null);
    }
  }, [splits, selectedId, setSelected]);

  let acc = 0;
  const segs = splits.map((p) => {
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
    const start = splits
      .slice(0, index)
      .reduce((t, p) => t + p.percent, 0);
    const target = pctFromEvent(e.clientX) - start;
    if (index < splits.length - 1) {
      // boundary between two splits → trade between them
      adjustPair(index, target);
    } else {
      // last split's edge → grow/shrink into the unallocated space
      setPercent(splits[index].id, target);
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
    const p = splits[index];
    // Shift = coarse (5), Alt = fine (0.1), otherwise 1.
    const step = e.shiftKey ? 5 : e.altKey ? 0.1 : 1;
    let dir = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") dir = 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") dir = -1;
    if (!dir) return;
    e.preventDefault();
    if (index < splits.length - 1) {
      adjustPair(index, p.percent + dir * step);
    } else {
      setPercent(p.id, p.percent + dir * step);
    }
  }

  const dragging = draggingRef.current != null;

  return (
    <div className="flex flex-col gap-3">
      {/* Editor form on top */}
      <SplitForm
        selectedId={selectedId}
        onAdd={addSplit}
        autoFocus={lastAddedId != null && lastAddedId === selectedId}
        onAutoFocused={clearLastAdded}
      />

      {/* The split bar below */}
      <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-sm font-semibold text-ink-muted">
            How your 100% is split
          </span>
          {activeBucket && (
            <span
              className="flex min-w-0 items-center gap-1.5"
              title={`Editing saved bucket "${activeBucket.name}" — Save updates it`}
            >
              <span aria-hidden className="text-ink-subtle">
                ·
              </span>
              <span className="truncate text-sm font-semibold text-ink">
                {activeBucket.name}
              </span>
            </span>
          )}
          <SaveBucket />
        </div>
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
              aria-label={`Edit ${p.name || "split"}, ${formatPercent(p.percent)}`}
              className="flex h-full min-w-0 items-center overflow-hidden text-left"
              style={{
                width: `${p.percent}%`,
                background: splitColor(p.colorIndex),
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
              onClick={() => addSplit()}
              aria-label="Add a split using the unallocated space"
              title="Add a split"
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
              {splits.length === 0 ? (
                <span className="px-2 text-center text-xs font-semibold text-ink-muted">
                  No splits yet — tap to add one
                </span>
              ) : unallocated >= 12 ? (
                <span className="num truncate px-2 text-xs font-bold text-ink-muted">
                  + Add split
                </span>
              ) : unallocated >= 5 ? (
                <span className="text-sm font-bold text-ink-muted">+</span>
              ) : null}
            </button>
          )}
        </div>

        {/* Knobs: a thin full-height divider sitting on each boundary seam, so
            it reads as part of the bar (not a floating pill) and stays compact
            even when splits are small. Each resizes the split on its left. */}
        <div className="pointer-events-none absolute inset-0">
          {segs.map((p, i) => (
            <div
              key={p.id}
              role="slider"
              tabIndex={0}
              aria-label={`Resize ${p.name || "split"}`}
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

function SplitForm({
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
  const splits = useBudget((s) => s.splits);
  const amount = useBudget((s) => s.amount);
  const currency = useBudget((s) => s.currency);
  const renameSplit = useBudget((s) => s.renameSplit);
  const recolorSplit = useBudget((s) => s.recolorSplit);
  const removeSplit = useBudget((s) => s.removeSplit);
  const setPercent = useBudget((s) => s.setPercent);
  const setSplitAmount = useBudget((s) => s.setSplitAmount);
  const addFromText = useBudget((s) => s.addSplitsFromText);
  const setSelected = useBudget((s) => s.setSelected);
  const nameRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLInputElement>(null);

  // "single" edits/adds one split; "list" pastes several as text at once.
  const [mode, setMode] = useState<"single" | "list">("single");
  const [text, setText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const isList = mode === "list";

  const p = splits.find((x) => x.id === selectedId) ?? null;
  // The edit controls below apply to a single selected split only.
  const disabled = !p || isList;
  // No room left → can't carve out a new split.
  const full = selectUnallocated(splits) <= 0;

  useEffect(() => {
    if (autoFocus && p && nameRef.current) {
      nameRef.current.focus();
      nameRef.current.select();
      onAutoFocused();
    }
  }, [autoFocus, p, onAutoFocused]);

  const splitAmount = p ? amount * (p.percent / 100) : 0;

  function enterListMode() {
    setSelected(null); // so the edit row below disables, as when nothing's picked
    setNote(null);
    setMode("list");
    requestAnimationFrame(() => listRef.current?.focus());
  }

  function submitList() {
    const parsed = parseSplitText(text);
    if (parsed.length === 0) return;
    const room = selectUnallocated(splits);
    const requested = parsed.reduce((t, x) => t + x.percent, 0);
    addFromText(text);
    setText("");
    const count = parsed.length;
    const noun = count === 1 ? "split" : "splits";
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
            aria-label="Add several splits from a list"
            className="min-h-6 min-w-[9rem] flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-subtle"
          />
        ) : p ? (
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <span
              aria-hidden
              className="size-4 shrink-0 rounded-full"
              style={{ background: splitColor(p.colorIndex) }}
            />
            <input
              ref={nameRef}
              value={p.name}
              onChange={(e) => renameSplit(p.id, e.target.value)}
              placeholder="Name this split"
              maxLength={28}
              className="min-w-0 flex-1 bg-transparent text-base font-semibold text-ink outline-none placeholder:text-ink-subtle"
            />
          </div>
        ) : (
          <span className="flex min-h-6 min-w-[9rem] flex-1 items-center text-base text-ink-subtle">
            Click a block on the bar to edit it — or add a new split.
          </span>
        )}

        <button
          type="button"
          onClick={() => (isList ? setMode("single") : enterListMode())}
          aria-pressed={isList}
          aria-label={
            isList ? "Back to adding one split" : "Add several splits at once"
          }
          title={
            isList ? "Back to adding one split" : "Add several splits at once"
          }
          className="btn btn-ghost shrink-0 !px-2 !py-2"
          style={
            isList
              ? {
                  background: "var(--surface-2)",
                  outline: "1px solid var(--border)",
                }
              : undefined
          }
        >
          <MultiAddIcon />
        </button>

        <button
          onClick={isList ? submitList : onAdd}
          disabled={full || (isList && !text.trim())}
          title={
            full ? "You've allocated 100% — lower a split to make room" : undefined
          }
          className="btn btn-primary w-full shrink-0 text-sm sm:w-auto"
        >
          {isList ? "+ Add splits" : "+ Add split"}
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
              onClick={() => p && recolorSplit(p.id, i)}
              className="size-6 rounded-full disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: splitColor(i),
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
          <SplitAmountField
            value={splitAmount}
            currency={currency}
            disabled={disabled || amount <= 0}
            onChange={(v) => p && setSplitAmount(p.id, v)}
          />
          <PercentField
            percent={p ? p.percent : null}
            disabled={disabled}
            onChange={(v) => p && setPercent(p.id, v)}
          />
          <span className="num text-sm text-ink-muted">%</span>
          <button
            onClick={() => p && removeSplit(p.id)}
            disabled={disabled}
            aria-label={p ? `Remove ${p.name}` : "Remove split"}
            className="btn btn-ghost !px-2 !py-2"
            title="Remove split"
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

// Editable currency figure for a split — type "50000" and the percent is
// back-derived so the amount lands exactly. Same focus/draft trick as above so
// the recomputed value doesn't overwrite what's being typed.
function SplitAmountField({
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
    <div className="field flex w-full min-w-0 max-w-[9rem] items-center gap-1 px-2 py-1">
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
        aria-label="Amount for this split"
        className="num w-full min-w-0 bg-transparent text-right text-sm font-semibold text-ink outline-none disabled:opacity-50"
      />
    </div>
  );
}

// Rows + a plus — "type several splits at once" (single → multiple input).
function MultiAddIcon() {
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
      <path d="M3 6h13M3 12h13M3 18h7" />
      <path d="M17 14v6M14 17h6" />
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
