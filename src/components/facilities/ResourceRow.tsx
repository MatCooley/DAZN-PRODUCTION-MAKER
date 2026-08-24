import type { FacilityEvent, Resource } from '../../lib/facilityTypes';
import { PX_PER_HOUR, ROW_HEIGHT } from '../../lib/facilityVisuals';
import { DAY_WIDTH, WEEK_WIDTH } from './TimeRuler';
import { EventBlock } from './EventBlock';

export function ResourceRow({
  resource,
  events,
  conflictIds,
  weekStartMs,
  checkValid,
  onDrop,
  onClickEvent,
}: {
  resource: Resource;
  events: FacilityEvent[];
  conflictIds: Set<string>;
  weekStartMs: number;
  checkValid: (event: FacilityEvent, start: Date, end: Date) => boolean;
  onDrop: (id: string, start: Date, end: Date, valid: boolean) => void;
  onClickEvent: (event: FacilityEvent) => void;
}) {
  function pxFor(iso: string) {
    const hoursFromStart = (new Date(iso).getTime() - weekStartMs) / 3_600_000;
    return hoursFromStart * PX_PER_HOUR;
  }

  return (
    <div className="flex border-b border-[var(--line)]/70">
      <div
        className="sticky left-0 z-10 flex w-[200px] shrink-0 items-center border-r border-[var(--line)] bg-[var(--panel)] px-3"
        style={{ height: ROW_HEIGHT }}
      >
        <span className="truncate text-[12px] font-medium text-[var(--text-primary)]">{resource.name}</span>
      </div>
      <div className="relative shrink-0" style={{ width: WEEK_WIDTH, height: ROW_HEIGHT }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0 top-0 border-l border-[var(--line)]/40"
            style={{ left: i * DAY_WIDTH }}
          />
        ))}
        {events.map((ev) => (
          <EventBlock
            key={ev.id}
            event={ev}
            leftPx={pxFor(ev.start)}
            widthPx={pxFor(ev.end) - pxFor(ev.start)}
            hasConflict={conflictIds.has(ev.id)}
            checkValid={(start, end) => checkValid(ev, start, end)}
            onDrop={onDrop}
            onClick={onClickEvent}
          />
        ))}
      </div>
    </div>
  );
}
