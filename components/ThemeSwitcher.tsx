"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES } from "@/lib/types";
import { useBudget } from "@/lib/store";

export default function ThemeSwitcher() {
  const theme = useBudget((s) => s.theme);
  const setTheme = useBudget((s) => s.setTheme);
  const cycleTheme = useBudget((s) => s.cycleTheme);
  const randomTheme = useBudget((s) => s.randomTheme);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const idx = THEMES.findIndex((t) => t.id === theme);
  const current = THEMES[idx] ?? THEMES[0];
  const next = THEMES[(idx + 1) % THEMES.length];

  useEffect(() => {
    if (!open) return;
    function onDoc(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
        {/* Split control: label cycles, arrow opens the menu */}
        <div
          className="inline-flex items-stretch overflow-hidden bg-surface text-sm font-semibold"
          style={{
            border: "var(--border-width) solid var(--border)",
            borderRadius: "var(--radius-pill)",
          }}
        >
          <button
            onClick={() => cycleTheme(1)}
            aria-label={`Theme: ${current.label}. Click to switch to ${next.label}.`}
            title={`${current.label} — ${current.blurb}. Click for ${next.label}.`}
            className="flex items-center gap-2 py-1.5 pl-3 pr-2.5 text-ink transition-colors hover:bg-surface-2"
          >
            <span
              aria-hidden
              className="inline-block size-3.5 rounded-full"
              style={{
                background: "var(--primary)",
                outline: "1px solid var(--border)",
              }}
            />
            {current.label}
          </button>

          <span
            aria-hidden
            style={{ width: "var(--border-width)", background: "var(--border)" }}
          />

          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Choose a theme"
            aria-haspopup="listbox"
            aria-expanded={open}
            className="flex items-center px-2 text-ink transition-colors hover:bg-surface-2"
          >
            <ChevronIcon open={open} />
          </button>

          <span
            aria-hidden
            style={{ width: "var(--border-width)", background: "var(--border)" }}
          />

          <button
            onClick={randomTheme}
            aria-label="Pick a random theme"
            title="Surprise me"
            className="flex items-center px-2 text-ink transition-colors hover:bg-surface-2"
          >
            <ShuffleIcon />
          </button>
        </div>

        {open && (
          <div
            role="listbox"
            aria-label="Themes"
            className="bf-scroll surface-raised absolute right-0 top-full z-30 mt-2 flex max-h-[min(15rem,60vh)] w-56 flex-col gap-0.5 overflow-y-auto p-1.5"
            style={{ borderRadius: "var(--radius-md)" }}
          >
            {THEMES.map((t) => {
              const active = t.id === theme;
              return (
                <button
                  key={t.id}
                  role="option"
                  aria-selected={active}
                  data-active={active}
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2.5 px-2 py-1.5 text-left transition-colors hover:bg-surface-2 data-[active=true]:bg-surface-2"
                  style={{ borderRadius: "var(--radius-sm)" }}
                >
                  <span
                    aria-hidden
                    data-theme={t.id}
                    className="inline-block size-4 shrink-0 rounded-full"
                    style={{
                      background: "var(--primary)",
                      outline: "1px solid var(--border)",
                    }}
                  />
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="text-sm font-semibold text-ink">
                      {t.label}
                    </span>
                    <span className="truncate text-xs text-ink-subtle">
                      {t.blurb}
                    </span>
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

function ChevronIcon({ open }: { open: boolean }) {
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
      style={{
        transform: open ? "rotate(90deg)" : "none",
        transition: "transform var(--dur-fast) var(--ease)",
      }}
    >
      <path d="m9 6 6 6-6 6" />
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

function ShuffleIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  );
}
