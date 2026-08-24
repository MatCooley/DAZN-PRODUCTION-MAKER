import { ZoomIn } from 'lucide-react';

// How many hours apart the tick marks are, scaled to how much room each
// hour actually has — Day view (up to 90px/hour) gets a mark every 2
// hours including midnight; a cramped Week view falls back to sparse
// 6/12-hour marks so labels don't collide.
function tickIntervalFor(pxPerHour: number): number {
  if (pxPerHour >= 45) return 2;
  if (pxPerHour >= 25) return 3;
  if (pxPerHour >= 8) return 6;
  return 12;
}

export function TimeRuler({
  days,
  pxPerHour,
  onDayClick,
}: {
  days: { date: string; label: string }[];
  pxPerHour: number;
  onDayClick?: (date: string) => void;
}) {
  const dayWidth = 24 * pxPerHour;
  const interval = tickIntervalFor(pxPerHour);
  const tickHours = Array.from({ length: 24 / interval }, (_, i) => i * interval); // always includes 0 = 12am
  const clickable = !!onDayClick && days.length > 1; // no point jumping to Day view from Day view itself

  return (
    <div className="flex h-9 border-b border-[var(--line)]">
      {days.map((day) => (
        <div
          key={day.date}
          className="relative shrink-0 border-r border-[var(--line)]"
          style={{ width: dayWidth }}
        >
          {clickable ? (
            <button
              type="button"
              onClick={() => onDayClick!(day.date)}
              title={`Open ${day.label} ${day.date.slice(8)} in Day view`}
              className="group absolute left-0 top-0 flex h-4 items-center gap-1 rounded-sm px-1.5 transition hover:bg-[var(--tally)]/15"
            >
              <span className="font-display text-[11px] font-semibold uppercase tracking-wide text-[var(--text-primary)] group-hover:text-[var(--tally)]">
                {day.label} <span className="font-mono text-[9px] font-normal text-[var(--text-muted)]">{day.date.slice(8)}</span>
              </span>
              <ZoomIn size={9} className="text-[var(--tally)] opacity-0 transition group-hover:opacity-100" />
            </button>
          ) : (
            <div className="absolute left-1.5 top-0.5 font-display text-[11px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
              {day.label} <span className="font-mono text-[9px] font-normal text-[var(--text-muted)]">{day.date.slice(8)}</span>
            </div>
          )}
          {tickHours.map((h) => (
            <div
              key={h}
              className="absolute bottom-0 top-4 border-l border-[var(--line)]/60"
              style={{ left: h * pxPerHour }}
            >
              {pxPerHour >= 8 && (
                <span className="absolute top-[2px] left-1 font-mono text-[8.5px] text-[var(--text-muted)]">
                  {String(h).padStart(2, '0')}
                  {pxPerHour >= 25 ? ':00' : ''}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
