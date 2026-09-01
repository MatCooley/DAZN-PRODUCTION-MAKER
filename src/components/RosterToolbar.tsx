import { statusColor } from '../lib/visuals';

export function RosterToolbar({
  coveragePct,
  breachCount,
  warningCount,
  onReset,
}: {
  coveragePct: number;
  breachCount: number;
  warningCount: number;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--panel)]/60 px-4 py-2">
      <div className="flex items-center gap-2.5">
        <span className="font-display text-[13px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
          Roster
        </span>
        <div className="hidden items-center gap-3 border-l border-[var(--line)] pl-3 font-mono text-[10px] text-[var(--text-muted)] md:flex">
          <Legend color={statusColor.ok} label="Compliant" />
          <Legend color={statusColor.warning} label="Warning" />
          <Legend color={statusColor.breach} label="Breach" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Stat label="Coverage" value={`${coveragePct}%`} color={coveragePct === 100 ? statusColor.ok : statusColor.warning} />
        <Stat label="Breaches" value={String(breachCount)} color={breachCount > 0 ? statusColor.breach : 'var(--text-muted)'} />
        <Stat label="Warnings" value={String(warningCount)} color={warningCount > 0 ? statusColor.warning : 'var(--text-muted)'} />
        <button
          onClick={onReset}
          className="rounded-md border border-[var(--line)] px-2.5 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)] transition hover:border-[var(--tally)]/60 hover:text-[var(--text-primary)]"
        >
          Reset roster
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-right leading-none">
      <span className="font-mono text-[13px] font-semibold" style={{ color }}>
        {value}
      </span>
      <span className="ml-1.5 font-mono text-[9px] uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
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
