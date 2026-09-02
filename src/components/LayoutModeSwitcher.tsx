import { PanelTop, PanelBottom, PanelsTopBottom } from 'lucide-react';
import type { SplitLayoutMode } from './SplitPane';

const modes: { mode: SplitLayoutMode; label: string; Icon: typeof PanelTop }[] = [
  { mode: 'top', label: 'Full Bookings', Icon: PanelTop },
  { mode: 'bottom', label: 'Full Roster', Icon: PanelBottom },
  { mode: 'split', label: 'Half / Half', Icon: PanelsTopBottom },
];

export function LayoutModeSwitcher({ mode, onChange }: { mode: SplitLayoutMode; onChange: (m: SplitLayoutMode) => void }) {
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
          <span className="hidden lg:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
