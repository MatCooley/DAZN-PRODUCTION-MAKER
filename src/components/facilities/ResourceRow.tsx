import type { FacilityEvent, Resource } from '../../lib/facilityTypes';
import { ROW_HEIGHT, studioColorFor } from '../../lib/facilityVisuals';
import { EventBlock } from './EventBlock';

export function ResourceRow({
  resource,
  events,
  conflictIds,
  weekStartMs,
  pxPerHour,
  dayCount,
  checkValid,
  onDrop,
  onClickEvent,
}: {
  resource: Resource;
  events: FacilityEvent[];
  conflictIds: Set<string>;
  weekStartMs: number;
  pxPerHour: number;
  dayCount: number;
  checkValid: (event: FacilityEvent, start: Date, end: Date) => boolean;
  onDrop: (id: string, start: Date, end: Date, valid: boolean) => void;
  onClickEvent: (event: FacilityEvent, anchorRect: DOMRect) => void;
}) {
  const dayWidth = 24 * pxPerHour;
  const trackWidth = dayCount * dayWidth;
  const bookingColor = studioColorFor(resource.code);

  function pxFor(iso: string) {
    const hoursFromStart = (new Date(iso).getTime() - weekStartMs) / 3_600_000;
    return hoursFromStart * pxPerHour;
  }

  return (
    <div className="flex border-b border-[var(--line)]/70">
      <div
        className="sticky left-0 z-10 flex w-[200px] shrink-0 items-center gap-2 border-r border-[var(--line)] pl-3 pr-3"
        style={{
          height: ROW_HEIGHT,
          borderLeft: `4px solid ${bookingColor.border}`,
          backgroundColor: `${bookingColor.border}1f`,
        }}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: bookingColor.border }} />
        <span className="truncate text-[12px] font-semibold text-white">
          {resource.name}
        </span>
      </div>
      <div className="relative shrink-0" style={{ width: trackWidth, height: ROW_HEIGHT }}>
        {Array.from({ length: dayCount }).map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0 top-0 border-l border-[var(--line)]/40"
            style={{ left: i * dayWidth }}
          />
        ))}
        {events.map((ev) => (
          <EventBlock
            key={ev.id}
            event={ev}
            leftPx={pxFor(ev.start)}
            widthPx={pxFor(ev.end) - pxFor(ev.start)}
            hasConflict={conflictIds.has(ev.id)}
            pxPerHour={pxPerHour}
            bookingColor={bookingColor}
            checkValid={(start, end) => checkValid(ev, start, end)}
            onDrop={onDrop}
            onClick={onClickEvent}
          />
        ))}
      </div>
    </div>
  );
}
