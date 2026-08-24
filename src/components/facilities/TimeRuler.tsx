import { PX_PER_HOUR } from '../../lib/facilityVisuals';

const DAY_WIDTH = 24 * PX_PER_HOUR;
const TICK_HOURS = [0, 6, 12, 18];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthYearLabel(days: { date: string }[]): string {
  const first = new Date(days[0].date + 'T00:00:00');
  const last = new Date(days[days.length - 1].date + 'T00:00:00');
  const fm = MONTH_NAMES[first.getMonth()];
  const lm = MONTH_NAMES[last.getMonth()];
  if (first.getFullYear() !== last.getFullYear()) {
    return `${fm} ${first.getFullYear()} – ${lm} ${last.getFullYear()}`;
  }
  if (fm !== lm) return `${fm} – ${lm} ${first.getFullYear()}`;
  return `${fm} ${first.getFullYear()}`;
}

export function TimeRuler({ days }: { days: { date: string; label: string }[] }) {
  return (
    <div>
      <div className="flex h-6 items-center border-b border-[var(--line)] bg-[var(--panel)] px-1.5">
        <span className="font-display text-[12px] font-semibold uppercase tracking-wide text-[var(--tally)]">
          {monthYearLabel(days)}
        </span>
      </div>
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
                <span className="absolute -top-3.5 left-1 font-mono text-[8.5px] text-[var(--text-muted)]">
                  {String(h).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export const WEEK_WIDTH = 7 * DAY_WIDTH;
export { DAY_WIDTH };
