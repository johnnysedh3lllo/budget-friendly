"use client";

import { useEffect, useRef, useState } from "react";

export type SelectOption = { value: string; label: string; hint?: string };

export default function Select({
  value,
  options,
  onChange,
  placeholder,
  ariaLabel,
  className,
  menuClassName,
}: {
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel: string;
  /** wrapper sizing, e.g. "w-full" or "shrink-0" */
  className?: string;
  /** menu position/width, e.g. "left-0 right-0" or "right-0 w-44" */
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sel = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="field flex w-full cursor-pointer items-center justify-between gap-2 py-2 pl-3 pr-2 text-sm font-semibold text-ink"
      >
        <span className="truncate">
          {sel ? (
            sel.label
          ) : (
            <span className="text-ink-subtle">{placeholder}</span>
          )}
        </span>
        <Chevron open={open} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={`bf-scroll surface-raised absolute z-30 mt-2 flex max-h-[min(12.5rem,55vh)] flex-col gap-0.5 overflow-y-auto p-1.5 ${
            menuClassName ?? "left-0 right-0"
          }`}
          style={{ borderRadius: "var(--radius-md)" }}
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
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
          })}
        </div>
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
