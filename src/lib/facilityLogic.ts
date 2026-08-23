import type { FacilityEvent, Resource } from './facilityTypes';

// Half-open interval overlap: A_start < B_end AND B_start < A_end.
// Back-to-back events (10:00–11:00, 11:00–12:00) correctly do NOT overlap.
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

export interface ConflictMap {
  // eventId -> ids of other events it conflicts with
  [eventId: string]: string[];
}

export function computeConflicts(events: FacilityEvent[]): ConflictMap {
  const map: ConflictMap = {};
  const blocking = events.filter((e) => e.isBlocking && e.status !== 'CANCELLED');

  for (const resourceId of new Set(blocking.map((e) => e.resourceId))) {
    const onResource = blocking.filter((e) => e.resourceId === resourceId);
    for (let i = 0; i < onResource.length; i++) {
      for (let j = i + 1; j < onResource.length; j++) {
        const a = onResource[i];
        const b = onResource[j];
        // Pairs sharing a bookingGroupId are an intentional, allowed
        // overlap (different client/production codes within one
        // shift's occupancy) — skip, mirroring v_resource_conflicts.
        const sameGroup = a.bookingGroupId && b.bookingGroupId && a.bookingGroupId === b.bookingGroupId;
        if (sameGroup) continue;
        if (overlaps(new Date(a.start), new Date(a.end), new Date(b.start), new Date(b.end))) {
          (map[a.id] ??= []).push(b.id);
          (map[b.id] ??= []).push(a.id);
        }
      }
    }
  }
  return map;
}

// Mirrors is_resource_available(): bookable AND inside an availability
// window AND no blocking event overlaps — an empty cell is never
// enough on its own.
export function isResourceAvailable(
  resource: Resource,
  start: Date,
  end: Date,
  events: FacilityEvent[],
  excludeEventId?: string
): boolean {
  if (!resource.isBookable) return false;

  const onResource = events.filter((e) => e.resourceId === resource.id && e.id !== excludeEventId);

  const insideWindow = onResource.some(
    (e) =>
      e.eventType === 'AVAILABILITY_WINDOW' &&
      new Date(e.start).getTime() <= start.getTime() &&
      new Date(e.end).getTime() >= end.getTime()
  );
  if (!insideWindow) return false;

  const blockingConflict = onResource.some(
    (e) => e.isBlocking && e.status !== 'CANCELLED' && overlaps(new Date(e.start), new Date(e.end), start, end)
  );

  return !blockingConflict;
}
