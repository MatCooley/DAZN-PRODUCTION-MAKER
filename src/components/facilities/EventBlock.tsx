import { useRef, useState } from 'react';
import { Link2, Repeat, Users, MoveRight } from 'lucide-react';
import type { FacilityEvent } from '../../lib/facilityTypes';
import { toLocalDateString } from '../../lib/dateUtils';
import { SNAP_HOURS, conflictStyle, facilityEventStyle } from '../../lib/facilityVisuals';
import { showIconFor } from '../../lib/showIcons';
import { Hovercard, type HovercardRow } from '../Hovercard';
import { formatHM } from '../../lib/format';

const DRAGGABLE_TYPES = new Set(['BOOKING', 'HOLD', 'MAINTENANCE', 'BLACKOUT']);
const CLICK_THRESHOLD_PX = 4;
const HOVER_DELAY_MS = 140;

export function EventBlock({
  event,
  leftPx,
  widthPx,
  hasConflict,
  pxPerHour,
  bookingColor,
  resourceName,
  crewFill,
  checkValid,
  onDrop,
  onClick,
}: {
  event: FacilityEvent;
  leftPx: number;
  widthPx: number;
  hasConflict: boolean;
  pxPerHour: number;
  bookingColor: { fill: string; border: string; textColor: string };
  resourceName: string;
  crewFill?: { filled: number; total: number } | null;
  checkValid: (start: Date, end: Date) => boolean;
  onDrop: (id: string, start: Date, end: Date, valid: boolean) => void;
  onClick: (event: FacilityEvent, anchorRect: DOMRect) => void;
}) {
  const [drag, setDrag] = useState<{ deltaPx: number; valid: boolean } | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moved = useRef(0);
  const draggable = DRAGGABLE_TYPES.has(event.eventType);

  function handleMouseEnter(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoverRect(rect), HOVER_DELAY_MS);
  }
  function handleMouseLeave() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    setHoverRect(null);
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (!draggable) return;
    e.preventDefault();
    const startClientX = e.clientX;
    const origStart = new Date(event.start);
    const origEnd = new Date(event.end);
    const anchorRect = e.currentTarget.getBoundingClientRect();
    moved.current = 0;

    function handleMove(ev: MouseEvent) {
      const rawDeltaPx = ev.clientX - startClientX;
      moved.current = Math.abs(rawDeltaPx);
      const deltaHours = rawDeltaPx / pxPerHour;
      const snapped = Math.round(deltaHours / SNAP_HOURS) * SNAP_HOURS;
      const snappedPx = snapped * pxPerHour;
      const newStart = new Date(origStart.getTime() + snapped * 3_600_000);
      const newEnd = new Date(origEnd.getTime() + snapped * 3_600_000);
      setDrag({ deltaPx: snappedPx, valid: checkValid(newStart, newEnd) });
    }

    function handleUp(ev: MouseEvent) {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);

      if (moved.current < CLICK_THRESHOLD_PX) {
        setDrag(null);
        onClick(event, anchorRect);
        return;
      }

      const rawDeltaPx = ev.clientX - startClientX;
      const deltaHours = rawDeltaPx / pxPerHour;
      const snapped = Math.round(deltaHours / SNAP_HOURS) * SNAP_HOURS;
      const newStart = new Date(origStart.getTime() + snapped * 3_600_000);
      const newEnd = new Date(origEnd.getTime() + snapped * 3_600_000);

      if (snapped !== 0) {
        onDrop(event.id, newStart, newEnd, checkValid(newStart, newEnd));
      }
      setDrag(null);
    }

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }

  // Only CONFIRMED bookings get the studio accent color — holds,
  // maintenance, blackouts and availability windows keep their universal
  // status colors so those signals never get diluted by which studio
  // they're in.
  const style = event.eventType === 'BOOKING' ? bookingColor : facilityEventStyle[event.eventType];
  const showConflict = hasConflict && !drag;
  const dragInvalid = drag && !drag.valid;
  const isAvailability = event.eventType === 'AVAILABILITY_WINDOW';
  const badgeCount = [event.linkedBookingSetId, event.seriesId, event.bookingGroupId].filter(Boolean).length;
  const crossesMidnight = toLocalDateString(new Date(event.start)) !== toLocalDateString(new Date(event.end));
  // Design idea: the show's real brand icon, shown in the hovercard header
  // rather than shrunk to fit the bar — these are detailed illustrated
  // marks that only read at real size, so a tiny persistent badge would
  // just blur them out.
  const showIcon = event.eventType === 'BOOKING' ? showIconFor(event.showKey, event.title ?? event.production) : undefined;

  const durationHours = (new Date(event.end).getTime() - new Date(event.start).getTime()) / 3_600_000;
  const hoverRows: HovercardRow[] = [
    {
      key: 'When',
      value: `${event.start.slice(0, 10)} · ${event.start.slice(11, 16)}–${event.end.slice(11, 16)} · ${formatHM(durationHours)}`,
    },
    { key: 'Where', value: resourceName },
  ];
  if (event.client) hoverRows.push({ key: 'Client', value: event.client });
  if (event.production && event.production !== event.title) hoverRows.push({ key: 'Production', value: event.production });
  if (crewFill && crewFill.total > 0) {
    hoverRows.push({
      key: 'Crew',
      value: `${crewFill.filled} of ${crewFill.total} filled${crewFill.filled < crewFill.total ? ` · ${crewFill.total - crewFill.filled} open` : ''}`,
    });
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => {
        if (isAvailability) onClick(event, e.currentTarget.getBoundingClientRect());
        e.stopPropagation();
      }}
      className={`absolute top-1.5 flex items-center gap-1 rounded-[4px] border px-1.5 transition-shadow
        ${draggable ? 'cursor-grab active:cursor-grabbing' : isAvailability ? 'cursor-pointer' : 'cursor-default'}
        ${drag ? 'z-20 shadow-lg' : 'z-0'}`}
      style={{
        left: leftPx + (drag?.deltaPx ?? 0),
        width: Math.max(widthPx, 6),
        height: 34,
        backgroundColor: showConflict ? conflictStyle.fill : style.fill,
        borderColor: dragInvalid ? '#E1543D' : showConflict ? conflictStyle.border : style.border,
        borderStyle: isAvailability ? 'dashed' : 'solid',
        borderWidth: dragInvalid ? 2 : 1,
        opacity: isAvailability ? 0.7 : 1,
      }}
    >
      {hoverRect && !drag && (
        <Hovercard
          anchorRect={hoverRect}
          accentColor={style.border}
          icon={showIcon ? <img src={showIcon} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" /> : undefined}
          title={event.title ?? (isAvailability ? 'Available' : event.eventType)}
          subtitle={event.status === 'HELD' ? 'Held' : event.status === 'CONFIRMED' ? 'Confirmed' : undefined}
          rows={hoverRows}
          warning={showConflict ? 'Clashes with another booking on this resource' : undefined}
        />
      )}
      {badgeCount > 0 && (
        <span className="flex shrink-0 items-center gap-0.5 opacity-80">
          {event.linkedBookingSetId && <Link2 size={9} />}
          {event.seriesId && <Repeat size={9} />}
          {event.bookingGroupId && <Users size={9} />}
        </span>
      )}
      <span
        className="truncate font-mono text-[10px] font-medium leading-none"
        style={{ color: showConflict ? conflictStyle.textColor : style.textColor }}
      >
        {event.title ?? (isAvailability ? 'Available' : event.eventType)}
      </span>
      {crossesMidnight && widthPx > 20 && (
        <MoveRight
          size={10}
          className="ml-auto shrink-0 opacity-70"
          style={{ color: showConflict ? conflictStyle.textColor : style.textColor }}
        />
      )}
    </div>
  );
}
