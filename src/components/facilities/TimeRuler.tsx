import { PX_PER_HOUR } from '../../lib/facilityVisuals';

const DAY_WIDTH = 24 * PX_PER_HOUR;
const TICK_HOURS = [6, 12, 18]; // hour 0 omitted — redundant with the date label and was overlapping it

export function TimeRuler({ days }: { days: { date: string; label: string }[] }) {
  return (
    <div className="flex h-9 border-b border-[var(--line)]">
      {days.map((day) => (
        <div
          key={day.date}
          className="relative shrink-0 border-r border-[var(--line)]"
          style={{ width: DAY_WIDTH }}
        >
          <div className="absolute left-1.5 top-0.5 font-display text-[11px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
            {day.label} <span className="font-mono text-[9px] font-normal text-[var(--text-muted)]">{day.date.slice(8)}</span>
          </div>
          {TICK_HOURS.map((h) => (
            <div
              key={h}
              className="absolute bottom-0 top-4 border-l border-[var(--line)]/60"
              style={{ left: h * PX_PER_HOUR }}
            >
              <span className="absolute top-[2px] left-1 font-mono text-[8.5px] text-[var(--text-muted)]">
                {String(h).padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export const WEEK_WIDTH = 7 * DAY_WIDTH;
export { DAY_WIDTH };
