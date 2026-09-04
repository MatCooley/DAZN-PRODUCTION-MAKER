import { LayoutGrid, Table2, Undo2 } from 'lucide-react';
import { statusColor } from '../lib/visuals';

export type RosterViewMode = 'board' | 'table';

export function RosterToolbar({
  coveragePct,
  breachCount,
  warningCount,
  onReset,
  canUndo,
  undoLabel,
  onUndo,
  viewMode,
  onViewModeChange,
}: {
  coveragePct: number;
  breachCount: number;
  warningCount: number;
  onReset: () => void;
  canUndo: boolean;
  undoLabel?: string;
  onUndo: () => void;
  viewMode: RosterViewMode;
  onViewModeChange: (mode: RosterViewMode) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--panel)]/60 px-4 py-2">
      <div className="flex items-center gap-2.5">
        <span className="font-display text-[13px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
          Roster
        </span>
        <div className="flex items-center gap-0.5 rounded-md border border-[var(--line)] bg-[var(--ink)] p-0.5">
          <ViewModeButton mode="board" active={viewMode === 'board'} label="Board" Icon={LayoutGrid} onClick={onViewModeChange} />
          <ViewModeButton mode="table" active={viewMode === 'table'} label="Table" Icon={Table2} onClick={onViewModeChange} />
        </div>
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
          onClick={onUndo}
          disabled={!canUndo}
          title={canUndo ? `Undo — ${undoLabel}` : 'Nothing to undo'}
          className="flex items-center gap-1 rounded-md border border-[var(--line)] px-2.5 py-1.5 font-mono text-[10.5px] text-[var(--text-muted)] transition hover:border-[var(--tally)]/60 hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[var(--line)] disabled:hover:text-[var(--text-muted)]"
        >
          <Undo2 size={12} />
          Undo
        </button>
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

function ViewModeButton({
  mode,
  active,
  label,
  Icon,
  onClick,
}: {
  mode: RosterViewMode;
  active: boolean;
  label: string;
  Icon: typeof LayoutGrid;
  onClick: (mode: RosterViewMode) => void;
}) {
  return (
    <button
      onClick={() => onClick(mode)}
      title={label}
      className={`flex items-center gap-1 rounded px-2 py-1 font-mono text-[10px] transition ${
        active ? 'bg-[var(--tally)]/15 text-[var(--tally)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
      }`}
    >
      <Icon size={12} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
