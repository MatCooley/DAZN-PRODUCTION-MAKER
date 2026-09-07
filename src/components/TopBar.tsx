import type { ReactNode } from 'react';
import daznMark from '../assets/dazn-mark.svg';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ISO-ish week-of-year for the "Week N" label — the Monday of week 1 is
// the Monday on/before Jan 1, so this stays stable across the whole year
// rather than resetting oddly at month boundaries.
function weekNumberOf(monday: Date): number {
  const jan1 = new Date(monday.getFullYear(), 0, 1);
  const jan1Monday = new Date(jan1);
  jan1Monday.setDate(jan1.getDate() - ((jan1.getDay() + 6) % 7));
  return Math.round((monday.getTime() - jan1Monday.getTime()) / (7 * 86_400_000)) + 1;
}

function formatRange(days: { date: string; label: string }[]): { weekLabel: string; rangeLabel: string } {
  if (days.length === 0) return { weekLabel: '', rangeLabel: '' };
  const start = new Date(`${days[0].date}T00:00:00`);
  const end = new Date(`${days[days.length - 1].date}T00:00:00`);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const startLabel = `${days[0].label} ${start.getDate()}`;
  const endLabel = sameMonth
    ? `${days[days.length - 1].label} ${end.getDate()}`
    : `${days[days.length - 1].label} ${end.getDate()} ${MONTH_NAMES[end.getMonth()]}`;
  const rangeLabel = `${startLabel} – ${endLabel} ${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`;
  return { weekLabel: `Week ${weekNumberOf(start)}`, rangeLabel };
}

export function TopBar({ days, children }: { days?: { date: string; label: string }[]; children?: ReactNode }) {
  const { weekLabel, rangeLabel } = formatRange(days ?? []);

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
          Broadcast Ops{weekLabel ? ` // ${weekLabel}` : ''}
        </h1>
        <p className="text-[11px] leading-tight text-[var(--text-muted)]">{rangeLabel}</p>
      </div>
      <div className="ml-auto">{children}</div>
    </header>
  );
}
