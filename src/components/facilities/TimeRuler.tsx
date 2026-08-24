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

export function TimeRuler({ days, pxPerHour }: { days: { date: string; label: string }[]; pxPerHour: number }) {
  const dayWidth = 24 * pxPerHour;
  const interval = tickIntervalFor(pxPerHour);
  const tickHours = Array.from({ length: 24 / interval }, (_, i) => i * interval); // always includes 0 = 12am

  return (
    <div className="flex h-9 border-b border-[var(--line)]">
      {days.map((day) => (
        <div
          key={day.date}
          className="relative shrink-0 border-r border-[var(--line)]"
          style={{ width: dayWidth }}
        >
          <div className="absolute left-1.5 top-0.5 font-display text-[11px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
            {day.label} <span className="font-mono text-[9px] font-normal text-[var(--text-muted)]">{day.date.slice(8)}</span>
          </div>
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
