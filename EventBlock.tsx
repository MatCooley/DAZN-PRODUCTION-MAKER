import { useRef, useState } from 'react';
import type { FacilityEvent } from '../../lib/facilityTypes';
import { PX_PER_HOUR, SNAP_HOURS, conflictStyle, facilityEventStyle } from '../../lib/facilityVisuals';

const DRAGGABLE_TYPES = new Set(['BOOKING', 'HOLD', 'MAINTENANCE', 'BLACKOUT']);
const CLICK_THRESHOLD_PX = 4;

export function EventBlock({
  event,
  leftPx,
  widthPx,
  hasConflict,
  checkValid,
  onCommit,
  onClick,
}: {
  event: FacilityEvent;
  leftPx: number;
  widthPx: number;
  hasConflict: boolean;
  checkValid: (start: Date, end: Date) => boolean;
  onCommit: (id: string, start: Date, end: Date) => void;
  onClick: (event: FacilityEvent) => void;
}) {
  const [drag, setDrag] = useState<{ deltaPx: number; valid: boolean } | null>(null);
  const moved = useRef(0);
  const draggable = DRAGGABLE_TYPES.has(event.eventType);

  function handleMouseDown(e: React.MouseEvent) {
    if (!draggable) return;
    e.preventDefault();
    const startClientX = e.clientX;
    const origStart = new Date(event.start);
    const origEnd = new Date(event.end);
    moved.current = 0;

    function handleMove(ev: MouseEvent) {
      const rawDeltaPx = ev.clientX - startClientX;
      moved.current = Math.abs(rawDeltaPx);
      const deltaHours = rawDeltaPx / PX_PER_HOUR;
      const snapped = Math.round(deltaHours / SNAP_HOURS) * SNAP_HOURS;
      const snappedPx = snapped * PX_PER_HOUR;
      const newStart = new Date(origStart.getTime() + snapped * 3_600_000);
      const newEnd = new Date(origEnd.getTime() + snapped * 3_600_000);
      setDrag({ deltaPx: snappedPx, valid: checkValid(newStart, newEnd) });
    }

    function handleUp(ev: MouseEvent) {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);

      if (moved.current < CLICK_THRESHOLD_PX) {
        setDrag(null);
        onClick(event);
        return;
      }

      const rawDeltaPx = ev.clientX - startClientX;
      const deltaHours = rawDeltaPx / PX_PER_HOUR;
      const snapped = Math.round(deltaHours / SNAP_HOURS) * SNAP_HOURS;
      const newStart = new Date(origStart.getTime() + snapped * 3_600_000);
      const newEnd = new Date(origEnd.getTime() + snapped * 3_600_000);

      if (snapped !== 0 && checkValid(newStart, newEnd)) {
        onCommit(event.id, newStart, newEnd);
      }
      setDrag(null);
    }

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }

  const style = facilityEventStyle[event.eventType];
  const showConflict = hasConflict && !drag;
  const dragInvalid = drag && !drag.valid;

  const isAvailability = event.eventType === 'AVAILABILITY_WINDOW';

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        if (isAvailability) onClick(event);
        e.stopPropagation();
      }}
      className={`absolute top-1.5 flex items-center overflow-hidden rounded-[4px] border px-1.5 transition-shadow
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
      title={`${event.title ?? event.eventType} — ${event.start.slice(11, 16)}–${event.end.slice(11, 16)}`}
    >
      <span
        className="truncate font-mono text-[10px] font-medium leading-none"
        style={{ color: showConflict ? conflictStyle.textColor : style.textColor }}
      >
        {event.title ?? (isAvailability ? 'Available' : event.eventType)}
      </span>
    </div>
  );
}
