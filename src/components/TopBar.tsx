import type { ReactNode } from 'react';

export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--panel)] px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--tally)]/15 font-mono text-[13px] font-bold text-[var(--tally)]">
        R
      </div>
      <div>
        <h1 className="font-display text-[17px] font-semibold uppercase leading-none tracking-wide text-[var(--text-primary)]">
          Broadcast Ops // Week 34
        </h1>
        <p className="text-[11px] leading-tight text-[var(--text-muted)]">Mon 24 – Sun 30 Aug 2026</p>
      </div>
      <div className="ml-auto">{children}</div>
    </header>
  );
}
