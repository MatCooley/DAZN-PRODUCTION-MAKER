import type { DateBucket } from '../../lib/dateRanges';
import type { FacilityEvent, Resource } from '../../lib/facilityTypes';
import { overlaps } from '../../lib/facilityLogic';
import { statusColor } from '../../lib/visuals';
import { studioColorFor } from '../../lib/facilityVisuals';

type CellStatus = 'conflict' | 'booked' | 'hold' | 'available' | 'empty';

function bucketStatus(
  resourceId: string,
  bucket: DateBucket,
  events: FacilityEvent[],
  conflictedIds: Set<string>
): { status: CellStatus; count: number; titles: string[] } {
  const onResource = events.filter(
    (e) => e.resourceId === resourceId && overlaps(new Date(e.start), new Date(e.end), bucket.start, bucket.end)
  );
  const blocking = onResource.filter((e) => e.isBlocking && e.status !== 'CANCELLED');
  const hasConflict = blocking.some((e) => conflictedIds.has(e.id));
  const hasHold = blocking.some((e) => e.eventType === 'HOLD');
  const hasBooking = blocking.some((e) => e.eventType === 'BOOKING');
  const hasAvailability = onResource.some(
    (e) => e.eventType === 'AVAILABILITY_WINDOW' && new Date(e.start) <= bucket.start && new Date(e.end) >= bucket.end
  );

  let status: CellStatus = 'empty';
  if (hasConflict) status = 'conflict';
  else if (hasBooking) status = 'booked';
  else if (hasHold) status = 'hold';
  else if (hasAvailability) status = 'available';

  return { status, count: blocking.length, titles: blocking.map((e) => e.title ?? e.eventType) };
}

const cellColor: Record<Exclude<CellStatus, 'booked'>, string> = {
  conflict: statusColor.breach,
  hold: '#8B98A5',
  available: statusColor.ok,
  empty: 'transparent',
};

export function DensityGrid({
  resources,
  buckets,
  events,
  conflictedIds,
  cellWidth,
  onCellClick,
}: {
  resources: Resource[];
  buckets: DateBucket[];
  events: FacilityEvent[];
  conflictedIds: Set<string>;
  cellWidth: number;
  onCellClick: (bucket: DateBucket) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="inline-block min-w-full">
        <div className="sticky top-0 z-20 flex bg-[var(--panel)]">
          <div className="sticky left-0 z-30 w-[200px] shrink-0 border-b border-r border-[var(--line)] bg-[var(--panel)]" />
          {buckets.map((b) => (
            <div
              key={b.key}
              className="shrink-0 border-b border-r border-[var(--line)]/40 px-1 py-1 text-center"
              style={{ width: cellWidth }}
            >
              {b.sublabel && cellWidth >= 24 && (
                <div className="truncate font-mono text-[8px] text-[var(--text-muted)]">{b.sublabel}</div>
              )}
              <div className="truncate font-display text-[10px] font-medium text-[var(--text-primary)]">{b.label}</div>
            </div>
          ))}
        </div>

        {resources.map((r) => (
          <div key={r.id} className="flex border-b border-[var(--line)]/70">
            <div
              className="sticky left-0 z-10 flex h-9 w-[200px] shrink-0 items-center gap-2 border-r border-[var(--line)] bg-[var(--panel)] pl-3 pr-3"
              style={{ borderLeft: `3px solid ${studioColorFor(r.code).border}` }}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: studioColorFor(r.code).border }} />
              <span className="truncate text-[11.5px] font-medium text-[var(--text-primary)]">{r.name}</span>
            </div>
            {buckets.map((b) => {
              const cell = bucketStatus(r.id, b, events, conflictedIds);
              const bookedColor = studioColorFor(r.code).fill;
              return (
                <button
                  key={b.key}
                  onClick={() => onCellClick(b)}
                  title={cell.titles.length ? cell.titles.join(', ') : undefined}
                  className="flex h-9 shrink-0 items-center justify-center border-r border-[var(--line)]/20 transition hover:brightness-125"
                  style={{ width: cellWidth }}
                >
                  {cell.status !== 'empty' && (
                    <span
                      className="block rounded-sm"
                      style={{
                        width: Math.max(cellWidth - 4, 4),
                        height: 18,
                        backgroundColor:
                          cell.status === 'available' ? 'transparent' : cell.status === 'booked' ? bookedColor : cellColor[cell.status],
                        border: cell.status === 'available' ? `1px dashed ${cellColor.available}` : 'none',
                        opacity: cell.status === 'hold' ? 0.7 : 1,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
