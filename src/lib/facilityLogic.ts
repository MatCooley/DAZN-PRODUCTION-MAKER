import type { FacilityEvent, Resource, BookingDraft } from './facilityTypes';
import { startOfWeekMonday } from './dateUtils';

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

// Expands a BookingDraft's recurrence into concrete {start, end} pairs.
// `date` is the anchor — the first occurrence's calendar date. repeatDays
// (0=Sun..6=Sat) selects which weekdays within the anchor's week (and
// every subsequent week) get an occurrence; any candidate date earlier
// than the anchor itself is skipped, so picking a Wednesday anchor with
// Mon/Tue also selected doesn't retroactively add bookings in the past —
// those weekdays simply start the following week.
export function generateOccurrences(draft: BookingDraft): { start: Date; end: Date }[] {
  const anchor = new Date(`${draft.date}T${draft.startTime}:00`);
  const anchorDay = new Date(`${draft.date}T00:00:00`);
  const days = draft.repeatDays.length > 0 ? draft.repeatDays : [anchorDay.getDay()];
  const weeks = Math.max(1, draft.repeatWeeks);
  const monday = startOfWeekMonday(anchorDay);
  const endBoundary = draft.endDate ? new Date(`${draft.endDate}T23:59:59`) : null;

  const occurrences: { start: Date; end: Date }[] = [];
  for (let w = 0; w < weeks; w++) {
    for (const dow of days) {
      const offsetFromMonday = dow === 0 ? 6 : dow - 1; // Mon=0 ... Sun=6
      const occurrenceDay = new Date(monday);
      occurrenceDay.setDate(monday.getDate() + w * 7 + offsetFromMonday);
      if (occurrenceDay.getTime() < anchorDay.getTime()) continue; // before the chosen start date
      if (endBoundary && occurrenceDay.getTime() > endBoundary.getTime()) continue; // past the chosen end date

      const start = new Date(occurrenceDay);
      start.setHours(anchor.getHours(), anchor.getMinutes(), 0, 0);
      const end = new Date(start.getTime() + draft.durationHours * 3_600_000);
      occurrences.push({ start, end });
    }
  }
  return occurrences.sort((a, b) => a.start.getTime() - b.start.getTime());
}

// For a NEW booking (no existing event to exclude) spanning one or more
// resources (e.g. a Studio A CR+Floor pair). Returns which existing
// event titles would block it, if any, so the wizard/UI can show why.
export function checkResourcesFree(
  resourceIds: string[],
  start: Date,
  end: Date,
  events: FacilityEvent[]
): { free: boolean; blockedBy: string[] } {
  const blockedBy: string[] = [];
  for (const resourceId of resourceIds) {
    const onResource = events.filter((e) => e.resourceId === resourceId && e.isBlocking && e.status !== 'CANCELLED');
    for (const e of onResource) {
      if (overlaps(new Date(e.start), new Date(e.end), start, end)) {
        blockedBy.push(e.title ?? e.eventType);
      }
    }
  }
  return { free: blockedBy.length === 0, blockedBy };
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
