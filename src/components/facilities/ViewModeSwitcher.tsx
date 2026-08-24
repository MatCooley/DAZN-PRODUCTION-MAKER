import { Clock, CalendarDays, Calendar, CalendarRange, CalendarFold } from 'lucide-react';
import type { ViewMode } from '../../lib/dateRanges';

const modes: { mode: ViewMode; label: string; Icon: typeof CalendarDays }[] = [
  { mode: 'day', label: 'Day', Icon: Clock },
  { mode: 'week', label: 'Week', Icon: CalendarDays },
  { mode: 'month', label: 'Month', Icon: Calendar },
  { mode: 'quarter', label: 'Quarter', Icon: CalendarRange },
  { mode: 'year', label: 'Year', Icon: CalendarFold },
];

export function ViewModeSwitcher({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-[var(--line)] bg-[var(--ink)] p-0.5">
      {modes.map(({ mode: m, label, Icon }) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          title={label}
          className={`flex items-center gap-1 rounded px-2 py-1 font-mono text-[10px] transition ${
            mode === m ? 'bg-[var(--tally)]/15 text-[var(--tally)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Icon size={12} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
