"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { scrollActiveIntoView } from "@/lib/scroll";

// useLayoutEffect on the client, useEffect on the server (avoids the SSR warning
// while still positioning the menu before paint).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
  /** Extra terms to match on when searching (e.g. country names). */
  keywords?: string[];
};

/** Rank an option against a query; -1 means no match, higher = closer. */
function score(o: SelectOption, q: string): number {
  const code = o.value.toLowerCase();
  const label = o.label.toLowerCase();
  const hint = (o.hint ?? "").toLowerCase();
  const kws = (o.keywords ?? []).map((k) => k.toLowerCase());
  if (code === q) return 100;
  if (code.startsWith(q)) return 92;
  if (hint.startsWith(q) || label.startsWith(q)) return 84;
  if (kws.some((k) => k.startsWith(q))) return 76;
  if (hint.includes(q) || label.includes(q)) return 50;
  if (kws.some((k) => k.includes(q))) return 42;
  if (code.includes(q)) return 40;
  return -1;
}

export default function Select({
  value,
  options,
  onChange,
  placeholder,
  ariaLabel,
  className,
  menuWidth,
  searchable = false,
  triggerClassName,
  triggerChildren,
}: {
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel: string;
  /** wrapper sizing, e.g. "w-full" or "shrink-0" */
  className?: string;
  /** Fixed menu width in px; defaults to matching the trigger's width. */
  menuWidth?: number;
  /** Show a search field that filters/ranks options by closest match. */
  searchable?: boolean;
  /** Override the trigger's classes (e.g. to render a compact icon button). */
  triggerClassName?: string;
  /** Replace the default label+chevron trigger content (e.g. an icon). */
  triggerChildren?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Fixed-position coords for the portaled menu (null while closed).
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const sel = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!searchable || !q) return options;
    return options
      .map((o, i) => ({ o, i, s: score(o, q) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .map((x) => x.o);
  }, [options, query, searchable]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    if (searchable) searchRef.current?.focus();
    // Open with the current selection already in view.
    requestAnimationFrame(() =>
      scrollActiveIntoView(listRef.current, activeRef.current),
    );
    const onDoc = (e: PointerEvent) => {
      const t = e.target as Node;
      // The menu lives in a portal (outside `ref`), so check it too.
      if (ref.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, searchable]);

  // Position the portaled menu under the trigger with fixed coords, right-aligned
  // to the trigger and clamped into the viewport (so it never spills off-screen,
  // regardless of any ancestor's overflow clipping). Recomputed on scroll/resize.
  useIsoLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const compute = () => {
      const trigger = ref.current;
      if (!trigger) return;
      const tr = trigger.getBoundingClientRect();
      const margin = 8;
      const vw = window.innerWidth;
      const width = Math.min(menuWidth ?? tr.width, vw - margin * 2);
      // Align the menu's right edge to the trigger's, then keep it on-screen.
      let left = tr.right - width;
      left = Math.max(margin, Math.min(left, vw - margin - width));
      setPos({ top: tr.bottom + 8, left, width });
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open, menuWidth]);

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={
          triggerClassName ??
          "field flex w-full cursor-pointer items-center justify-between gap-2 py-2 pl-3 pr-2 text-sm font-semibold text-ink"
        }
      >
        {triggerChildren ?? (
          <>
            <span className="truncate">
              {sel ? (
                sel.label
              ) : (
                <span className="text-ink-subtle">{placeholder}</span>
              )}
            </span>
            <Chevron open={open} />
          </>
        )}
      </button>

      {open &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
        <div
          ref={menuRef}
          className="surface-raised fixed z-50 flex flex-col overflow-hidden"
          style={{
            top: pos.top,
            left: pos.left,
            width: pos.width,
            borderRadius: "var(--radius-md)",
          }}
        >
          {searchable && (
            <div className="border-b p-1.5">
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  // Enter picks the closest match (top of the ranked list).
                  if (e.key === "Enter" && filtered.length > 0) {
                    e.preventDefault();
                    onChange(filtered[0].value);
                    setOpen(false);
                  }
                }}
                placeholder={value || "Search…"}
                aria-label={`Search ${ariaLabel}`}
                className="field w-full px-2.5 py-1.5 text-sm text-ink outline-none placeholder:text-ink-subtle"
              />
            </div>
          )}
          <div
            ref={listRef}
            role="listbox"
            aria-label={ariaLabel}
            className="bf-scroll flex max-h-[min(12.5rem,55vh)] flex-col gap-0.5 overflow-y-auto p-1.5"
          >
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-ink-subtle">
                No matches
              </p>
            ) : (
              filtered.map((o) => {
                const active = o.value === value;
                return (
                  <button
                    key={o.value}
                    ref={active ? activeRef : undefined}
                    type="button"
                    role="option"
                    aria-selected={active}
                    data-active={active}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 text-left transition-colors hover:bg-surface-2 data-[active=true]:bg-surface-2"
                    style={{ borderRadius: "var(--radius-sm)" }}
                  >
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="text-sm font-semibold text-ink">
                        {o.label}
                      </span>
                      {o.hint && (
                        <span className="truncate text-xs text-ink-subtle">
                          {o.hint}
                        </span>
                      )}
                    </span>
                    {active && <CheckIcon />}
                  </button>
                );
              })
            )}
          </div>
        </div>,
          document.body,
        )}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
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
      className="shrink-0 text-ink-muted"
      style={{
        transform: open ? "rotate(180deg)" : "none",
        transition: "transform var(--dur-fast) var(--ease)",
      }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--primary)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}
