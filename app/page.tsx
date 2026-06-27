import ThemeSwitcher from "@/components/ThemeSwitcher";
import Calculator from "@/components/Calculator";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <header className="mx-auto flex w-full max-w-5xl shrink-0 flex-col gap-3 px-3 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:pt-6">
        <div className="flex items-center gap-2.5">
          <Logo />
          <div>
            <p className="text-lg font-bold leading-none text-ink">
              Budget Friendly
            </p>
            <p className="text-xs text-ink-subtle">Split any amount, your way</p>
          </div>
        </div>
        <ThemeSwitcher />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-3 py-3 sm:px-4 sm:py-4 lg:min-h-0">
        <Calculator />
      </main>
    </div>
  );
}

function Logo() {
  return (
    <span
      aria-hidden
      className="flex size-9 items-center justify-center rounded-[var(--radius-md)]"
      style={{ background: "var(--primary)", color: "var(--primary-ink)" }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 3a9 9 0 0 1 9 9h-9z" fill="currentColor" opacity="0.55" />
        <path d="M12 12 12 3" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
  );
}
