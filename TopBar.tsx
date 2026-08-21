import { statusColor } from '../lib/visuals';

export type ViewMode = 'roster' | 'studios';

export function TopBar({
  view,
  onViewChange,
  coveragePct,
  breachCount,
  warningCount,
  onReset,
}: {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  coveragePct: number;
  breachCount: number;
  warningCount: number;
  onReset: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] bg-[var(--panel)] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--tally)]/15 font-mono text-[13px] font-bold text-[var(--tally)]">
          R
        </div>
        <div>
          <h1 className="font-display text-[17px] font-semibold uppercase leading-none tracking-wide text-[var(--text-primary)]">
            {view === 'roster' ? 'Roster // Week 34' : 'Studios // Week 34'}
          </h1>
          <p className="text-[11px] leading-tight text-[var(--text-muted)]">Mon 24 – Sun 30 Aug 2026 · Broadcast Ops</p>
        </div>

        <nav className="ml-3 flex items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--ink)] p-0.5">
          <TabButton active={view === 'roster'} onClick={() => onViewChange('roster')}>
            Roster
          </TabButton>
          <TabButton active={view === 'studios'} onClick={() => onViewChange('studios')}>
            Studios
          </TabButton>
        </nav>
      </div>

      <div className="flex items-center gap-5">
        {view === 'roster' && (
          <>
            <Stat label="Coverage" value={`${coveragePct}%`} color={coveragePct === 100 ? statusColor.ok : statusColor.warning} />
            <Stat label="Breaches" value={String(breachCount)} color={breachCount > 0 ? statusColor.breach : 'var(--text-muted)'} />
            <Stat label="Warnings" value={String(warningCount)} color={warningCount > 0 ? statusColor.warning : 'var(--text-muted)'} />

            <div className="hidden items-center gap-3 border-l border-[var(--line)] pl-5 font-mono text-[10px] text-[var(--text-muted)] md:flex">
              <Legend color={statusColor.ok} label="Compliant" />
              <Legend color={statusColor.warning} label="Warning" />
              <Legend color={statusColor.breach} label="Breach" />
            </div>

            <button
              onClick={onReset}
              className="rounded-md border border-[var(--line)] px-2.5 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)] transition hover:border-[var(--tally)]/60 hover:text-[var(--text-primary)]"
            >
              Reset roster
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-3 py-1 font-mono text-[10.5px] uppercase tracking-wide transition ${
        active ? 'bg-[var(--tally)]/15 text-[var(--tally)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-right">
      <div className="font-mono text-[15px] font-semibold leading-none" style={{ color }}>
        {value}
      </div>
      <div className="text-[9.5px] uppercase tracking-wide text-[var(--text-muted)]">{label}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
