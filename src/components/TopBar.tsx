import type { ReactNode } from 'react';
import daznMark from '../assets/dazn-mark.svg';

export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--panel)] px-4 py-3">
      <div className="flex items-center gap-2 rounded bg-white px-2 py-1.5">
        <img src={daznMark} alt="DAZN" className="h-6 w-auto" />
        <span className="font-display text-[10px] font-bold uppercase leading-none tracking-wide text-black">
          Production
          <br />
          Marker Aus
        </span>
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
