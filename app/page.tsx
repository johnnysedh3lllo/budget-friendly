import ThemeSwitcher from "@/components/ThemeSwitcher";
import Calculator from "@/components/Calculator";

export default function Home() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg text-ink">
      {/* App toolbar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Logo />
          <span className="hidden truncate text-base font-bold leading-tight text-ink sm:inline">
            Budget Friendly
          </span>
        </div>
        <ThemeSwitcher />
      </header>

      {/* Workspace */}
      <main className="flex min-h-0 flex-1">
        <Calculator />
      </main>
    </div>
  );
}

function Logo() {
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
      style={{ background: "var(--primary)", color: "var(--primary-ink)" }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        {/* Aperture: a ring of arcs — one whole, divided into parts. */}
        <circle
          cx="12"
          cy="12"
          r="8"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeDasharray="13.75 3"
          transform="rotate(-90 12 12)"
        />
      </svg>
    </span>
  );
}
